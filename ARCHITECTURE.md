# Architecture

This is the top-level architecture summary for `complex-ui-tester`. It is intentionally short — detail lives in the numbered design docs under [`docs/`](./docs/README.md). Read this first to orient; follow the cross-references for depth.

| Field | Value |
|---|---|
| Last reviewed | 2026-05-26 |
| Owner | ryan@speechlab.ai |
| Status | Draft v1 — implementation has not started |
| Authoritative detail | See `docs/02-library-architecture.md` and `docs/03-saas-platform.md` |

---

## 1. Product shape

`complex-ui-tester` is a hybrid of two artefacts that share one purpose:

1. **An OSS library** — `@cuit/*` npm packages, MIT/Apache-2.0 dual-licensed. The harness primitives that make complex UIs deterministically testable: state snapshots, deterministic clock injection, synthetic interaction dispatch, mutation observers, framework adapters, session-source adapters.
2. **A SaaS platform** — commercial. The LLM pipeline that converts a recorded user session into a Playwright spec; the managed runner cluster that executes specs; the multi-tenant control plane (auth, RBAC, billing, audit, connector credentials, GitHub App, SOC 2).

The library has no network code and no telemetry. The SaaS is opt-in via a separately imported `@cuit/saas-connector` package. The boundary is **physical**, not policy.

Full product narrative: [`docs/01-product-spec.md`](./docs/01-product-spec.md).

---

## 2. The 12-layer harness

