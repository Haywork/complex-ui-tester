---
title: QA Data Warehouse — what the SaaS centralizes
owner: ryan@speechlab.ai
last-reviewed: 2026-06-05
status: draft v1
audience: engineering leaders evaluating the SaaS, integration engineers
related:
  - 03-saas-platform.md
  - 05-security-compliance.md
  - 07-data-platform-and-feedback-loops.md
  - 11-recorder-extension.md
---

# 12. QA Data Warehouse — what the SaaS centralizes

This document is the authoritative design for the **org-wide QA data
warehouse**: the multi-tenant data plane where every captured session,
generated spec, run result, and accept/reject signal accumulates into a
queryable corpus. It is the load-bearing answer to *"why pay for the
SaaS when the OSS library is free?"*

The OSS library runs on one developer's laptop and produces one
regression spec. The SaaS centralizes everything every developer
captures into one place — versioned against your code, processed into
derived signal, queryable from a dashboard, a REST API, and an MCP
server that any agentic coding model can use mid-task.

---

## 1. The OSS-vs-SaaS buy-vs-build line

| Capability | OSS (laptop) | SaaS (org) |
|---|---|---|
| Run the recorder + harness + spec-gen on one session | ✓ | ✓ |
| Spec output as a `.spec.ts` file | ✓ | ✓ |
| One developer's loop | ✓ | ✓ |
| Sessions persist beyond the developer who captured them | — | ✓ |
| Cross-developer dedup ("did anyone else file this?") | — | ✓ |
| Versioned against git SHA | — | ✓ |
| Replay year-old sessions on current code | — | ✓ |
| Per-component flake rate, reopen rate, time-to-fix | — | ✓ |
| Per-tenant selector dictionary + bug-class corpus | — | ✓ |
| Queryable from a dashboard | — | ✓ |
| Queryable from a REST API | — | ✓ |
| Queryable from an MCP server | — | ✓ |
| SOC 2 Type II report | — | ✓ |
| Per-tenant KMS encryption | — | ✓ |

The OSS column is what a solo developer or a small team gets for free
forever. The SaaS column is what the team gets the moment its session
count exceeds one developer's working memory — generally around 5-10
captured sessions per week per team.

---

## 2. Data model

The warehouse stores six entity classes. All are scoped to a `tenant_id`
and protected by Postgres RLS per [doc 05 §1](./05-security-compliance.md).

### 2.1 `sessions`

The raw captured `SessionEvent[]` from the recorder (or normalized from
a third-party adapter per [doc 10](./10-adapter-spec.md)).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `tenant_id` | UUID | RLS partition key |
| `session_id` | text | client-supplied (from recorder) |
| `vendor` | enum | `cuit` / `jam` / `logrocket` / `sentry-replay` / `fullstory` / `datadog-rum` |
| `created_at` | timestamptz | when capture started |
| `git_sha` | text | git revision the customer's app was on at capture (optional but encouraged) |
| `git_branch` | text | branch name |
| `url` | text | page URL at capture |
| `events` | jsonb | the full `SessionEvent[]` array |
| `event_count` | int | denormalized for fast filters |
| `pointer_count` | int | denormalized |
| `snapshot_count` | int | denormalized |
| `captured_by_user_id` | UUID | nullable; for self-serve, who recorded |
| `pii_redacted_at` | timestamptz | nullable; set when PII scrubbing ran |

Indexes: `(tenant_id, created_at DESC)`, `(tenant_id, git_sha)`,
`(tenant_id, vendor)`. A pgvector index on a 1536-dim embedding of the
event sequence enables similar-session lookup (§5.3 query patterns).

### 2.2 `specs`

The generated `.spec.ts` artifact and metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `tenant_id` | UUID | RLS partition |
| `session_id` | UUID | references `sessions.id` |
| `model_version` | text | spec-gen prompt-version that produced this spec |
| `primitives` | jsonb | the `Primitive[]` array |
| `serialized` | text | the rendered `.spec.ts` source |
| `confidence` | numeric(3,2) | 0.00–1.00 |
| `auto_pr_eligible` | boolean | `confidence >= tenant.autopr_threshold` |
| `created_at` | timestamptz | |

### 2.3 `runs`

Every execution of a spec. Multiple per spec over its lifetime.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `tenant_id` | UUID | RLS partition |
| `spec_id` | UUID | references `specs.id` |
| `outcome` | enum | `red` / `green` / `error` |
| `browser` | enum | `chromium` / `firefox` / `webkit` / `jsdom` |
| `duration_ms` | int | |
| `git_sha_at_run` | text | what code the spec ran against |
| `is_flake` | boolean | set when the same `(spec_id, git_sha)` produced disagreeing outcomes |
| `created_at` | timestamptz | |

