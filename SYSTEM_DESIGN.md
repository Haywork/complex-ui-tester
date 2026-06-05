# System Design

This is a cross-doc map of the `complex-ui-tester` system. It does not duplicate detail from the numbered docs; it answers the question "where in the docs do I find the design decision for X?" for any reader. Use it as a lookup index.

| Field | Value |
|---|---|
| Last reviewed | 2026-05-26 |
| Owner | ryan@speechlab.ai |
| Companion docs | [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/README.md`](./docs/README.md) |

---

## 1. System boundary

| Inside the system | Outside the system (consumed) | Outside the system (produced) |
|---|---|---|
| OSS library packages (`@cuit/*`) | Session-source vendors (Jam, LogRocket, Sentry Replay, FullStory, Datadog RUM) | Generated `spec.ts` files in the customer's GitHub repo |
| SaaS control plane (tenants, billing, auth, audit, GitHub App) | LLM providers (Anthropic, OpenAI) | PR notifications, status page updates |
| Session ingestion pipeline | The customer's dev/staging URLs (we run specs against these) | Per-tenant audit logs (exposed via API) |
| AI Extractor (3-pass LLM pipeline) | The customer's Playwright + harness install (runtime dependency) | Run results, screenshots, video artefacts |
| Spec Runner cluster | AWS managed services (Aurora, S3, ECS, EKS, SQS, KMS, Cognito) | Cost ledger events (to Stripe) |
| Storage (Aurora, S3, Redis) | | |

---

## 2. Subsystem-to-doc map

| Subsystem | Primary doc | Supplementary |
|---|---|---|
| Harness primitives (Layers 1–6) | [`02 §3`](./docs/02-library-architecture.md) | [`01 §2.2`](./docs/01-product-spec.md) — evidence |
| Adapter surface (Layer 11) | [`02 §7`](./docs/02-library-architecture.md) | [`10`](./docs/10-adapter-spec.md) — per-vendor |
| AI extractor (Layer 12) | [`04`](./docs/04-ai-spec-generation.md) | [`03 §5`](./docs/03-saas-platform.md) — infra placement; [`07`](./docs/07-data-platform-and-feedback-loops.md) — context source |
| Per-tenant data assets & feedback loop | [`07`](./docs/07-data-platform-and-feedback-loops.md) | [`04 §5`](./docs/04-ai-spec-generation.md) — prompt caching |
| Customer experience & product surface | [`08`](./docs/08-customer-experience.md) | [`03 §3`](./docs/03-saas-platform.md) — control-plane services |
| Go-to-market & pricing | [`09`](./docs/09-go-to-market.md) | [`01 §10`](./docs/01-product-spec.md) — year-1 milestones |
| Multi-tenant control plane | [`03 §3`](./docs/03-saas-platform.md) | [`05 §1`](./docs/05-security-compliance.md) — isolation |
| Session ingestion | [`03 §4`](./docs/03-saas-platform.md) | [`10`](./docs/10-adapter-spec.md) — per-vendor; [`07 §5`](./docs/07-data-platform-and-feedback-loops.md) — pipeline |
| Spec runner cluster | [`03 §7`](./docs/03-saas-platform.md) | [`06 §7`](./docs/06-operations-sre.md) — capacity |
| GitHub App | [`03 §3.4`](./docs/03-saas-platform.md) | [`05 §2`](./docs/05-security-compliance.md) — token scope |
| Billing + metering | [`03 §6`](./docs/03-saas-platform.md) | [`04 §9-10`](./docs/04-ai-spec-generation.md) — token costs |
| Observability stack | [`06 §3`](./docs/06-operations-sre.md) | [`03 §10`](./docs/03-saas-platform.md) |
| Threat model | [`05 §1`](./docs/05-security-compliance.md) | — |
| SOC 2 controls | [`05 §2`](./docs/05-security-compliance.md) | [`06`](./docs/06-operations-sre.md) — operational controls |

---

## 3. Decision log

Major design decisions and where the rationale lives. Use this when a reviewer asks "why did we choose X over Y?".

| Decision | Choice | Alternative considered | Rationale doc |
|---|---|---|---|
| Library license | MIT/Apache-2.0 dual | BSL, Elastic License | [`01 §0`](./docs/01-product-spec.md) — adoption gating |
| Library monorepo tooling | pnpm + Turborepo + tsup + Vitest + Changesets | Nx, Lerna, plain yarn workspaces | [`02 §2`](./docs/02-library-architecture.md) |
| Telemetry boundary | Physical (separate package) | Policy / env-var opt-out | [`02 §0`](./docs/02-library-architecture.md), [`05 §4`](./docs/05-security-compliance.md) |
| State adapter | Plugin interface (Zustand/Redux/Pinia/MobX) | Hard-coded Zustand | [`02 §3.3`](./docs/02-library-architecture.md) |
| Cloud platform | AWS | GCP, multi-cloud | [`03 §1`](./docs/03-saas-platform.md) — auditor familiarity, managed services |
| Container orchestration | ECS Fargate for stateful services, EKS for runners | All EKS, all Fargate | [`03 §2`](./docs/03-saas-platform.md) |
| Database | Aurora PostgreSQL 16, multi-AZ | DynamoDB, RDS Postgres | [`03 §8`](./docs/03-saas-platform.md) |
| Tenant isolation in DB | Row-level security + `app.current_tenant_id` GUC | Schema-per-tenant, DB-per-tenant | [`05 §1`](./docs/05-security-compliance.md) |
| LLM orchestration | LangGraph, 3-pass | Single-pass, agent-loop | [`04 §2`](./docs/04-ai-spec-generation.md) |
| LLM model routing | Cascading tiers (Haiku → Sonnet → Opus) | Single model | [`04 §3`](./docs/04-ai-spec-generation.md) — cost/quality |
| Grounding strategy | AST validation against primitive registry | Prompt-only, prose-rules | [`04 §6`](./docs/04-ai-spec-generation.md) |
| Spec merge policy | Human review required (no auto-merge) | Auto-merge on high confidence | [`04 §7`](./docs/04-ai-spec-generation.md), [`01 §3.2`](./docs/01-product-spec.md) — non-goal |
| Customer-cloud option | Yes for enterprise (self-hosted runner) | SaaS-only | [`05 §6`](./docs/05-security-compliance.md) |
| Auth provider | Cognito (consumers) + Auth0 (enterprise SSO) | Single Cognito, single Auth0 | [`03 §3.1`](./docs/03-saas-platform.md) |
| Per-tenant SQS | FIFO queue per tenant for runner | One shared queue with priority | [`03 §7.2`](./docs/03-saas-platform.md) |
| Backup posture | PITR for Aurora, versioning for S3, no Redis backup | Snapshots only | [`06 §11`](./docs/06-operations-sre.md) |

---

## 4. Critical interfaces

The interfaces that, if broken, break the product:

### 4.1 `SessionEvent[]` — the canonical event schema

The normalized representation every adapter emits and the AI extractor consumes. Stability is non-negotiable post v1.0.

- Schema: [`02 §7.2`](./docs/02-library-architecture.md)
- Per-vendor mapping: [`10`](./docs/10-adapter-spec.md)
- Versioning policy: [`02 §11`](./docs/02-library-architecture.md)

### 4.2 Harness primitive registry

The typed list of primitives the LLM may emit. Adding a primitive is a backward-compatible change; removing one is a breaking change.

- Registry: [`02 §3.1`](./docs/02-library-architecture.md)
- LLM grounding contract: [`04 §6`](./docs/04-ai-spec-generation.md)
- AST validation rules: [`04 §6.3`](./docs/04-ai-spec-generation.md)

### 4.3 Tenant credential vault

How customer connector tokens (Jam API key, LogRocket bearer, etc.) are stored, rotated, audited.

- Storage: [`05 §2.3`](./docs/05-security-compliance.md)
- Rotation policy: [`05 §2.4`](./docs/05-security-compliance.md)
- Audit trail: [`05 §3`](./docs/05-security-compliance.md)

### 4.4 GitHub App permissions

The minimum scopes required to open a PR with a generated spec. Over-scoped tokens are an audit finding.

- Scope list: [`03 §3.4`](./docs/03-saas-platform.md)
- Webhook handler: [`03 §3.4`](./docs/03-saas-platform.md)
- Token storage: [`05 §2.3`](./docs/05-security-compliance.md)

---

## 5. Non-functional requirements

| NFR | Target | Doc | Why this target |
|---|---|---|---|
| OSS library bundle size (`@cuit/core` min+gzip) | < 50 KB | [`02 §1.1`](./docs/02-library-architecture.md) | Adoption gate — must not bloat customer bundle |
| 1-hour onboarding (library) | Enforceable by `cuit doctor` | [`02 §6`](./docs/02-library-architecture.md) | Year-1 design-partner promise |
| End-to-end session-to-spec turnaround | p95 < 8min | [`06 §1`](./docs/06-operations-sre.md) | Engineer flow state; > 8min loses the loop |
| LLM cost per spec generation | < $0.50 all-in | [`04 §9`](./docs/04-ai-spec-generation.md) | Unit economics at $5–$25 list price |
| Prompt cache hit rate | > 70% | [`04 §5`](./docs/04-ai-spec-generation.md) | Cost target depends on this |
| Tier 1 control-plane availability | 99.9% | [`06 §1`](./docs/06-operations-sre.md) | Enterprise SLA floor |
| Cross-tenant data leak rate | Zero, verified by IDOR fuzz in CI | [`05 §1`](./docs/05-security-compliance.md) | Compliance and trust |
| Spec false-positive rate (RED on correct code) | < 5%, monitored per tenant | [`04 §8`](./docs/04-ai-spec-generation.md) | Higher rate destroys engineer trust |

---

## 6. Where this doc is silent

This system-design map intentionally does not cover:

- **Implementation details** — class names, file paths, function signatures. Those belong in the per-package READMEs once code is written.
- **Operational procedures** — see [`docs/06-operations-sre.md`](./docs/06-operations-sre.md).
- **Per-vendor adapter behaviour** — see [`docs/10-adapter-spec.md`](./docs/10-adapter-spec.md).
- **Pricing and packaging** — see [`docs/09-go-to-market.md`](./docs/09-go-to-market.md).
- **Customer-facing surfaces** — see [`docs/08-customer-experience.md`](./docs/08-customer-experience.md).
- **The data moat / feedback loops** — see [`docs/07-data-platform-and-feedback-loops.md`](./docs/07-data-platform-and-feedback-loops.md).

If you are reading this doc and need one of the above, follow the link.
