# Roadmap

This is the consolidated public roadmap, synthesized from per-doc commitments. For full rationale and design detail, follow the cross-references into [`docs/`](./docs/README.md).

| Field | Value |
|---|---|
| Last updated | 2026-05-27 |
| Owner | ryan@speechlab.ai |
| Source of truth | The numbered design docs win on any conflict; this file is a summary. |

---

## Now (2026-Q2 / Q3) — Design & design-partner program

**Status: in flight.**

| Item | Doc reference | Done? |
|---|---|---|
| 10-doc architecture series (01–10) | [`docs/`](./docs/README.md) | ✅ Draft v1 complete |
| Marketing site + interactive 8-scene demo, deployed to Vercel | [`marketing-site/`](./marketing-site/) | ✅ Shipping |
| First 3 design-partner commitments signed (SpeechLab waveform + 2 prospects) | [`docs/09 §4`](./docs/09-go-to-market.md) | In progress |
| OSS library scaffolding (`@cuit/*` monorepo) | [`docs/02 §2`](./docs/02-library-architecture.md) | Not started |
| Branch B layers 1–6 extracted from `translate-ui-react` into `@cuit/core` | [`docs/02 §3`](./docs/02-library-architecture.md) | Not started |
| `cuit doctor` CLI bootstrap | [`docs/02 §6`](./docs/02-library-architecture.md), [`docs/08 §4`](./docs/08-customer-experience.md) | Not started |

---

## Next (2026-Q3 / Q4) — OSS public beta

**Target: 2026-10.**

| Item | Doc reference |
|---|---|
| `@cuit/core` v0.1 published to npm (MIT) | [`docs/02 §2`](./docs/02-library-architecture.md) |
| `@cuit/react` and `@cuit/playwright` v0.1 published | [`docs/02 §2`](./docs/02-library-architecture.md) |
| `@cuit/adapters-jam`, `@cuit/adapters-logrocket`, `@cuit/adapters-sentry-replay` v0.1 | [`docs/10`](./docs/10-adapter-spec.md) |
| 500 GitHub stars; 100 OSS WAU (anonymous heartbeat) | [`docs/09 §7`](./docs/09-go-to-market.md) |
| First Hacker News launch + conference submission (React Summit, JSConf) | [`docs/09 §6`](./docs/09-go-to-market.md) |
| SaaS private alpha: 3 design partners live with end-to-end loop working | [`docs/09 §10`](./docs/09-go-to-market.md) |
| SOC 2 Type I audit kickoff | [`docs/05 §2`](./docs/05-security-compliance.md), [`docs/09 §10`](./docs/09-go-to-market.md) |

---

## Q1 2027 — SaaS public beta

**Target: 2027-02 / 03.**

| Item | Doc reference |
|---|---|
| 5 paid design partners live; $200k ARR run-rate | [`docs/09 §10`](./docs/09-go-to-market.md) |
| `@cuit/adapters-fullstory`, `@cuit/adapters-datadog-rum` v0.1 | [`docs/10`](./docs/10-adapter-spec.md) |
| Spec runner cluster on EKS, KEDA autoscaling | [`docs/03 §7`](./docs/03-saas-platform.md) |
| Per-tenant data assets (selector dictionary, bug-class corpus, UI pattern library) production-grade | [`docs/07 §3`](./docs/07-data-platform-and-feedback-loops.md) |
| Confidence calibration loop with shadow-eval | [`docs/04 §7`](./docs/04-ai-spec-generation.md), [`docs/07 §7`](./docs/07-data-platform-and-feedback-loops.md) |
| Stripe billing + per-tenant cost meter UI | [`docs/03 §6`](./docs/03-saas-platform.md), [`docs/08 §9`](./docs/08-customer-experience.md) |
| Status page + customer-facing post-mortem process | [`docs/06 §12`](./docs/06-operations-sre.md) |
| SOC 2 Type II observation period begins | [`docs/05 §2`](./docs/05-security-compliance.md) |

---

## Q2 2027 — General availability

**Target: 2027-06.**