### 2.4 `bug_classes`

Higher-level groupings derived from clustering specs by their failure
mode. Used to surface "drag-collision-style bugs" or "rAF-timing-style
bugs" as a tenant-level dashboard metric.

### 2.5 `signals`

Engineer-emitted feedback on a generated spec or proposed fix:
`accepted` / `edited` / `rejected` / `regression-caught`. Per
[doc 07 §4](./07-data-platform-and-feedback-loops.md) these drive the
weekly tuning cycle.

### 2.6 `audit_log`

Append-only stream of every read and write against `sessions`, `specs`,
`runs`. Exportable to the customer's SIEM. Required for SOC 2 evidence.

---

## 3. Versioning

Three things are versioned, and the warehouse keeps the join keys for
all of them:

| Versioned object | Where the version lives | What you can do with it |
|---|---|---|
| The captured session | `sessions.git_sha`, `sessions.git_branch` | "What did the app look like when this bug was captured?" |
| The generated spec | `specs.model_version` | "Which prompt version generated this spec? Was it regressive vs. the previous prompt?" |
| The run | `runs.git_sha_at_run` | "Did this spec flip from GREEN to RED between commit A and commit B?" |

A session captured a year ago can be **replayed against current code**.
This is the key capability that "ephemeral on a laptop" cannot deliver:
when you suspect a regression was introduced six weeks ago, you can
walk every spec generated from sessions in the affected component
backwards through time and find the commit that flipped the outcome.

---

## 4. Storage & infrastructure

Builds on [doc 03 §8](./03-saas-platform.md):

- Aurora PostgreSQL 16 with `pgvector` extension — `sessions`, `specs`,
  `runs`, `bug_classes`, `signals`, `audit_log` all live here.
- S3 with per-tenant prefix + per-tenant KMS CMK — raw recorder JSON
  blobs > 256KB are spilled to S3; Aurora holds the metadata.
- ElastiCache Redis — query result cache (5-min TTL), session embedding
  cache.
- Datadog APM + per-tenant log streams (`tenant_id` is a required log
  field per [doc 06 §3](./06-operations-sre.md)).

Per-tenant CMK rotation: annual. Cross-tenant data isolation enforced
by:
1. Aurora row-level security policies on every table
2. Per-request `app.current_tenant_id` GUC set before any query
3. Per-tenant S3 prefixes with separate KMS keys
4. IDOR fuzz test in CI on every API route

---

## 5. REST API

Bearer-token auth (Cognito JWT). Per-tenant rate limit: 1000 req/min
on Team, 10000 req/min on Business+. OpenAPI 3.1 spec published at
`https://api.cuit.dev/v1/openapi.json`.

### 5.1 Sessions

```
GET  /v1/sessions                         List sessions (paginated)
POST /v1/sessions                         Upload a captured session
GET  /v1/sessions/:id                     Fetch one session
GET  /v1/sessions/:id/similar             Find sessions with similar event signatures
DELETE /v1/sessions/:id                   Hard-delete (audited)
GET  /v1/sessions/:id/replay              Server-side replay against a given git SHA
```

### 5.2 Specs

```
POST /v1/specs/generate                   Generate a spec from a session payload
GET  /v1/specs/:id                        Fetch a spec
GET  /v1/specs/:id/runs                   Run history for this spec
POST /v1/specs/:id/run                    Trigger a run against a customer URL
```

### 5.3 Insights

```
GET  /v1/insights/bug-classes             Cluster bugs by failure mode
GET  /v1/insights/flake-rate              Per-component CI flake rate (28d default)
GET  /v1/insights/reopen-rate             Per-component reopen rate
GET  /v1/insights/time-to-fix             Distribution of capture-to-GREEN latency
GET  /v1/insights/coverage                What fraction of captured bugs produced an accepted spec
```

### 5.4 Audit

```
GET  /v1/audit?since=...&actor=...        Stream the audit log for an export
```

Every endpoint returns 401 if the bearer token is missing, 403 if the
token's `tenant_id` does not match the resource, 429 on rate-limit
exceeded.

---

## 6. MCP server

Source: [`packages/cuit-mcp/`](../proof-of-concept/packages/cuit-mcp/)
*(planned for v0.2 — interface frozen now so customer code can target it)*.

The MCP server lets Claude Code, Cursor, Aider, and any other MCP
client query the warehouse mid-task. The tools surfaced:

