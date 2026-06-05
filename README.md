# CUIT

> **The deterministic feedback edge for agentic UI engineering.**
> Recorder + harness + spec-gen + data warehouse.
> Real user session → green CI gate, in 0.18 seconds.

`CUIT` is the human-facing brand. `complex-ui-tester` is the canonical
npm/repo/domain name — kept for URL stability and the long-form
expansion when more context helps.

**Status:** Alpha shipping — Chrome extension downloadable from the
live site, working proof-of-concept loop in this repo, design-partner
outreach in progress.
**License:** MIT (the OSS substrate) — see [LICENSE](./LICENSE).
**Owner:** ryan@speechlab.ai
**Live site:** [complex-ui-tester.vercel.app](https://complex-ui-tester.vercel.app)
— landing page + interactive demo + alpha Chrome-extension download.

---

## What this is

Teams shipping interaction-heavy front-ends — waveform editors, video editors, design tools, dashboards with reorderable rows, IDE-like code editors — burn weeks per quarter on the same loop:

1. A user files a bug via Jam / LogRocket / Sentry Replay.
2. An engineer eyeballs the session and hand-writes a pixel-coordinate Playwright test that flakes a week later.
3. They ship a fix. The same bug reopens 3 weeks after.

`complex-ui-tester` compresses that loop from days of manual work to under an hour of LLM-extracted, harness-grounded, human-reviewed Playwright code.

The product has two parts:

| Part | License | What it does |
|---|---|---|
| **OSS library** (`@cuit/*` packages) | MIT/Apache-2.0 | Harness primitives that any repo can `npm install`: state snapshots, deterministic clock, synthetic dispatch (`dispatchDrag`, `dispatchResize`, `seekTo`), CDP events, mutation observers, framework adapters (React/Vue), session-source adapters (Jam, LogRocket, Sentry Replay, FullStory, Datadog RUM). |
| **SaaS platform** | Commercial | LLM-powered spec generation, managed Playwright runner cluster, multi-tenant cost accounting, audit logs, RBAC, SOC 2 Type II report, secure session-source connector credential storage. |

Customers pay for the parts they cannot or should not self-host. They do not pay to use the library.

---

## Why this can ship now

The first 6 layers of the harness are **working code in production** — [PR #1995](https://github.com/speechlabinc/translate-ui-react/pull/1995) in SpeechLab's `translate-ui-react`, the canonical design partner. Validated outcomes from Branch B:

- **8 historical waveform bugs locked in** via deterministic specs (#1931, #1921, #1927, #1956, #1933, #1960, #1964, #1967)
- **9 Playwright specs + 37 Jest tests**, all green on Chromium / Firefox / WebKit
- **One harness bug discovered and fixed by the loop itself** (`dispatchDrag` off-by-`seg.x` for segment 0)
- **0% CI flake rate** on the new specs (prior baseline: ~5–15%)

Layer 12 — the LLM step extractor that turns a session into a spec — is the productized addition. See [`docs/04-ai-spec-generation.md`](./docs/04-ai-spec-generation.md) for the full pipeline design.

---

## Architecture at a glance

```
 ┌──────────────────────────────────────┐    ┌────────────────────────────────────┐
 │  PRIMARY — first-party (shipping)    │    │  ALTERNATE — third-party adapters  │
 │  @cuit/recorder-extension (Chrome)   │    │  Jam · LogRocket · Sentry Replay   │
 │  or @cuit/recorder npm module        │    │  FullStory · Datadog RUM           │
 │  • pointer + state snapshots         │    │  • rrweb-compatible event stream   │
 │  • semantic selectors                │    │  • OAuth / API-key pull            │
 │  • no vendor, no account, local only │    │  • normalized via @cuit/adapters-* │
 └────────────────────┬─────────────────┘    └─────────────────┬──────────────────┘
                      │                                        │
                      └─────────────────┬──────────────────────┘
                                        │  SessionEvent[]  (one canonical shape)
                                        ▼
                          ┌─────────────────────────────┐         ┌──────────────────┐
                          │  AI Extractor (SaaS)        │ ◀─────▶ │  Prompt cache    │
                          │  3-pass LLM pipeline        │         │  (per-tenant)    │
                          └────────────────┬────────────┘         └──────────────────┘
                                           │  spec.ts (grounded in harness primitives)
                                           ▼
                          ┌─────────────────────────────┐
                          │  Runner cluster             │  → RED (reproduces bug)
                          │  Playwright + harness       │
                          └────────────────┬────────────┘
                                           │  PR opened via GitHub App
                                           ▼
                          ┌─────────────────────────────┐
                          │  Agent or engineer review   │  → GREEN
                          │  Claude Code · Codex ·      │
                          │  Cursor · or a human        │
                          └────────────────┬────────────┘
                                           │
                                           ▼
                                      CI gate forever
```

The first-party recorder is the **default** input. Third-party adapters
are alternates for teams that already have a session-replay vendor
deployed and want to feed those sessions in too.

Full diagrams: see [`docs/02-library-architecture.md`](./docs/02-library-architecture.md) and [`docs/03-saas-platform.md`](./docs/03-saas-platform.md).

---

## Repository layout

This repo currently holds **architecture and product documentation only**. Implementation has not started. Code will land in a follow-up monorepo (`@cuit/*` workspaces) per [doc 02](./docs/02-library-architecture.md).

```
.
├── README.md              ← you are here
├── ARCHITECTURE.md        ← top-level architecture summary + links
├── SYSTEM_DESIGN.md       ← system design overview (cross-doc map)
├── CONTRIBUTING.md        ← how to propose changes to the docs
├── CODE_OF_CONDUCT.md     ← Contributor Covenant
├── LICENSE                ← MIT
├── docs/
│   ├── README.md          ← documentation index (start here)
│   ├── 01-product-spec.md
│   ├── 02-library-architecture.md
│   ├── 03-saas-platform.md
│   ├── 04-ai-spec-generation.md
│   ├── 05-security-compliance.md
│   ├── 06-operations-sre.md
│   ├── 07-data-platform-and-feedback-loops.md
│   ├── 08-customer-experience.md
│   ├── 09-go-to-market.md
│   └── 10-adapter-spec.md
└── marketing-site/        ← Next.js landing page + 8-scene demo (deployed to Vercel)
```

---

## Where to start reading

| You are... | Read first |
|---|---|
| A prospective customer or design partner | [`docs/01-product-spec.md`](./docs/01-product-spec.md) §0–4, then [`docs/07-data-platform-and-feedback-loops.md`](./docs/07-data-platform-and-feedback-loops.md) §1, then [`docs/05-security-compliance.md`](./docs/05-security-compliance.md) §1–3 |
| An engineer evaluating the OSS library | [`docs/02-library-architecture.md`](./docs/02-library-architecture.md) |
| A platform / SRE reviewer | [`docs/03-saas-platform.md`](./docs/03-saas-platform.md), then [`docs/06-operations-sre.md`](./docs/06-operations-sre.md) |
| ML / AI infrastructure reviewer | [`docs/04-ai-spec-generation.md`](./docs/04-ai-spec-generation.md), then [`docs/07-data-platform-and-feedback-loops.md`](./docs/07-data-platform-and-feedback-loops.md) |
| Security / compliance reviewer | [`docs/05-security-compliance.md`](./docs/05-security-compliance.md) |
| Product / design / customer success | [`docs/08-customer-experience.md`](./docs/08-customer-experience.md) |
| Adapter implementer / vendor partner | [`docs/10-adapter-spec.md`](./docs/10-adapter-spec.md) |
| An investor or strategist | [`docs/01-product-spec.md`](./docs/01-product-spec.md) §0, §10–12, then [`docs/07`](./docs/07-data-platform-and-feedback-loops.md) §10 (the moat). (Commercial detail — pricing, ACV, hiring plan — lives in the private `cuit-internal` repo.) |

Or just read the index: [`docs/README.md`](./docs/README.md).

---

## Year-1 targets

| Metric | Target |
|---|---|
| Paid design partners | 3–5 ($24k–$60k ACV) |
| OSS weekly active installs | 5,000 (anonymous heartbeat, opt-out) |
| ARR | $400k |
| Design-partner ship | Q3 2026 |
| Public beta | Q4 2026 |

Detailed milestones: [`docs/01-product-spec.md`](./docs/01-product-spec.md) §10 and [`docs/06-operations-sre.md`](./docs/06-operations-sre.md) §15.

---

## Design partner

SpeechLab's waveform editor — `translate-ui-react`, Branch B / [PR #1995](https://github.com/speechlabinc/translate-ui-react/pull/1995) — is the canonical design partner. Every architectural decision in these docs is validated against it before shipping. The library and SaaS will not ship a feature that does not work on the waveform first.

---

## Contributing

The repository is currently documentation-only and in active design. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for how to propose changes. All contributors agree to the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

For substantive architecture questions, open an issue and tag the relevant doc number (e.g., `docs:02`).

---

## Contact

- **Product / commercial:** ryan@speechlab.ai
- **Security:** ryan@speechlab.ai (PGP key TBD before public beta)
- **Issues:** GitHub Issues on this repository