| Item | Doc reference |
|---|---|
| Self-serve signup opens (Team tier at $499/mo) | [`docs/09 §3`](./docs/09-go-to-market.md) |
| 25 self-serve paid signups in first quarter | [`docs/09 §7`](./docs/09-go-to-market.md) |
| $400k ARR | [`docs/01 §10`](./docs/01-product-spec.md), [`docs/09 §10`](./docs/09-go-to-market.md) |
| 5,000 OSS WAU | [`docs/01 §10`](./docs/01-product-spec.md) |
| SOC 2 Type II report issued | [`docs/05 §2`](./docs/05-security-compliance.md), [`docs/09 §10`](./docs/09-go-to-market.md) |
| Enterprise tier with customer-cloud runner option | [`docs/05 §6`](./docs/05-security-compliance.md), [`docs/09 §3`](./docs/09-go-to-market.md) |
| GitHub App marketplace listing | [`docs/03 §3.4`](./docs/03-saas-platform.md), [`docs/08 §5`](./docs/08-customer-experience.md) |

---

## Y2 (2027-2028)

**Target: 2028-Q2.**

- Multi-region deployment (primary + warm-standby) — [`docs/06 §11`](./docs/06-operations-sre.md)
- SCIM provisioning for Enterprise tier — [`docs/08 §8`](./docs/08-customer-experience.md)
- Customer-supplied custom primitives marketplace — [`docs/02`](./docs/02-library-architecture.md), [`docs/10 §15`](./docs/10-adapter-spec.md)
- Real-time retrieval cache for per-tenant data assets — [`docs/07 §13`](./docs/07-data-platform-and-feedback-loops.md)
- Customer-facing insights dashboard with anonymized cross-tenant patterns — [`docs/07 §8`](./docs/07-data-platform-and-feedback-loops.md)
- i18n: Japanese, German UI — [`docs/08 §12`](./docs/08-customer-experience.md)
- $2M ARR target — [`docs/09`](./docs/09-go-to-market.md)
- First SRE hire — [`docs/06 §14`](./docs/06-operations-sre.md)

---

## Y3 (2028-2029)

**Target: 2029-Q2.**

- Optional per-tenant fine-tune of small model — only if eval shows >5pp lift over best-prompted Sonnet — [`docs/07 §13`](./docs/07-data-platform-and-feedback-loops.md)
- Federated insight sharing across tenant clusters (opt-in) — [`docs/07 §13`](./docs/07-data-platform-and-feedback-loops.md)
- $10M ARR target — [`docs/09`](./docs/09-go-to-market.md)
- Public bug bounty — [`SECURITY.md`](./SECURITY.md)

---

## Explicitly NOT on the roadmap

Items we have deliberately ruled out at the architectural level. Adding any of these requires a doc revision with rationale.

- **Auto-merging generated specs without human review.** A human must approve every PR. ([`docs/01 §3.2`](./docs/01-product-spec.md), [`docs/04 §7`](./docs/04-ai-spec-generation.md))
- **Training a foundation model on customer data.** We do retrieval and prompt-context tuning, not fine-tuning. ([`docs/07 §13`](./docs/07-data-platform-and-feedback-loops.md))
- **Telemetry from the OSS library.** The library has zero network code. ([`docs/02 §0`](./docs/02-library-architecture.md), [`docs/05 §4`](./docs/05-security-compliance.md))
- **Per-customer forks of the OSS library.** One canonical codebase, consumed unchanged by all consumers. ([`docs/02 §0`](./docs/02-library-architecture.md))
- **Selling customer data, individually or in aggregate.** Anonymized insights are opt-in and stay in-product. ([`docs/07 §9`](./docs/07-data-platform-and-feedback-loops.md))
- **Replacing Playwright.** We augment it. ([`docs/01 §3.2`](./docs/01-product-spec.md))
- **Paid ads before $1M ARR.** ([`docs/09 §6`](./docs/09-go-to-market.md))
- **Hiring an SDR before $1M ARR.** ([`docs/09 §12`](./docs/09-go-to-market.md))

---

## How to propose a roadmap change

Open an issue using the docs-issue template, target the doc that owns the commitment, and reference this file. We do not edit `ROADMAP.md` in isolation — the source-of-truth doc is updated first, then this file follows.