The harness is conceptually 12 layers. The first 6 are working code in [PR #1995](https://github.com/speechlabinc/translate-ui-react/pull/1995); the rest are the productized extensions.

| Layer | Name | Status | Where it lives |
|---|---|---|---|
| 1 | State snapshots (`window.__waveformDebug.getState()`-style) | Shipping | `@cuit/core` |
| 2 | Deterministic clock (`rafScheduler.setClock`) | Shipping | `@cuit/core` |
| 3 | Synthetic dispatch (`dispatchDrag`, `dispatchResize`, `seekTo`) | Shipping | `@cuit/core` |
| 4 | Real CDP events | Shipping | `@cuit/playwright` |
| 5 | Wheel/touch dispatch | Shipping | `@cuit/core` |
| 6 | DOM mutation + instance counter + CSS observer | Shipping | `@cuit/core` |
| 7 | Session normalization | Planned | `@cuit/adapters-*` |
| 8 | Confidence scoring | Planned | SaaS — see doc 04 |
| 9 | Eval harness | Planned | SaaS — see doc 04 |
| 10 | Cost-aware model routing | Planned | SaaS — see doc 04 |
| 11 | Adapter surface | Planned | `@cuit/adapters-*`, see doc 10 |
| 12 | AI step extraction (session → spec) | Planned | SaaS — see doc 04 |
| 0  | First-party recorder & Chrome extension | **Shipping** | `@cuit/recorder`, `@cuit/recorder-extension`, see doc 11 |

Layers 1–6 are validated against 8 historical SpeechLab waveform bugs. Layer 12 is the differentiator — its full architecture is in [`docs/04-ai-spec-generation.md`](./docs/04-ai-spec-generation.md).

---

## 3. Major components

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            OSS Library (@cuit/*)                             │
│                                                                              │
│   @cuit/core                @cuit/react             @cuit/playwright         │
│   ─ harness primitives      ─ React adapter         ─ Playwright bindings    │
│   ─ deterministic clock     ─ state snapshot hook   ─ dispatch helpers       │
│   ─ synthetic dispatch                                                       │
│                                                                              │
│   @cuit/vue                 @cuit/adapters-*        @cuit/saas-connector     │
│   ─ Vue adapter             ─ session-source        ─ opt-in SaaS link       │
│                               normalizers          (separate package!)       │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (only if customer installs saas-connector)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            SaaS Platform (AWS)                               │
│                                                                              │
│   Edge / Auth                Control Plane           Session Ingestion       │
│   ─ API Gateway              ─ Tenant Mgmt API       ─ Connector workers     │
│   ─ WAF                      ─ Billing + Metering    ─ Normalizer            │
│   ─ Cognito + Auth0          ─ Audit log             ─ DLQ                   │
│                              ─ GitHub App                                    │
│                                                                              │
│   AI Extractor               Spec Runner             Storage                 │
│   ─ LLM Orchestrator         ─ Runner Queue          ─ Aurora PG16           │
│     (LangGraph, 3-pass)      ─ KEDA scheduler        ─ S3 (raw + spec)       │
│   ─ Extraction cache         ─ Playwright pods       ─ ElastiCache Redis     │
│   ─ Token meter              ─ Result collector                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Detailed service map: [`docs/03-saas-platform.md §1`](./docs/03-saas-platform.md). LLM subsystem detail: [`docs/04-ai-spec-generation.md`](./docs/04-ai-spec-generation.md).

---

## 4. Key data flows

### 4.1 Session → spec

1. Customer browser session is recorded by Jam / LogRocket / Sentry Replay / FullStory / Datadog RUM.
2. SaaS connector worker pulls (or receives push from) the vendor, normalizes to `SessionEvent[]` via the adapter for that vendor.
3. Normalized events written to S3 (raw) + Aurora (metadata).
4. AI Extractor runs a 3-pass pipeline (intent → ground → materialize) producing a `spec.ts` file that uses only harness primitives.
5. Runner cluster executes the spec against the customer's dev / staging URL.
6. If the spec is RED on pre-fix code, GitHub App opens a PR with the spec.
7. Engineer reviews, ships a fix; spec turns GREEN; CI gates it forever.

### 4.2 Library-only adoption (no SaaS)

1. Customer installs `@cuit/core` + framework adapter.
2. Customer wires `rafScheduler.setClock` in their app entry (3 lines).
3. Customer writes Playwright specs that call `dispatchDrag` / `getStateSnapshot` directly.
4. No data leaves the customer's network.

The library is useful even with zero adoption of the SaaS. The SaaS exists to automate step 3 of the OSS path — turning a recorded session into the spec a human would otherwise write by hand.

---

## 5. Cross-cutting concerns

| Concern | Authoritative doc |
|---|---|
| Threat model, control mapping, SOC 2 posture | [`docs/05-security-compliance.md`](./docs/05-security-compliance.md) |
| SLOs, on-call, deploys, capacity, runbooks | [`docs/06-operations-sre.md`](./docs/06-operations-sre.md) |
| Per-tenant cost accounting, token budgets | [`docs/03-saas-platform.md §6`](./docs/03-saas-platform.md) + [`docs/04 §9-10`](./docs/04-ai-spec-generation.md) |
| First-party recorder + Chrome extension (the closed-loop input edge) | [`docs/11-recorder-extension.md`](./docs/11-recorder-extension.md) |
| Data infrastructure & feedback loops (the moat) | [`docs/07-data-platform-and-feedback-loops.md`](./docs/07-data-platform-and-feedback-loops.md) |
| Customer-facing product surface, CLI, dashboard, notifications | [`docs/08-customer-experience.md`](./docs/08-customer-experience.md) |
| Pricing, packaging, GTM | [`docs/09-go-to-market.md`](./docs/09-go-to-market.md) |
| Adapter contracts (per vendor) | [`docs/10-adapter-spec.md`](./docs/10-adapter-spec.md) |

---

## 6. Architectural commitments

The following are commitments — not aspirations — and any deviation requires a doc revision with rationale:

1. **One canonical OSS codebase, no forks.** SpeechLab UI, Othelia, PointLoad, and third-party customers all consume the same npm packages. Bug fixes flow upstream; no sideways forks. Enforced by Changesets + canary tags + workspace overrides. ([`docs/02 §0`](./docs/02-library-architecture.md))
2. **Physical telemetry boundary.** The OSS library has zero network code. The SaaS connector is a separately imported package. No env vars, no auto-discovery, no phone-home. ([`docs/02 §0`](./docs/02-library-architecture.md), [`docs/05 §4`](./docs/05-security-compliance.md))
3. **Per-tenant isolation, defense in depth.** Aurora row-level security with `app.current_tenant_id` GUC, KMS keys per tenant for S3 prefixes, separate SQS FIFO queues per tenant for the runner. ([`docs/05 §1`](./docs/05-security-compliance.md))
4. **Harness-grounded specs only.** The LLM may not emit `page.mouse.click(x, y)`; it must call into harness primitives. Enforced by post-generation AST validation against a typed primitive registry. ([`docs/04 §6`](./docs/04-ai-spec-generation.md))
5. **Human review required before merge.** No spec is auto-merged. The GitHub App opens a PR; an engineer reviews. ([`docs/04 §7`](./docs/04-ai-spec-generation.md))
6. **Validated against SpeechLab waveform first.** Every architectural decision is tested against Branch B before shipping. ([`docs/01 §2.2`](./docs/01-product-spec.md))

---

## 7. Out of scope

Things `complex-ui-tester` is **not**:

- A session replay tool. We consume replays; we do not produce them.
- A general-purpose test framework. We extend Playwright; we do not replace it.
- A bug-fix LLM. We produce specs that fail RED; humans (or other LLMs) write the fix.
- A free SaaS. The OSS library is free; the SaaS is commercial.
- A code modification tool. We do not edit the customer's source. The only artefact we produce in their repo is the spec file in the PR.

---

## 8. Open architectural questions

Tracked in the individual docs, but for visibility:

| # | Question | Doc |
|---|---|---|
| 1 | Customer-cloud runner option vs. our managed runner — pricing trade-off and migration path | [`05 §6`](./docs/05-security-compliance.md) |
| 2 | Multi-modal extraction (screenshots in prompt) vs. events-only — Branch B suggests events suffice, but waveform is one domain | [`04 §15`](./docs/04-ai-spec-generation.md) |
| 3 | Customer-supplied custom harness primitives — surface, validation, security | [`02`](./docs/02-library-architecture.md) + [`04`](./docs/04-ai-spec-generation.md) |
| 4 | Multi-region by year 2 — which region pair, replication strategy | [`06 §11`](./docs/06-operations-sre.md) |

Resolve these before public beta.