| Tool | Purpose |
|---|---|
| `cuit__query_sessions(predicate, limit)` | Return sessions matching a predicate (interaction type, outcome, time window). |
| `cuit__find_similar_sessions(referenceId, threshold)` | Vector-similarity search against the corpus. |
| `cuit__bug_class_distribution(groupBy, metric, since)` | Aggregate bug-class stats. |
| `cuit__flake_rate(component, window)` | Per-component flake rate. |
| `cuit__regression_test_for_pr(prUrl)` | Given a PR URL, return the set of generated specs likely to gate it. |
| `cuit__generate_spec_from_session(sessionId)` | Trigger spec generation against a stored session. |
| `cuit__run_spec(specId, targetUrl)` | Trigger a run against a customer URL. |
| `cuit__audit_export(since, until)` | Export audit log for compliance. |

Auth: bearer token issued by the SaaS control plane and pinned to the
tenant. The MCP server runs as a single process per tenant in v0.2;
multi-tenant pooling is a v0.3 hardening.

A reference MCP client config — copy into Claude Code's settings:

```jsonc
{
  "mcpServers": {
    "cuit": {
      "command": "npx",
      "args": ["-y", "@cuit/mcp"],
      "env": {
        "CUIT_API_TOKEN": "your-tenant-bearer-token",
        "CUIT_API_URL": "https://api.cuit.dev"
      }
    }
  }
}
```

---

## 7. Sample queries

A team lead's Monday morning:

1. **"What broke over the weekend?"**
   ```
   GET /v1/insights/flake-rate?since=72h&groupBy=spec_id&trend=true
   ```
   Returns specs whose flake rate spiked in the last 72 hours.

2. **"Did anyone file this drag bug already?"** *(via Claude Code MCP)*
   ```
   cuit__find_similar_sessions({ referenceId: "rec-2014", threshold: 0.85 })
   ```
   Returns the top-5 similar sessions from any team member's captures.

3. **"Show me the bug-class distribution this quarter."**
   ```
   GET /v1/insights/bug-classes?since=q-current
   ```
   Returns counts and trend lines per cluster ("drag-collision",
   "rAF-timing", "stale-ref-after-unmount", etc.).

4. **"Which components have the worst reopen rate?"**
   ```
   GET /v1/insights/reopen-rate?groupBy=component&order=desc&limit=10
   ```
   The 10 components whose bugs reopen most often. Where to spend the
   refactor budget.

5. **"Re-run every drag spec against tonight's main."**
   ```
   GET /v1/specs?interaction=drag → POST /v1/specs/:id/run
   ```
   Catches regressions ahead of the morning standup.

---

## 8. Security & privacy

Cross-references [doc 05](./05-security-compliance.md).

- Aurora RLS on every table, no exceptions.
- Per-tenant S3 prefix + KMS CMK, annual rotation.
- Bearer-token auth via Cognito JWT, RS256.
- PII scrubbing at the recorder boundary (per [doc 11 §8](./11-recorder-extension.md))
  before sessions land in the warehouse.
- Audit log is append-only, exportable, retained 13 months minimum.
- DPA / MSA / BAA available on Business+ tier.

---

## 9. Customer data ownership

Per the customer-data commitments in [doc 07 §9](./07-data-platform-and-feedback-loops.md):

- The customer owns their sessions, specs, runs, and signals.
- Export available on request (signed S3 URLs + Postgres dump per
  tenant) within 5 business days.
- Hard-deletion of all per-tenant data within 30 days of a documented
  request.
- Customer can take their data with them on exit; cross-tenant insights
  (anonymized, k-anonymous) remain.

---

## 10. Roadmap

### v0.2 (Q3 2026)

- MCP server (`@cuit/mcp`) ships with the 8 tools listed in §6.
- REST API v1 published (currently planned but unshipped).
- Dashboard queries land for the four insight endpoints in §5.3.

### v0.3 (Q1 2027)

- pgvector → Pinecone migration option for high-throughput Enterprise
  customers.
- Real-time dashboards (currently 5-minute cache TTL).
- Customer-supplied SQL views (read-only) into their tenant's data.

### v0.4 (Q3 2027)

- Cross-tenant opt-in insight benchmarks (per [doc 07 §8](./07-data-platform-and-feedback-loops.md)).
- Federated query across multi-region tenant shards.

---

*End of `12-qa-data-warehouse.md`. For the data-platform internals that
power this warehouse — selector dictionary, bug-class corpus, weekly
tuning cycle — read [`07-data-platform-and-feedback-loops.md`](./07-data-platform-and-feedback-loops.md).*
