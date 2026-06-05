# Implementation Workflow — Proof-of-Concept

This document is the executable plan that turns the design docs into a working,
end-to-end demonstration of the complex-ui-tester loop. The outcome is a single
command that runs the full pipeline against a real bug and reports the result.

| Field | Value |
|---|---|
| Started | 2026-05-27 |
| Owner | ryan@speechlab.ai |
| Status | In progress |

## Outcome

```bash
pnpm proof:loop
```

Runs the full pipeline and prints:

```
[1/6] Loading recorded session events from fixtures/segment-collision.json
       → 47 events normalized into SessionEvent[]
[2/6] Generating spec from session events
       → wrote out/issue-2014.spec.ts (32 lines, 4 primitives used)
[3/6] Running spec against demo-app (bug-present mode)
       → FAIL — segment 0 right edge stayed at x=0 (expected 100)
       → RED — bug reproduced deterministically [SUCCESS]
[4/6] Applying canonical fix (FIX_SEGMENT_COLLISION=1)
       → re-rendering demo-app with fix flag
[5/6] Running spec against demo-app (fixed mode)
       → PASS — segment 0 right edge moved to x=100
       → GREEN — fix verified, regression locked in [SUCCESS]
[6/6] Locking the spec into CI as a gate
       → wrote .github/workflows/proof-regression.yml

LOOP COMPLETE — RED to GREEN in 8.3s
```

If the loop fails at any step, exit non-zero with a diff of expected vs actual.

## Scope of the PoC

The PoC implements a working **subset** of what the docs describe:

| Doc layer | PoC status |
|---|---|
| Layer 1 — state snapshots | ✓ implemented |
| Layer 2 — deterministic clock | ✓ implemented |
| Layer 3 — synthetic dispatch (drag) | ✓ implemented |
| Layer 4 — CDP events | deferred — Playwright handles |
| Layer 5 — wheel / touch | deferred to v0.2 |
| Layer 6 — mutation observer | minimal — instance counter only |
| Layer 7 — session normalization | ✓ deterministic mapping |
| Layer 8 — confidence scoring | stub — always returns 1.0 |
| Layer 9 — eval harness | ✓ one canonical bug |
| Layer 10 — model routing | deferred — no real LLM in PoC |
| Layer 11 — adapter surface | one adapter (Jam-shaped fixtures) |
| Layer 12 — AI step extraction | **rule-based** in PoC; LLM in v0.2 |

The PoC's spec generator is deliberately **rule-based**, not LLM-based. The
goal is to prove the loop architecture works end-to-end; the LLM substitution
is a drop-in for the rule-based generator at v0.2 without changing the loop.

## Repository layout

```
complex-ui-tester/
├── proof-of-concept/                ← NEW
│   ├── pnpm-workspace.yaml
│   ├── package.json                 ← root scripts (proof:loop, test, build)
│   ├── tsconfig.base.json
│   ├── vitest.config.ts
│   ├── packages/
│   │   ├── harness/                 ← @cuit/harness — primitives
│   │   ├── adapter-jam/             ← @cuit/adapter-jam — session normalizer
│   │   ├── spec-gen/                ← @cuit/spec-gen — events → spec.ts
│   │   ├── demo-app/                ← intentionally-buggy waveform UI (Vite)
│   │   └── runner/                  ← @cuit/runner — orchestrates the loop
│   └── fixtures/
│       ├── segment-collision.json   ← recorded session events
│       └── expected-spec.ts         ← golden output for spec-gen
```

## Phases (cloud workflow)

### Phase 1 — Scaffold

Single agent. Creates the pnpm workspace, all package.json files, tsconfig,
vitest config, root scripts. No business logic yet.

### Phase 2 — TDD: write tests (parallel)

Five parallel agents, one per package. Each writes the vitest spec file(s)
for its package with realistic expected inputs / outputs. No implementation.

- `harness.test.ts` — primitives behave as documented (Layer 1–3).
- `adapter-jam.test.ts` — Jam-shaped JSON normalizes into `SessionEvent[]`.
- `spec-gen.test.ts` — given fixture events, emits a deterministic spec.ts
  string matching `expected-spec.ts`.
- `demo-app.test.ts` — buggy mode has the segment collision; fixed mode
  doesn't.
- `runner.test.ts` — orchestrator returns the expected lifecycle of events.

Plus a top-level `e2e.test.ts` that exercises the full loop.

### Phase 3 — Implementation (parallel)

Five parallel agents implement until their tests pass. Each must:

- Read its own test file as the contract.
- Implement the minimum code to make tests green.
- Run `pnpm -F <package> test` in-loop until all tests pass.
- Return a structured result: `{ filesWritten, testsPass }`.

### Phase 4 — End-to-end wiring

One agent wires the packages together via the root `pnpm proof:loop`
script, runs it, captures the output, verifies it matches the success
template above, and writes `proof-output.log`.

### Phase 5 — Translate-UI-React integration (optional, sequential)

One agent attempts to point the same `@cuit/harness` at the real
`translate-ui-react` waveform editor using `pnpm link --global`. No
changes committed to that repo — integration is verification-only. Records
whether the same primitives reproduce a known historical bug.

### Phase 6 — Marketing site update

One agent adds a `/proof` page to the marketing-site that embeds the
proof-output.log and a "all green" status badge, then deploys to Vercel.

## Success criteria

- [ ] `pnpm proof:loop` exits 0 and prints the success template above.
- [ ] `pnpm test` across all packages — 100% pass.
- [ ] `pnpm typecheck` across all packages — 0 errors.
- [ ] `pnpm lint` across all packages — 0 errors.
- [ ] `proof-of-concept/proof-output.log` committed and links from the live
      marketing site.
- [ ] `https://complex-ui-tester.vercel.app/proof` shows the latest run.

## Non-goals

- A real LLM in the loop (rule-based generator is a drop-in proxy).
- A multi-tenant SaaS (PoC is single-process).
- Connector authentication (fixtures are pre-recorded JSON files).
- Production-grade error handling beyond what tests cover.
