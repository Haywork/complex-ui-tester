# complex-ui-tester — Product Requirements Document

| Field | Value |
|---|---|
| Working name | complex-ui-tester (placeholder; final name pending) |
| Document type | Product Spec / PRD |
| Owner | ryan@speechlab.ai |
| Last reviewed | 2026-05-25 |
| Status | Draft — for design-partner outreach and engineering scoping |
| Source vision | `/Users/ryanmedlin/Downloads/ui-feedback-loop-product-vision.md` |
| Design partner (canonical) | SpeechLab waveform editor (Branch B, PR #1995) |
| Distribution model | Hybrid: MIT/Apache OSS library + SaaS for inference, connectors, compliance |

---

## 0. TL;DR for the skeptical reader

Teams shipping complex UIs — waveform editors, video editors, design tools, dashboards with reorderable rows, IDE-like code editors — burn weeks per quarter on the same loop: a user files a bug via Jam/LogRocket/Sentry Replay, an engineer eyeballs the session, hand-writes a pixel-coordinate Playwright test that flakes a week later, ships a fix, then watches the same bug reopen 3 weeks after. SpeechLab's waveform alone accumulated **6 Reopened tickets in 60 days** before Branch B (PR #1995) introduced a 6-layer test harness that locked in **8 historical bugs across 9 specs + 37 jest tests**, all green on Chromium / Firefox / WebKit.

We are productizing that harness. The library that ships into the customer's repo is **open source** (MIT/Apache, single canonical codebase, no per-customer forks). The **SaaS** sits in front of LLM inference, the secure session-source connectors, multi-tenant cost accounting, audit logs, RBAC, and SOC 2. Customers pay for the parts they cannot or should not self-host — they do not pay to use the library.

SpeechLab's waveform is the design partner. Every architectural decision is validated against it before shipping. Year 1 target: 3–5 paying design partners, 5k OSS weekly active installs, $400k ARR.

---

## 1. Problem Statement

Teams shipping interaction-heavy front-ends spend a disproportionate fraction of engineering time re-discovering, re-fixing, and re-shipping the same class of UI bug. The existing tooling stack — Playwright, Cypress, screenshot diff, session replay — produces flaky tests, misses canvas/animation regressions, and offers no automated path from a recorded user session to a deterministic regression test. The result is a bug Reopen rate that often exceeds 15% on complex surfaces (SpeechLab's waveform: 6/14 ≈ 43% in a 60-day window before Branch B).

**Our product compresses "real user session → green CI gate" from days of manual work to under an hour of LLM-extracted, harness-grounded, human-reviewed Playwright code.**

---

## 2. Background and evidence

### 2.1 Why the existing stack fails

| Failure mode | Root cause | Cost to the team |
|---|---|---|
| Reopen-after-fix loop | No regression net specific to the visual bug class | 0.5–2 engineering-days per reopen |
| `boundingBox()` flakes | Pixel coordinates depend on viewport, CSS, browser engine | 5–15% CI flake rate, mean-time-to-quarantine ~3 days |
| `waitForTimeout` races | Tests fight rAF non-determinism with sleeps | Hidden flakes that surface in CI infra changes |
| Session-replay → test gap | Engineer hand-translates 5–30 sec of DOM events into a spec | 2–6 hours per bug; most teams never do it |
| Canvas / animation bugs | Pixel screenshot diff hides sub-pixel and opacity glitches | Bugs reach prod, surface via user complaints |
| Cross-browser drift | Most teams test Chromium only | Safari/Firefox-only regressions found in support tickets |
| No prod-to-test telemetry | Sentry errors not linked to spec coverage | Repeat incidents from already-known scenarios |

### 2.2 Proof-of-concept: SpeechLab Branch B

The first 6 layers of the architecture are working code in [PR #1995](https://github.com/speechlabinc/translate-ui-react/pull/1995):

- **State snapshots** via `window.__waveformDebug.getState()`
- **Deterministic clock** via `rafScheduler.setClock` and `tick`
- **Synthetic dispatch** (`dispatchDrag`, `dispatchResize`, `seekTo`) that bypasses pixel math
- **Real CDP events** for end-to-end fidelity
- **Wheel/touch dispatch** for non-mouse interactions
- **DOM mutation + WaveSurfer instance counter + CSS observer** for invariant checks

Validated outcomes: 8 historical bugs locked in, 9 specs + 37 jest tests green, 3 browsers verified, one harness bug discovered and fixed by the loop itself (`dispatchDrag` off-by-`seg.x` for segment 0).

### 2.3 Why now

| Trend | Implication |
|---|---|
| Modern session-replay tools (Sentry, LogRocket, Datadog RUM, FullStory) expose rrweb-compatible or rrweb-derived event streams | Vendor lock-in low; normalization is tractable |
| Frontier LLMs (Claude 4.x / GPT-5) reliably translate DOM-event sequences into structured test steps with named selectors | Layer 12 was speculative in 2024; production-quality in 2026 |
| Playwright is now the de-facto modern test runner; >70% of new test suites at Series B+ SaaS companies | One target runner instead of five |
| Bug Reopen and flake rates remain industry-wide, public pain points | Buyer is primed; competitive products are partial answers |

---

## 3. Goals and Non-Goals

### 3.1 Goals (Year 1)

- [ ] Ship an MIT/Apache-licensed OSS library (`@cuit/harness` working name) that any repo can `npm install` and configure in <1 engineering-day for a React + Zustand or Vue + Pinia app
- [ ] Ship a SaaS dashboard that ingests sessions from at least 3 of {Jam, LogRocket, Sentry Replay, FullStory, Datadog RUM} and produces a reviewable Playwright spec PR
- [ ] Validate end-to-end on SpeechLab's waveform editor as the canonical design partner
- [ ] Sign 3–5 paid design-partner contracts at $24k–$60k ACV
- [ ] Reach 5,000 weekly active OSS installs (measured by anonymous heartbeat ping, opt-out)
- [ ] Reach $400k ARR by end of Q4
- [ ] Achieve SOC 2 Type I by end of Q3, Type II by end of Q4
- [ ] Hit a spec-acceptance rate (engineer accepts the LLM-generated spec with ≤2 small edits) of ≥60% by end of Q2 and ≥75% by end of Q4

### 3.2 Non-Goals (Year 1)

- General-purpose AI agent for UI testing on arbitrary apps — we explicitly target apps with drag/animation/canvas/playhead/reorder surfaces; CRUD form testing is a worse fit and well-served by Mabl/Reflect
- Native mobile (iOS/Android) — DOM-based web only in Y1
- Replacing existing Playwright or Cypress test suites — we augment, never replace
- Pixel-perfect visual regression as the primary signal — we use it as a secondary check; the primary signal is harness state assertions
- A no-code, business-user test builder — our buyer is engineering, not QA-as-a-service
- WebGL/Canvas-only apps with no DOM (games, three.js demos) — Phase 2 minimum

### 3.3 Explicit boundary against "yet another tool" fatigue

Generated specs land as PRs into the customer's existing `tests/playwright/` tree, using the customer's existing Playwright version and config. We do not run a parallel test infrastructure unless the customer opts into hosted spec runners.

---

## 4. Ideal Customer Profile

We define ICP at three resolutions: **firmographic** (the company), **role** (the buyer + champion), and **technographic** (their stack and pain).

### 4.1 Firmographic — the company

| Attribute | Tier-1 ICP (highest fit) | Tier-2 ICP (good fit) | Out of ICP |
|---|---|---|---|
| Stage | Series B–D SaaS | Series A late-stage / Series E pre-IPO | Seed; public companies with locked-in QA orgs |
| Engineering headcount | 30–200 | 200–500 or 15–30 | <15 or >500 (the >500 segment becomes Y2 enterprise motion) |
| Frontend engineering as % of total | ≥25% | ≥15% | <10% |
| Product surface | Interactive: editor, design tool, canvas, playhead, drag-reorder, charting | Mixed: SaaS dashboard with some complex widgets | Pure CRUD; static marketing sites |
| Funding state | Recently raised (12–24 months runway, building, not cutting) | Profitable mid-market | Distressed; bootstrap with <3 frontend engineers |
| Geography (Y1) | US, Canada, UK, Western Europe, Australia | LATAM, India, Israel | China (data residency); Russia (sanctions) |

**Why Series B–D specifically:** Seed/Series A teams are still building 0→1, have not accumulated enough surface to need regression guardrails, and rarely budget for tooling. Series E+ have entrenched QA orgs and procurement cycles that favor incumbents (Mabl, Functionize). Series B–D is the sweet spot: enough surface to hurt, enough budget to buy, fast enough to adopt.

### 4.2 Role — the buyer and champion

| Role | Their relationship to the product | Buying power |
|---|---|---|
| **Frontend lead / staff frontend engineer** | Champion. Owns at least one Playwright suite. Has personally felt the boundingBox flake pain. | Recommender; ~$10k discretionary |
| **VP Engineering / Head of Platform** | Buyer. Cares about Reopen rate, MTTR, engineering throughput, CI cost. | Approves up to $100k ACV |
| **Director of QA / QA Lead** | Influencer or blocker. Some are excited (augments their team); some defensive (sees as replacement). | Recommender |
| **CTO** | Final signoff at smaller customers. Cares about open-source story, vendor lock-in, security. | Approves above $100k ACV |
| **Eng-ops / DevX team** | Implementer. Cares about how clean the SDK is, how fast onboarding is, how chatty the agent is in CI logs. | Veto power on technical fit |

### 4.3 Technographic — the stack and the pain signature

A target account checks **at least 4** of these:

1. Has a Playwright suite ≥50 specs with ≥5% flake rate in last 30 days (their own metric, not ours)
2. Has Jam, LogRocket, Sentry Replay, FullStory, or Datadog RUM Replay in production
3. Has a bug Reopen rate >15% on any one product surface (per Linear/Jira label or per GitHub label)
4. Has at least one engineer who has filed a `boundingBox()` issue in the Playwright repo or asked about it in their public Slack/Discord
5. Uses React + Zustand/Redux/Jotai, Vue + Pinia, or Svelte stores — i.e. a state library we can hook into with a generic snapshot adapter
6. Ships a UI surface in one of these classes: video/audio editor, design tool, IDE-like editor, dashboard with drag-reorder, drawing/whiteboard, data-grid with virtualized rendering
7. Runs CI on GitHub Actions, CircleCI, or BuildKite — i.e. supports our action/orb shipping path

### 4.4 Named target accounts for design partner outreach

The first 5 conversations should be:

| Company | Why they fit | Champion path |
|---|---|---|
| **Descript** | Audio/video editor; same pattern as SpeechLab waveform; known Jam user | Frontend lead via Ryan's network; Show HN reading audience |
| **Loom** (now Atlassian) | Video editing post-record; complex playhead; high bug Reopen on the timeline editor | Eng manager via Atlassian DevX team |
| **Figma** | Design tool; canvas-heavy; massive Playwright investment; well-known flake pain | Staff eng via Bay Area meetup circuit |
| **Linear** | Reorderable issues, complex keyboard interactions, brand-defining UI polish | Karri / Tuomas via founder warm intro |
| **Retool** | Drag-and-drop dashboard builder; many customers ship complex UIs on Retool | Platform team; pitch as "ship Retool's own confidence story" |
| **Otter.ai / Rev** | Transcription UI with waveform + segment editing — closest analogue to SpeechLab | Direct outreach with SpeechLab Branch B as proof |
| **Adobe Express / Creative Cloud Web** | Web-based design tools; Adobe has internal Playwright; canvas pain | Hard but high-prestige logo |
| **Notion** | Database views, drag-reorder, slash commands; complex DOM | Eng team via OSS contribution path |

**Outreach order:** Otter / Rev / Descript first (closest UI to SpeechLab; warmest proof point), then Linear / Retool (shorter sales cycle, founder accessible), then Figma / Adobe as logo plays in Q3.

### 4.5 Anti-ICP — accounts we should politely decline

- Government, defense, healthcare regulated (no SOC 2 yet; data residency complexity)
- Pure CRUD admin tools (Mabl/Reflect already adequate; we are over-tooled for them)
- Hard on-prem-only mandates with no outbound network (Y1; revisit in Y2 with self-hosted SaaS)
- Companies that have already standardized on Functionize or another all-in-one platform — the switching cost dominates our value prop

---

## 5. Jobs-to-be-Done framing

### 5.1 The primary job

> **"When a real user files a bug in our complex UI, I want to convert that recorded session into a deterministic regression test before I ship the fix, so that the same bug cannot reopen, and so future engineers touching this code path are guaranteed to feel it break."**

The hire: a system that turns a session into a test, automatically and reliably enough that engineers trust it.

The fire (competing alternatives the user is currently using and would stop using):

| Currently using | What they fire it for |
|---|---|
| Manual Playwright authoring after watching a Jam recording | Too slow; flaky; 60% of bugs never get a test |
| Screenshot-diff CI (Percy, Chromatic) | Misses canvas/animation; high false-positive on minor CSS changes |
| `await page.waitForTimeout(N)` | Hides flake behind sleep; eventually breaks anyway |
| Mabl / Reflect record-and-replay | Owns the test infrastructure; produces brittle pixel-coordinate scripts; non-engineers can't debug them |
| QA Wolf "tests as a service" | Slow turnaround; tests live outside the engineer's codebase; opaque |
| Nothing — just rely on user reports | The status quo for ~40% of teams; this is the largest competitive segment |

### 5.2 Adjacent jobs

| Adjacent job | Notes |
|---|---|
| "Make our cross-browser support not embarrassing" | Layer 8 of the harness; secondary value |
| "Connect production errors to test coverage" | Layer 13 / telemetry feedback; supports retention story |
| "Give my new hires a guided way to understand the test suite" | Spec-with-bug-link UI doubles as a teaching tool |
| "Convince procurement we have a real testing strategy" | SOC 2 + audit log + dashboard view; supports the buyer's internal narrative |

### 5.3 Job context — when the job triggers

The buyer has the trigger event in their head:

- A P0 bug just reopened for the 3rd time, and the post-mortem said "we should have had a test"
- A test suite refactor is being planned and someone said "we should rewrite these to be less flaky" but no one has time
- A new senior frontend hire just said in their first 1:1 "our test infra is below industry standard"
- An incident retrospective surfaced "we knew about this from the Sentry session but never wrote the test"

Our marketing should name these moments specifically.

---

## 6. Value Propositions

We have three distinct user personas with three different value stories. The OSS user is not the SaaS customer, and the SaaS customer is not always the buyer.

### 6.1 For the OSS user — the frontend engineer dropping in the library

**Headline promise:** *Replace your flakiest Playwright drag/animation/playhead tests with deterministic harness primitives in a day, free, forever.*

| Promise | Proof point | Metric that moves |
|---|---|---|
| Replace `boundingBox()` math with `dispatchDrag(elementId, deltaX)` | SpeechLab waveform: 6 drag tests, 0 flakes in 60 days post-Branch B | Drag-test flake rate: 8–12% → <1% |
| Replace `waitForTimeout(N)` with `setClock(t); tick(16)` | rAF determinism documented and tested across 3 browsers | Time-based flake rate: ~5% → 0% |
| Get cross-browser coverage without 3x test maintenance | One spec runs on Chromium/Firefox/WebKit via Playwright projects | Browser-specific bug count: ~6/quarter → ~1/quarter |
| Inspect any state at any moment via `window.__cuit.getState()` | One debug API, same in dev and test | Time-to-reproduce a state-shape bug: hours → minutes |
| No vendor lock-in; MIT/Apache; one canonical codebase | Library installable from npm; harness code visible and forkable | Adoption-blocking risk: removed |

The OSS user does not pay us. They are our distribution.

### 6.2 For the SaaS customer — the team paying for inference + connectors + compliance

**Headline promise:** *We turn your Jam / LogRocket / Sentry Replay sessions into reviewed, harness-grounded regression-test PRs automatically — and we own the LLM cost, the compliance, and the integration headache so your engineers don't have to.*

| Promise | Proof point | Metric that moves |
|---|---|---|
| Real session → spec PR in <60 minutes | E2E pilot on SpeechLab waveform: median 18 min per spec | Time-to-regression-test: 4–6 hours → <1 hour |
| Single multi-tenant LLM contract — no token math, no provider lock-in | Customer pays per-spec, not per-token | LLM cost predictability: ±50% per month → ±5% |
| Plug-and-play connectors for Jam/LogRocket/Sentry/FullStory/Datadog | Validated against all 5 vendors before GA | Time-to-first-spec from signup: <1 day |
| Auto-reopen issue when a previously-green spec goes red | Layer 13 traceability; PR ↔ session ↔ issue ↔ fix-commit | Mean-time-to-detect regression: weeks → minutes |
| SOC 2 Type II, audit logs, RBAC, SSO | Available end of Q4; design partners pre-SOC contractually accept | Procurement-stall risk: removed |

### 6.3 For the buyer — VP Engineering / Head of Platform

**Headline promise:** *Cut your bug Reopen rate by half within one quarter, with engineers spending less time writing tests and more time shipping features. Pay for outcomes (specs generated, sessions ingested), not seats you under-utilize.*

| Promise | Proof point | Metric that moves |
|---|---|---|
| Reopen rate down ≥40% within one quarter | SpeechLab data: 6 reopens in pre-Branch-B 60 days → 0 reopens on covered surface | Reopen rate: 15–43% → <10% |
| Test coverage scales with bug reports, not with engineer hours | Coverage grows automatically on every Sentry/Jam signal | Specs-per-engineer-quarter: ~3 → ~25 |
| Cross-browser confidence without dedicated WebKit/Firefox CI investment | All specs run the matrix; one harness | Safari-only escape bugs: ~6/quarter → ~1 |
| Usage-based pricing aligns vendor cost with value delivered | Per-spec + per-session line items on every invoice | Tool ROI defensibility at board meetings |
| Engineering throughput improvement, measurable | Cycle time / PR throughput dashboards integrated | Sprint throughput: +10% on covered surfaces |

### 6.4 What we explicitly do not promise

- We do not promise to write 100% of your test suite. We will write the high-value, hard-to-write specs (drag, animation, playhead, drag-reorder, complex canvas). Form-fill tests stay where they are.
- We do not promise zero human review. Every generated spec is human-reviewed. Layer 12's confidence score gates auto-merge eligibility, and even then we recommend human review for the first 6 months at any account.
- We do not promise to work on apps with zero state library. If your app is a 50k-line jQuery + global `window` mess, you'll need to wire the state adapter manually; we will document it but won't auto-detect.

---


## 7. Positioning

### 7.1 Positioning statement

> **For** Series B–D SaaS engineering teams shipping interaction-heavy front-ends (editors, design tools, canvas, drag/reorder UIs),
> **who** burn engineering hours re-fixing the same UI bugs because their Playwright tests are flaky and their session-replay tools don't produce regression tests,
> **complex-ui-tester** is a hybrid open-source library and SaaS service that
> **automatically converts real user sessions from Jam / LogRocket / Sentry Replay / FullStory / Datadog RUM into deterministic, harness-grounded Playwright specs and CI gates** — so that every fix stays fixed and every browser stays covered.
> **Unlike** Mabl, Reflect, QA Wolf, or Functionize, our tests live in the customer's repo, run on the customer's Playwright, are written in plain TypeScript an engineer can read and edit, and ride on a battle-tested open-source harness that ships free.
> **Unlike** Replay.io or hand-rolled debugging tooling, we close the loop from production session to merged regression test, not just from session to debug session.

### 7.2 The one-line elevator

> *"Real user sessions in, deterministic regression tests out, free open-source harness underneath, paid LLM extraction and connectors on top."*

### 7.3 Competitive landscape

| Competitor | What they do | Our one-sentence differentiation |
|---|---|---|
| **Reflect.run** | No-code, record-and-replay browser test platform aimed at QA-led teams | Reflect ships pixel-coordinate scripts owned outside your repo by non-engineers; our specs are plain Playwright TypeScript that lives in your codebase and is grounded on harness primitives that survive viewport and CSS changes. |
| **Mabl** | AI-assisted, low-code test platform with self-healing locators | Mabl is excellent for CRUD admin tools but its "self-healing" approach masks bugs in canvas/animation surfaces; our harness exposes the state your tests need to assert against and we never silently mutate selectors. |
| **QA Wolf** | Managed-service testing — engineers at QA Wolf write your tests in 4 hours | QA Wolf gives you a tests-as-a-service contract with humans in the loop; we give you a code library and an automation that operates inside your team's workflow, at higher volume, and that the team owns. |
| **Functionize** | Enterprise AI test platform with NLP-driven test authoring | Functionize is procurement-heavy enterprise software that owns your test environment; we are infrastructure that augments the Playwright you already run, priced by usage. |
| **Applitools** | Visual-AI screenshot diff platform | Applitools is best-in-class for pure visual regression but is blind to animation, canvas redraws, and state-shape bugs; we use harness state assertions as the primary signal and treat visual diff as a complementary secondary check. |
| **Replay.io** | Time-travel debugger; deterministic browser recordings for engineers to debug | Replay.io closes the loop from session to debug session; we close the loop from session to merged regression test gating future PRs. |
| **Stately.ai** | State-machine modeling and Xstate ecosystem; can generate tests from state charts | Stately tests state machines you authored upfront; we generate tests from real user behavior on UIs that were not state-charted, and we can co-exist (your Xstate model becomes a great state-assertion source). |
| **Recorder.dev / Playwright Codegen** | Record-and-replay test generators that emit Playwright | Codegen emits brittle pixel-coordinate Playwright that flakes on canvas/animation surfaces; we emit harness-grounded specs that are deterministic by construction. |
| **Cursor / Claude Code + raw Playwright** | LLM in the IDE that helps engineers write tests by hand | An IDE LLM writes tests one at a time when an engineer remembers to ask; we close the production loop so the LLM is triggered by every Sentry replay and every Jam bug, not by engineer attention. |
| **Sentry Replay alone** | Production session recording tied to errors | Replay is the input to our pipeline, not a competitor; we make the replays actionable as merged tests. |
| **Datadog Synthetic Tests / Checkly** | Synthetic browser monitoring (uptime + key flows) | These are uptime / key-path monitors; we are a regression-net for the long tail of complex-UI bugs that synthetics don't cover. |

### 7.4 The "competitive moat" honest accounting

We do not have a moat against any one of these competitors individually. We have **distribution leverage from the open-source harness** (every team that adopts the OSS becomes a candidate SaaS customer once they want connectors and inference billed centrally), and we have **first-mover focus on the complex-UI sub-segment** that the broad horizontal platforms (Mabl, Functionize) under-serve. If we win Series B–D editor/design-tool/dashboard accounts in Y1, the data flywheel (more sessions → better LLM extraction → higher acceptance rate) and the brand association ("the test infra Figma/Linear/Descript-class teams use") become the moat in Y2.

---

## 8. User stories with acceptance criteria

Stories are grouped by persona and prioritized as P0 (must have for paid GA), P1 (should have at GA or shortly after), P2 (nice to have).

### 8.1 OSS user — frontend engineer dropping in the library

#### Story 8.1.1 — Install the harness in <1 day (P0)

> *As a frontend engineer at a Series B SaaS company, I want to `npm install @cuit/harness` and follow a guided setup, so that within one engineering-day I have deterministic dispatch helpers wired into my React + Zustand app.*

**Acceptance criteria:**
- **Given** a fresh clone of a target stack (React 18+, Zustand 4+, Playwright 1.40+) and the project's existing `package.json`, **when** the engineer runs `npx @cuit/harness init`, **then** the CLI generates a `cuit.config.ts` file, wires `window.__cuit` in dev only, and adds a `cuit-debug.spec.ts` example.
- **Given** the engineer's app exposes a Zustand store named `useEditorStore`, **when** they answer the CLI's "which stores expose state for testing" prompt, **then** `window.__cuit.getState()` returns the store's state.
- **Given** the engineer runs the example spec, **when** Playwright executes, **then** the spec passes on Chromium, Firefox, and WebKit without any pixel-coordinate code.
- **Given** the engineer's app does not match any auto-detected stack, **when** they run init, **then** the CLI prints a documented manual-setup path with a working code sample, not an error.
- **Edge case:** the project has no Playwright installed — init prompts to install and configure it, with consent.
- **Edge case:** the project has its own `window.__app` namespace — init uses a configurable namespace (default `__cuit`).
- **Failure case:** install in a non-Node project (e.g. Rails-only) — exits with a clear error.

#### Story 8.1.2 — Replace a flaky drag test (P0)

> *As a frontend engineer with a known-flaky drag test in my Playwright suite, I want to rewrite it using `dispatchDrag`, so that the test stops flaking on viewport changes.*

**Acceptance criteria:**
- **Given** an existing test using `page.mouse.move(x, y)` math, **when** the engineer replaces it with `cuit.dispatchDrag('segment-3', { deltaX: 120 })`, **then** the test passes on all three browsers and on viewports 1024×768, 1440×900, and 1920×1080.
- **Given** the dragged element does not exist, **when** the helper is called, **then** it throws a descriptive error with the available test IDs nearby.
- **Edge case:** drag delta puts the element off-screen — helper handles or fails loudly, not silently.
- **i18n:** the helper accepts an element ID, not user-facing text, so RTL / non-English UIs work identically.

#### Story 8.1.3 — Freeze the clock for animation testing (P0)

> *As a frontend engineer testing an animation, I want to advance the rAF clock by a fixed delta, so that my test does not depend on wall-clock time.*

**Acceptance criteria:**
- **Given** `cuit.setClock(0)` then `cuit.tick(16)`, **when** the next animation frame fires, **then** the rAF callback receives `timestamp = 16`.
- **Given** multiple `tick` calls, **when** the test runs, **then** rAF callbacks fire in expected order with cumulative timestamps.
- **Edge case:** test forgets to call `setClock` first — `tick` throws with a clear "did you forget setClock?" message.

#### Story 8.1.4 — Snapshot and assert harness state (P0)

> *As a frontend engineer, I want to assert against the post-interaction state shape, so that my test does not rely on pixel screenshots.*

**Acceptance criteria:**
- **Given** an interaction completes, **when** the test calls `cuit.getState().segments[0]`, **then** it returns the live store snapshot.
- **Given** the state shape evolves (a new field added in the store), **when** old tests run, **then** they still pass because they assert on specific fields, not the whole object.
- **i18n:** state assertions are language-agnostic by construction (no text matching).

#### Story 8.1.5 — Run cross-browser without extra config (P1)

> *As a frontend engineer, I want my harness tests to run on Chromium / Firefox / WebKit, so that I catch Safari-specific pointer bugs before users do.*

**Acceptance criteria:**
- **Given** the default `cuit.config.ts`, **when** the engineer runs `npx playwright test --project=webkit`, **then** harness helpers dispatch the right event type (pointer vs mouse vs touch) per browser.
- **Edge case:** WebKit pointer event format differs — harness emits a compatible synthetic event, not a raw `pointer` if the browser does not implement it.

#### Story 8.1.6 — Anonymous heartbeat opt-out (P0 for trust)

> *As a privacy-conscious user, I want the OSS library to never phone home, so that I trust it in regulated environments.*

**Acceptance criteria:**
- **Given** default install, **when** the harness runs, **then** it sends one anonymous heartbeat per week (UA + lib version + opt-out token), and only if `CUIT_TELEMETRY` env var is unset or `=1`.
- **Given** `CUIT_TELEMETRY=0` is set, **when** the harness runs, **then** no network call leaves the host.
- **Documented:** the heartbeat payload schema is in `docs/telemetry.md`.

### 8.2 SaaS customer — team lead managing the dashboard

#### Story 8.2.1 — Connect a session source (P0)

> *As a team lead, I want to connect our Jam workspace via OAuth, so that bug reports start flowing into the SaaS dashboard within 5 minutes.*

**Acceptance criteria:**
- **Given** the user clicks "Connect Jam," **when** they complete OAuth, **then** the dashboard shows a list of recent Jam recordings within 60 seconds.
- **Given** a Jam recording is selected, **when** the user clicks "Generate spec," **then** an LLM extraction job is queued and surfaces progress.
- **Edge case:** OAuth scope is too narrow — dashboard shows a remediation prompt with the exact scope needed.
- **Failure case:** Jam token revoked — dashboard surfaces a clear reconnect prompt and stops attempting calls.
- **Security:** the OAuth token is encrypted at rest (KMS-wrapped) and never logged.
- **Audit log:** connecting/disconnecting a source is recorded with actor, timestamp, IP.

#### Story 8.2.2 — Generate a spec from a session (P0)

> *As a team lead, I want the LLM to extract a Playwright spec from a session, so that an engineer can review and merge it.*

**Acceptance criteria:**
- **Given** a normalized session with at least 3 user-events, **when** generation runs, **then** the output is a `.spec.ts` file that imports from `@cuit/harness` and uses only documented primitives.
- **Given** the spec is generated, **when** the system dry-runs it against the customer's staging URL, **then** it labels the spec RED (reproduces bug), GREEN (already fixed), or INCONCLUSIVE (LLM uncertain) before showing it to a human.
- **Given** the LLM is uncertain (confidence <0.6), **when** generation completes, **then** the spec is flagged "needs human disambiguation" and not eligible for auto-PR.
- **Edge case:** session is too short (<3 user-events) — the system declines politely and does not bill the customer.
- **Edge case:** session is too long (>2 min) — the system splits into candidate windows and lets the user pick one.
- **Cost:** every spec generation surfaces an estimated and actual LLM cost line in the audit trail.

#### Story 8.2.3 — Auto-open a GitHub PR with the spec (P0)

> *As a team lead, I want generated specs to land as PRs in our repo, so that engineers can review them in their normal workflow.*

**Acceptance criteria:**
- **Given** the GitHub app is installed and the spec is APPROVED in the dashboard, **when** the user clicks "Open PR," **then** a PR is created on a branch named `cuit/spec-<issue-or-session-id>`, with the spec file added to `tests/playwright/` (or the configured directory).
- **Given** the PR is opened, **when** an engineer comments `/cuit regenerate`, **then** the system re-runs extraction and updates the PR.
- **Given** the PR is merged, **when** the spec runs in CI, **then** the dashboard records the spec as ACTIVE and gates future regressions.
- **Edge case:** repo has branch protection requiring 2 reviews — PR opens normally, system does not bypass.

#### Story 8.2.4 — Auto-reopen issue on regression (P0)

> *As a team lead, I want a previously-green spec going red to auto-reopen the original issue, so that we catch reopens without engineer attention.*

**Acceptance criteria:**
- **Given** a spec was generated from issue #1933 and is currently green, **when** the spec turns red in CI, **then** issue #1933 is auto-reopened with a comment linking the breaking commit SHA.
- **Given** an auto-reopen happens, **when** the engineer fixes it and the spec turns green again, **then** the issue is auto-closed with a comment linking the fix commit.
- **Edge case:** spec was deleted by an engineer (intentional) — system does not reopen; dashboard records the deletion.

#### Story 8.2.5 — Cost dashboard (P0 for trust)

> *As a buyer, I want a live cost dashboard, so that I can predict our monthly bill and explain the unit economics.*

**Acceptance criteria:**
- **Given** the customer is on a usage-based plan, **when** they open the dashboard, **then** they see month-to-date spend with breakdown: specs generated, sessions ingested, runner minutes used.
- **Given** the customer sets a monthly budget cap, **when** the cap is approached (80%), **then** an email + Slack alert fires.
- **Given** the cap is hit, **when** new generation requests come in, **then** the system soft-blocks (paid feature behind cap) but never silently consumes overage without confirmation.

### 8.3 Buyer — VP Engineering

#### Story 8.3.1 — See the Reopen reduction metric (P0)

> *As a VP Engineering, I want a quarterly report showing Reopen-rate reduction on covered surfaces, so that I can justify the spend to the CFO.*

**Acceptance criteria:**
- **Given** the customer has been live for ≥30 days, **when** they open the Insights tab, **then** they see Reopen rate before vs after adoption, with the underlying issue list.
- **Given** the customer requests a CSV export, **when** they click Export, **then** they get a CSV with one row per spec, surface, issue, fix commit, current status.

#### Story 8.3.2 — Procurement-ready compliance pack (P0 at GA)

> *As a buyer, I want SOC 2 Type II reports, DPA, and SCC templates available in the dashboard, so that procurement does not block the deal.*

**Acceptance criteria:**
- **Given** the customer is on Team or Enterprise tier, **when** they open the Compliance tab, **then** they can download the latest SOC 2, DPA template, sub-processor list, and architecture diagram.
- **Given** the customer adds a DPO email, **when** a sub-processor changes, **then** the DPO is auto-notified.

### 8.4 Out-of-band stories (P2)

- Slack / Linear notifications on new spec PRs
- VS Code extension showing inline spec coverage per source file
- "Suggested next session to convert" weekly digest
- IDE-side dry-run before opening a PR

---


## 9. Requirements matrix

### 9.1 Must Have (P0) — required for paid GA

| # | Requirement | Acceptance Criteria summary |
|---|---|---|
| R-001 | OSS harness library with `dispatchDrag`, `dispatchResize`, `setClock`, `tick`, `getState`, `wheel`, `touch` primitives | All primitives validated on SpeechLab waveform; >95% test coverage on the harness itself |
| R-002 | `npx @cuit/harness init` CLI with React+Zustand, React+Redux, Vue+Pinia, Svelte stores auto-detection | Fresh project setup in <1 hour end-to-end |
| R-003 | Anonymous opt-out telemetry heartbeat | Disabled via env var; documented payload |
| R-004 | Jam connector (OAuth) | Session list within 60 sec of connect |
| R-005 | Sentry Replay connector (org token) | Replay segments fetched and normalized to rrweb |
| R-006 | LogRocket connector (org API token, polling) | Sessions ingested with hourly schedule + manual trigger |
| R-007 | rrweb normalization layer | Common SessionEvent schema across all connected sources |
| R-008 | LLM spec extraction pipeline (3-pass) | ≥60% engineer acceptance by end of Q2; ≥75% by end of Q4 |
| R-009 | Dry-run sandbox to label specs RED/GREEN/INCONCLUSIVE | Result attached to every generated spec before review |
| R-010 | GitHub App with PR creation, branch protection respect, comment commands | Round-trip from session to PR <60 min median |
| R-011 | Auto-reopen issue on previously-green spec going red | Linked to commit SHA |
| R-012 | Cost dashboard with usage breakdown and budget caps | Real-time, ≤2-minute lag |
| R-013 | RBAC: owner / admin / engineer / billing roles | Enforced on every API call |
| R-014 | SSO via SAML and OIDC | Required for Team tier and above |
| R-015 | SOC 2 Type I report available | End of Q3 |
| R-016 | Audit log of every action with actor, timestamp, IP, outcome | 90-day retention default; longer retention configurable |
| R-017 | KMS-wrapped encryption of every source-side token | Per-customer KMS key for Enterprise |
| R-018 | Self-hosted runner option | Customer can run extractor + connector in their VPC; only metadata flows to SaaS |

### 9.2 Should Have (P1) — by end of Q3 or shortly after GA

| # | Requirement | Notes |
|---|---|---|
| R-101 | FullStory connector | Lower priority — fewer ICP customers use FullStory |
| R-102 | Datadog RUM Replay connector | Higher value for observability-mature buyers |
| R-103 | Hosted Playwright runner cluster | For customers without strong CI |
| R-104 | Visual regression as secondary signal at frozen clock | Already validated in Branch B Layer 6 |
| R-105 | Slack / Linear / Jira notifications | Channel mapping per repo |
| R-106 | Spec quality scoring (heuristics + LLM judge) shown next to each spec | Confidence + selector stability + assertion specificity |
| R-107 | Bring-your-own-model option (Anthropic / OpenAI / Azure OpenAI key) for Enterprise | Bills LLM directly to customer's provider |
| R-108 | Multi-repo support per customer | Mono-repos and multi-repo orgs both first-class |
| R-109 | SOC 2 Type II | End of Q4 |

### 9.3 Nice to Have (P2) — Y2 or opportunistic

| # | Requirement | Notes |
|---|---|---|
| R-201 | VS Code extension with inline spec coverage indicators | Developer love feature |
| R-202 | Native mobile (iOS/Android) connector | Large incremental effort |
| R-203 | Canvas/WebGL pixel-diff fallback | Niche but valuable for design-tool customers |
| R-204 | Spec refactor agent ("rewrite this spec to be more readable") | Quality-of-life |
| R-205 | A/B test of spec generation strategies (LLM model, prompt variant) per customer | Continuous improvement |
| R-206 | Marketplace of community-contributed adapters for less-common state libs | OSS community growth |

---

## 10. UX flow

The product has three primary surfaces. Each is described as a step-by-step journey; Figma references are placeholders pending design.

### 10.1 Surface 1 — OSS install (no SaaS)

1. Engineer runs `npm install @cuit/harness` and `npx @cuit/harness init` in their repo.
2. CLI prompts: detected stack (e.g., "React 18 + Zustand 4 + Playwright 1.45"); confirm Y/N.
3. CLI prompts: which state stores to expose for testing (list of detected stores).
4. CLI prompts: which directory holds Playwright specs (default `tests/playwright/`).
5. CLI writes `cuit.config.ts`, a `tests/playwright/_cuit-debug.spec.ts` sample, and adds the dev-only `window.__cuit` mount to `src/main.tsx` or equivalent with a clearly-commented line.
6. CLI prints next-step instructions including: how to write a `dispatchDrag` test, how to run cross-browser, how to opt out of telemetry.
7. Engineer commits the changes; PR description includes a one-liner explaining the harness.

### 10.2 Surface 2 — SaaS onboarding (first time)

1. User signs up via SSO (Google/GitHub/SAML).
2. Onboarding wizard asks: which product surface are you testing? (Editor, design tool, dashboard, other).
3. Wizard asks: where do your user sessions live? (Jam / LogRocket / Sentry / FullStory / Datadog RUM / none yet).
4. User connects at least one source via OAuth or pastes an org token.
5. Wizard validates the connection by listing the 5 most recent sessions.
6. User selects "Connect GitHub" and installs the GitHub App with permission to the target repo(s).
7. User selects one recent session and clicks "Generate first spec" — this is the wow moment.
8. The system shows live progress: "Normalizing session events… Identifying interaction window… Extracting steps… Inferring assertions… Dry-running against your staging URL…"
9. The result page shows the generated spec, the labelled status (RED/GREEN/INCONCLUSIVE), and a side-by-side view of the session timeline.
10. User clicks "Open PR" — PR opens in GitHub with the spec, the issue link, and a reviewer assigned.
11. User is dropped into the dashboard with the spec PR pinned at top.

### 10.3 Surface 3 — SaaS daily use (post-onboarding)

1. User opens the dashboard. Top bar shows: month-to-date specs generated (and cost), Reopen-rate trend, active source connections.
2. Left nav: Inbox (new sessions), Specs (all generated), Sources, Insights, Settings.
3. Inbox shows sessions in priority order: Sentry-error-tagged sessions first, then Jam-reported, then unstructured replays.
4. User clicks a session: timeline + console + network + screenshot of the bug moment + suggested spec.
5. User clicks "Generate" — spec generation runs and PR is opened.
6. Optional: user comments on the PR with `/cuit regenerate --hint "the bug is actually about segment 0 specifically"` to refine.
7. Spec merges; dashboard shows it as ACTIVE.
8. If the spec ever goes red later, dashboard surfaces it under Insights → Regressions and the original issue auto-reopens.

### 10.4 Failure & empty states

- **Empty Inbox:** "No new sessions yet. Connect a second source, or check your connector status."
- **All-INCONCLUSIVE batch:** "We could not confidently extract these specs. Common causes: very long sessions, unrecognized selectors. Try shortening the time window."
- **Source connection failure:** banner with one-click reconnect.
- **Budget cap hit:** modal showing month-to-date usage, with upgrade or wait-til-next-month options.

---

## 11. Technical considerations

### 11.1 Architecture (one diagram)

```
                ┌──────────────────────────────────────────────────────────────┐
                │   OSS Library (single canonical codebase, MIT/Apache)         │
                │   @cuit/harness                                                │
                │   - dispatch helpers (drag, resize, wheel, touch, seek)        │
                │   - clock (setClock, tick)                                     │
                │   - state snapshot (getState, getStateShape)                   │
                │   - debug API (window.__cuit) — dev/test only, tree-shaken    │
                │   - test invariants (mutation, instance count, css observer)  │
                │   - CLI init                                                   │
                └──────────────────────────────────────────────────────────────┘
                                          │
                                          │ installed into customer repo
                                          ▼
                ┌──────────────────────────────────────────────────────────────┐
                │   Customer repo (App + Playwright)                             │
                │   - tests/playwright/*.spec.ts using @cuit/harness            │
                │   - CI runs Playwright; results posted to SaaS                 │
                └──────────────────────────────────────────────────────────────┘
                                          │
                                          │ runs CI, posts spec status
                                          ▼
                ┌──────────────────────────────────────────────────────────────┐
                │   SaaS — closed source                                         │
                │   ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
                │   │ Connectors     │  │ LLM extraction   │  │ Cost & RBAC │ │
                │   │ Jam OAuth      │→ │ pipeline (3-pass)│→ │ accounting  │ │
                │   │ LogRocket tok  │  │ + dry-run sandbox│  │ + audit log │ │
                │   │ Sentry token   │  │                  │  │             │ │
                │   │ FullStory tok  │  └──────────────────┘  └─────────────┘ │
                │   │ Datadog tok    │           │                             │
                │   └────────────────┘           │                             │
                │            │                   ▼                             │
                │            │            ┌──────────────┐                     │
                │            └───────────▶│ Session store│                     │
                │                         │ (rrweb-norm) │                     │
                │                         └──────────────┘                     │
                │                                                              │
                │   GitHub App  ──────→  PR creation, issue reopen, comments  │
                │   Dashboard   ──────→  React + Next.js                       │
                │   Auth        ──────→  SSO (SAML/OIDC), RBAC                 │
                └──────────────────────────────────────────────────────────────┘
```

### 11.2 API surface (OSS library)

The OSS library exposes a small, frozen API. Stability is part of the trust contract.

```typescript
// @cuit/harness — frozen public API
export function dispatchDrag(elementId: string, opts: DragOptions): Promise<void>;
export function dispatchResize(elementId: string, opts: ResizeOptions): Promise<void>;
export function wheel(elementId: string, opts: WheelOptions): Promise<void>;
export function touch(elementId: string, gesture: TouchGesture): Promise<void>;
export function seekTo(timeMs: number): Promise<void>;

export function setClock(t: number): void;
export function tick(deltaMs: number): void;
export function resetClock(): void;

export function getState<T = unknown>(storeName?: string): T;
export function getStateShape(): StateShape;

export function installDebugApi(opts: InstallOptions): void;
export function uninstallDebugApi(): void;

// Invariant helpers
export function expectNoOrphanInstances(): Promise<void>;
export function expectNoUnexpectedMutations(scope: string): Promise<void>;
export function expectCssAttributeStable(elementId: string, attrs: string[]): Promise<void>;
```

The harness must run in three environments: customer's dev build, Playwright test build, and customer's CI. Tree-shaking guarantees zero footprint in production builds (gated on `NODE_ENV === 'production'`).

### 11.3 SaaS API surface

REST + Webhooks; OpenAPI spec maintained at `/api/v1/openapi.json`.

Core endpoints:
- `POST /v1/sources` — connect a session source
- `GET /v1/sessions` — list normalized sessions with filters
- `POST /v1/specs` — generate a spec from a session
- `POST /v1/specs/{id}/dry-run` — re-run dry-run against staging URL
- `POST /v1/specs/{id}/pr` — open a GitHub PR
- `GET /v1/usage` — usage and cost report
- Webhooks: `spec.generated`, `spec.pr_opened`, `spec.regression_detected`, `issue.auto_reopened`

### 11.4 Database / storage

- Session events stored in object storage (S3-compatible) with metadata index in PostgreSQL.
- Per-tenant encryption at rest with KMS-wrapped data keys.
- Audit log in append-only PostgreSQL table with retention policy.
- LLM-generated specs stored on disk in PR branch only — we do not retain them in our DB beyond a short cache.

### 11.5 Performance and cost targets

| Metric | Target |
|---|---|
| Time from "Generate spec" click to spec ready for review | p50 < 2 min, p95 < 10 min |
| Time from spec PR open to first dry-run result | p50 < 5 min |
| Dashboard page load (cold) | p95 < 2 sec |
| LLM cost per generated spec | $0.50–$2.50 typical (see §12) |
| Connector ingestion lag | <60 sec for webhook-driven; <1 hour for polling |
| Spec extraction success rate (returns a non-INCONCLUSIVE spec) | ≥80% |
| Spec engineer-acceptance rate | ≥60% Q2, ≥75% Q4 |

### 11.6 Third-party dependencies

- **LLM provider:** Anthropic Claude (primary) + OpenAI GPT-5 (secondary, fallback). Multi-provider for resilience and price arbitrage. Customer-bring-your-own-key option for Enterprise.
- **Object storage:** AWS S3 (primary), GCS supported for Enterprise.
- **Compute:** AWS ECS for the SaaS app; Playwright runners on AWS Fargate spot.
- **Auth:** WorkOS for SSO / SAML / SCIM.
- **Audit / SOC 2:** Vanta or Drata for SOC 2 automation.
- **Observability:** Datadog (we drink our own champagne — observability provider is also a session-source partner).
- **Payments:** Stripe.

### 11.7 i18n / localization impact

The library and dashboard target English-first for Y1. Library APIs are language-agnostic by construction (selectors and IDs, not user-facing text). Generated specs do not depend on UI language. The dashboard ships English-only in Y1; we add at minimum Japanese and German in Y2 (large engineering markets where buyers prefer localized procurement docs). Audit log timestamps and DPA documents are available in any locale's date format.

### 11.8 Security model (high level — full threat model in separate doc)

- **Defense in depth on session data:** sessions are the customer's user data; we treat them as PII by default. All session storage encrypted, per-tenant KMS keys for Enterprise, redaction of any obvious PII (emails, credit cards) at ingest.
- **No persistent customer credentials in our DB:** OAuth tokens encrypted at rest; rotated proactively.
- **Network egress:** the OSS harness never makes network calls from the customer app at runtime (only a once-per-week opt-out heartbeat from dev environments). All SaaS calls happen from the SaaS side, not the customer's app.
- **SOC 2 Type I by Q3, Type II by Q4** — see §3.1.

---

## 12. Pricing and packaging

### 12.1 Tiers

| Tier | Audience | Price | Includes |
|---|---|---|---|
| **OSS** | Anyone | Free, MIT/Apache | Full harness library, CLI, docs, community Discord, GitHub Issues support |
| **Self-Hosted SaaS** | Security-strict enterprises wanting the pipeline in their VPC | $48k/yr base + usage | Docker images for connector + extractor + dashboard; customer brings their own LLM keys; community support only |
| **SaaS Starter** | Series A or small Series B; 1–3 repos; 1 source | $499/mo + usage | 1 source connector, 1 repo, 50 specs/mo included, email support |
| **SaaS Team** | Series B–D; up to 5 repos; up to 3 sources | $1,999/mo + usage | 3 source connectors, 5 repos, 200 specs/mo included, Slack support, SSO, audit log |
| **SaaS Enterprise** | Series D+ or security-strict | $5,000/mo+ + usage; custom contract | Unlimited repos and sources, SOC 2 Type II, SCIM, SLA, BYO-LLM-key, dedicated CSM, contractual data-residency |

### 12.2 Usage components

Two metered components on every paid tier:

| Component | Default included | Overage |
|---|---|---|
| **Spec generated** (definition: a successful LLM extraction that returns a non-INCONCLUSIVE spec eligible for human review) | Per-tier monthly allowance (50 / 200 / 1000+) | $5 per spec (Starter), $4 (Team), $3 (Enterprise) |
| **Session ingested** (definition: one normalized session stored and indexed) | 1000 / 5000 / 25000 monthly | $0.05 per session over allowance |

Optional add-on: **Hosted Playwright runner minutes** — $0.10/min, billed monthly. Most customers run on their own CI; this is for those who don't.

### 12.3 Cost-per-spec back-of-envelope

Assumes Claude Sonnet 4.x pricing of ~$3/M input tokens and ~$15/M output tokens (or roughly equivalent GPT-5 pricing).

| Pipeline stage | Input tokens | Output tokens | Cost |
|---|---|---|---|
| Pass 1: identify bug-relevant window in a normalized 5-min session (~10k events ≈ ~40k tokens after pruning) | 40,000 | 500 | $0.13 |
| Pass 2: extract canonical interactions from the windowed events (~5k tokens) | 5,000 | 1,500 | $0.04 |
| Pass 3: infer assertions and emit spec.ts | 8,000 | 2,500 | $0.06 |
| Dry-run sandbox (no LLM, Playwright execution) | — | — | $0.04 (compute) |
| Overhead: retries, judge model, embeddings for similar-spec dedup | — | — | $0.08 |
| **Total median cost** | | | **$0.35** |
| **Worst-case (long session, multiple retries)** | | | **~$2.50** |

At Starter $5/spec, gross margin is ~93% on median, ~50% worst case. At Team $4/spec, ~91% / ~40%. Margins are healthy and consistent with the SaaS-on-LLM pattern as of 2026.

### 12.4 Pricing principles

- **Usage-based components are bounded by visible budget caps.** No surprise bills. Cap default is set at the tier's allowance + 100%; customer can raise or lower.
- **The OSS library is never paywalled.** No "OSS Pro." Every primitive in the library is free forever. Open-core anti-patterns kill OSS adoption.
- **Onboarding is included.** Up to 4 hours of dedicated implementation support on Team; full white-glove on Enterprise.
- **Annual contracts get a 15% discount; multi-year another 5%.**
- **No per-seat fees on the dashboard** — usage components only. Seats are unlimited on every paid tier. We do not want pricing to discourage engineers from looking at the dashboard.

### 12.5 What does NOT count as a "spec generated" (billing clarity)

- INCONCLUSIVE extractions (LLM confidence below threshold): not billed.
- Failed extractions due to our infrastructure error: not billed.
- Regenerations of an existing spec from the same session: not billed within 24 hours.
- Specs the engineer rejects in the dashboard within 24 hours of generation: billed at 50% — to disincentivize spammy generation while not penalizing thoughtful rejection.

---


## 13. Open-source vs commercial boundary

The hybrid model only works if the line between OSS and SaaS is defensible, explainable, and stable. Customers and contributors must trust that the OSS will not be quietly stripped to drive SaaS upgrades.

### 13.1 The principle

> **OSS contains everything a customer needs to run, test, and ship complex UIs with deterministic, harness-grounded tests in their own repo and CI. SaaS contains everything that requires shared infrastructure, multi-tenant cost economics, or third-party integration secrets that should not live in a customer's repo.**

If something becomes useful to many users running on their own machine, it goes in OSS. If something only makes sense as a shared, billed, audited service, it goes in SaaS.

### 13.2 Concrete split

| Capability | Lives in | Why |
|---|---|---|
| `dispatchDrag`, `dispatchResize`, `wheel`, `touch`, `seekTo` | **OSS** | Library primitives; every user needs them |
| `setClock`, `tick`, `resetClock` | **OSS** | Clock control is fundamental, not differentiating |
| `getState`, state-shape adapter | **OSS** | The harness is useless without it |
| `window.__cuit` debug API, CLI init | **OSS** | Developer ergonomics; trust requires being open |
| Invariant helpers (mutation, instance count, css attr) | **OSS** | Same |
| Stress fixtures (90-min projects, 600+ segments) sample data generators | **OSS** | Useful for OSS users; not a moat |
| Cross-browser dispatch adapters (pointer ↔ mouse ↔ touch translation) | **OSS** | Generic browser-engine quirk handling |
| Per-vendor session-source adapters (Jam, LogRocket, Sentry, FullStory, Datadog) | **SaaS** | Requires holding the vendor credentials; multi-tenant token storage; not safe to ship in customer repo |
| LLM extraction pipeline (Pass 1/2/3) | **SaaS** | Customers pay for shared inference, cost accounting, prompt fine-tuning, eval harness; nobody wants to run this in-tree |
| Dry-run sandbox cluster | **SaaS** | Hosted compute; per-spec billing |
| GitHub App | **SaaS** | One-click installable; SaaS-hosted webhook receiver |
| Dashboard + Inbox + Insights | **SaaS** | Multi-tenant UI; auth; RBAC; cost data |
| Audit log, RBAC, SSO, SCIM | **SaaS** | Compliance surface; cannot be replicated meaningfully in OSS |
| Cost accounting and budget caps | **SaaS** | Definitionally a billed service |
| Auto-PR open / issue auto-reopen flow | **SaaS** | Requires customer GitHub App install + webhook; not viable as a CLI |

### 13.3 Why this avoids the "open core" anti-pattern

The OSS library is **complete on its own.** A developer can:
- Install it via npm
- Wire it into a React + Zustand app in <1 day
- Replace flaky drag tests with deterministic harness specs
- Run cross-browser
- Get the full developer experience documented in this PRD

…all without ever signing up for the SaaS.

What the developer **cannot** do without the SaaS:
- Connect to Jam/LogRocket/Sentry/FullStory and have sessions normalized automatically
- Get LLM-generated specs from sessions
- Get multi-tenant cost accounting on LLM inference
- Get SOC 2 / audit log / RBAC for the team's testing infrastructure
- Get the auto-PR / issue-reopen automation

That is a sharp, principled line. It mirrors how Vercel/Next.js, Supabase/Postgres, and Sentry/sentry-sdk navigate the same boundary: the SDK/runtime/library is free and complete; the hosting/automation/team-features are paid.

### 13.4 Versioning and stability commitments

- The OSS library follows semver. We commit to:
  - Never making a primitive paid-only or behind a feature flag
  - 12-month deprecation windows for any breaking change
  - LTS releases every 12 months supported for 18 months
- The SaaS commits to:
  - Backwards-compatible API for at least 12 months on every public endpoint
  - Migration tooling for any breaking change
  - 99.9% uptime SLA on Enterprise; best-effort on Starter/Team

### 13.5 Contributor governance

- OSS repo lives at `github.com/cuit/harness` (placeholder).
- A small core team (1–3 SpeechLab engineers in Y1) reviews PRs.
- A documented RFC process for non-trivial changes.
- A code of conduct and contributor license agreement (CLA) — Apache-2.0-style with explicit patent grant.
- A SpeechLab-controlled fork is **not** maintained; SpeechLab consumes the same OSS as everyone else. This is the single-canonical-codebase commitment.

---

## 14. Success metrics

### 14.1 North star

**Specs accepted by engineers per week (across all customers).**

This compound metric captures the entire value chain: connector working + extraction quality + UX trustworthy + product solving a real problem. Acceptance means the engineer merged the PR without rewriting more than 2 lines.

### 14.2 Supporting metrics — product

| Metric | Q1 target | Q2 target | Q3 target | Q4 target | Measurement |
|---|---|---|---|---|---|
| Specs accepted per week (north star) | n/a (internal only) | 5 (1 design partner) | 50 (3 partners) | 250 (10 customers) | Dashboard event |
| Spec acceptance rate (% accepted with ≤2 edits) | n/a | 60% | 70% | 75% | Dashboard event |
| Median time: session → reviewable spec | <30 min | <20 min | <15 min | <10 min | Server timing |
| INCONCLUSIVE rate (extraction confidence too low) | <30% | <25% | <20% | <15% | Server log |
| Cross-browser pass rate for generated specs (Chromium + Firefox + WebKit all green) | n/a | 80% | 85% | 90% | Dry-run sandbox |

### 14.3 Supporting metrics — OSS adoption

| Metric | Q1 | Q2 | Q3 | Q4 | Source |
|---|---|---|---|---|---|
| Weekly active installs (anonymous heartbeat) | 100 | 1000 | 3000 | 5000 | Heartbeat aggregator |
| GitHub stars on the OSS repo | 500 | 2000 | 5000 | 10000 | GitHub API |
| Contributors with merged PRs | 2 | 8 | 20 | 40 | GitHub API |
| Discord active members | 50 | 250 | 800 | 1500 | Discord API |
| npm weekly downloads | 500 | 5000 | 20000 | 50000 | npm registry |

### 14.4 Supporting metrics — revenue

| Metric | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Design partner contracts signed | 1 (SpeechLab internal) | 3 paid | 5 paid | 10 paid | At $24k–$60k ACV |
| ARR | $0 | $90k | $200k | $400k | Cumulative |
| Net new logos / quarter | 1 | 3 | 4 | 7 | |
| Gross margin on SaaS revenue | n/a | 70%+ | 75%+ | 80%+ | After LLM cost |
| Net revenue retention (existing customers) | n/a | n/a | n/a | 110%+ | First measurable in Y2 |
| CAC payback | n/a | <18 mo | <15 mo | <12 mo | Founder-led GTM in Y1 |

### 14.5 Customer-side metrics we will publicly track per account (with consent)

These are the metrics we hand the buyer at QBRs:

| Metric | Definition |
|---|---|
| Bug Reopen rate on covered surfaces | Issues that re-opened within 90 days after fix / total issues |
| Mean time to regression test from bug report | Hours from issue created to spec merged |
| CI flake rate on covered specs | Spec runs that were flaky in last 30 days / total runs |
| Cross-browser bug escape count | Bugs reported on Safari/Firefox not caught on Chromium-only CI |
| Spec coverage on critical surfaces | # specs per surface area (waveform, timeline, drag-grid, etc.) |

---


## 15. Go-to-market strategy

### 15.1 Phase 0 — pre-launch (Q1)

**Audience:** the SpeechLab waveform team and a handful of trusted external engineers.

**Activities:**
- Finish Branch B merge to main (already in flight as PR #1995).
- Productize the harness as `@cuit/harness` (rename, polish CLI, add adapters).
- Internal dogfood: SpeechLab waveform runs entirely on the public OSS package, not an internal fork. Any pain SpeechLab feels is the pain every customer will feel.
- Recruit 5 friendly engineers for private feedback on the OSS install flow.

**Exit criteria for Phase 0:** SpeechLab waveform tests all run on the published OSS package; 5 external engineers complete install in <1 day without founder hand-holding.

### 15.2 Phase 1 — OSS launch (early Q2)

**Audience:** technical Twitter/Bluesky/Hacker News crowd; frontend Discord/Slack communities.

**Activities:**
- **Show HN:** "We extracted the test harness that fixed our waveform editor — open-sourced." Lead with concrete Branch B results: 8 bugs locked in, 0 reopens, cross-browser green.
- **Founder blog post** (long-form on `cuit.dev/blog` and crossposted to dev.to): "Why your drag tests flake, and what to do about it." Explicit code samples comparing `boundingBox()` to `dispatchDrag`.
- **Twitter/Bluesky thread** with embedded video of the same Playwright test flaking before, deterministic after.
- **Reddit /r/reactjs, /r/javascript, /r/programming** — submit the blog post.
- **Podcast circuit (warm-up):** appear on Frontend First, Syntax.fm, JS Party with the SpeechLab Branch B story. Pitch: "real, scarred-by-flake testing pattern from production."
- **First 3 conference CFPs submitted:** React Summit (June), TestJS Summit (Dec), JSConf US.

**Success criteria:** 1000 OSS weekly installs by end of Q2, 50 GitHub Discussions threads, the blog post ranks on first page of Hacker News.

### 15.3 Phase 2 — design partner motion (Q2–Q3)

**Audience:** the 5 named target accounts in §4.4.

**Activities:**
- **Direct outreach via warm intros.** Founder networking through SpeechLab investors, Bay Area dev meetup circuit, Andrew Davis (SpeechLab CTO) network.
- **Design partner contract template:**
  - $24k–$60k Y1 ACV depending on tier
  - 50% discount in exchange for: bi-weekly product feedback calls, name use in case studies, logo on website, willingness to be a reference call
  - 12-month commitment with a 30-day out clause in the first 60 days
  - SOC 2 readiness commitment (we will be SOC 2 Type I by Q3)
- **White-glove onboarding:** founder + a senior engineer pair with the partner for 1 week of integration. We learn their workflow; they learn the product.
- **Quarterly business review (QBR)** with each design partner including: Reopen-rate impact, spec acceptance rate, cost-per-spec trend, asks for next quarter.

**Success criteria:** 3 paid design partners signed by end of Q2, 5 by end of Q3, NPS ≥40 on partner survey.

### 15.4 Phase 3 — paid GA (Q3)

**Audience:** broader Series B–D market.

**Activities:**
- **GA launch event:** product announcement + a partner customer (e.g., SpeechLab, Descript, or Otter) on stage at TestJS Summit or React Summit.
- **Self-serve signup with credit card** for Starter and Team tiers.
- **Sales motion:** 1 founding sales engineer hired in Q3 (technical generalist who can demo the product), 1 BDR in Q4 for outbound to Tier-2 ICP.
- **Content strategy ramp-up:**
  - Weekly engineering blog (founder + first 2 hires write):
    - "Anatomy of a flaky drag test"
    - "Why screenshot diff misses canvas bugs"
    - "Reading rrweb: a tour"
    - "Five LLM prompt tricks for spec extraction"
  - Monthly case study with a paying customer
- **Community building:**
  - Discord with founder office hours weekly
  - Public roadmap on GitHub Projects
  - Quarterly community call with live Q&A

**Success criteria:** $200k ARR, 5 paying customers, 3 outbound deals closed by founder-led sales.

### 15.5 Phase 4 — scale (Q4)

**Audience:** Series D+ and procurement-driven buyers; ABM motion on top-priority logos.

**Activities:**
- **Outbound ABM** to the Tier-1 ICP list: Descript, Loom, Linear, Retool, Figma, Adobe Express. One BDR running multi-touch sequences.
- **First 2 enterprise contracts (≥$60k ACV)** with SOC 2 Type II, SSO/SCIM, BYO LLM key.
- **Conference talk content:** "Productizing our internal test harness" at React Summit, TestJS Summit, JSConf.
- **Hire #4–6:** 2 backend engineers (extraction pipeline + connectors), 1 designer.

**Success criteria:** $400k ARR, 10 paying customers, first Enterprise contract closed.

### 15.6 Channel strategy — what we will not do in Y1

- No paid Google/LinkedIn ads. Channel returns are poor for dev infra at this stage.
- No reseller / partner channel. Direct-only.
- No analyst-relations push (Gartner/Forrester). Premature; revisit Y2.

### 15.7 Founder-led sales playbook (Q1–Q3)

Until Q3, every sales conversation is founder-led. The conversation arc:

1. **Pain elicitation:** "Tell me about your test suite. What's the flake rate? When was the last time a fixed bug reopened?"
2. **Branch B story:** show the SpeechLab waveform PR with 6 reopens → 0 reopens, 8 bugs locked in.
3. **Live demo:** founder generates a spec from one of the buyer's Jam recordings on screen. Real session, real spec, in <5 minutes.
4. **Pricing:** explain the usage-based model and walk through their projected monthly cost using their bug volume.
5. **Trial:** 30-day paid trial at half price.
6. **Close:** 12-month contract, design partner discount, references commitment.

---

## 16. Risks and honest assumptions

### 16.1 Top 5 product-specific risks

| # | Risk | Likelihood | Impact | Mitigation | Kill criterion (pivot or shut down if true at this date) |
|---|---|---|---|---|---|
| 1 | **LLM extraction quality is too low** — engineers reject more than 50% of generated specs, eroding trust | Medium | Catastrophic | (a) Confidence scoring + INCONCLUSIVE label keeps low-quality specs out; (b) per-customer prompt fine-tuning; (c) eval harness with golden sessions per customer; (d) human-in-loop default for first 6 months on every account | If acceptance rate is still <50% at end of Q3 across all design partners, pause GA and pivot to "session → curated checklist for the engineer to author manually" |
| 2 | **Per-app harness setup is too painful** — onboarding takes more than 1 engineering-day on 70% of accounts, killing the OSS adoption flywheel | Medium-High | High | (a) Investment in `cuit init` auto-detect for React/Vue/Svelte; (b) starter templates per stack; (c) office hours for manual setups; (d) public install-time leaderboard ("we onboarded onto cuit in 47 minutes") to gamify it | If median install time is >4 hours at end of Q2 across 10 external installs, redesign the install flow before committing to GA |
| 3 | **Customers refuse to send session data to our cloud** — security review blocks deal at procurement | Medium | High for Enterprise; low for Starter/Team | (a) Self-hosted extractor offering for the SaaS pipeline; (b) BYO LLM key for Enterprise (the data flows through customer's Anthropic/OpenAI tenant, not ours); (c) SOC 2 fast-track; (d) clear data-retention defaults (90 days) with customer-configurable lower retention | If 50%+ of Enterprise opportunities stall on data residency at end of Q3, prioritize self-hosted SaaS as a first-class product, not an option |
| 4 | **A competitor (Mabl, Reflect, QA Wolf) ships a comparable harness + LLM extraction offering** | Medium | High | (a) Speed to GA — we ship in Q3 vs typical 18-month enterprise tooling roadmap; (b) OSS distribution moat — being the de-facto OSS test harness for complex UIs makes us hard to clone; (c) explicit positioning that our specs live in the customer's repo, not the vendor's platform | If a credible competitor ships an OSS harness + extraction in Y1 H1, we double down on the SpeechLab data flywheel and partner-by-partner deep integration rather than horizontal breadth |
| 5 | **The OSS library never reaches critical mass** — <500 weekly installs at end of Q2; community is dead; SaaS leads have no awareness funnel | Medium | High | (a) Sustained content cadence from founder; (b) explicit "every commit to main of @cuit/harness is also running SpeechLab's waveform tests" badge for credibility; (c) speaker circuit in H1; (d) initial OSS budget for documentation and tutorial videos | If OSS weekly installs are <500 at end of Q2 *and* there are <5 community PRs merged, we re-evaluate whether OSS is the right distribution motion or whether closed-source-with-trial wins for this market |

### 16.2 Lower-likelihood but worth naming

- **Vendor ToS shifts.** Jam/LogRocket/FullStory could restrict third-party API consumption of session data. Mitigation: customer-brings-their-own-token model from day one. We never act as a middleman; we are the customer's agent.
- **WebKit pointer event format keeps drifting** and breaks our cross-browser dispatch. Mitigation: nightly cross-browser tests on the harness itself; Apple WebKit nightly tracked.
- **Anthropic/OpenAI price increases.** Mitigation: multi-provider; per-customer BYO key path; we are not locked to one model.
- **Hiring** — building a small team with the right blend of LLM-eval, browser-event quirk knowledge, and Playwright-test depth. Mitigation: hire from the SpeechLab network first; explicit role descriptions; remote-friendly.

### 16.3 Honest assumptions we are making

We must be explicit about what we are betting on. If any of these are false, the business gets harder.

1. **Series B–D editor/design-tool/dashboard teams will pay for this.** We assume buyers value Reopen-rate reduction and engineering throughput improvement at >$24k/yr. This is testable with the first 5 outreach conversations.
2. **LLM extraction quality is good enough to meet a 60% acceptance threshold by Q2.** This depends on the rrweb-normalized event stream containing enough signal. We have not built this end-to-end yet; SpeechLab Branch B is the harness only.
3. **Engineers prefer "tests in our repo" over "tests in a vendor dashboard."** This is the explicit positioning vs Mabl/Reflect. If the next generation of engineers shifts toward no-code platforms, our positioning weakens.
4. **OSS will drive 30%+ of SaaS lead flow by end of Y1.** We assume the freemium/OSS funnel works. If it doesn't, we will need to invest in outbound sales much earlier.
5. **The SpeechLab waveform proof is convincing to outside buyers.** The 8-bugs-locked-in story is compelling internally; we are betting it travels.

---

## 17. Year-1 roadmap

Quarter-grained roadmap. Each quarter lists: theme, scope, exit criteria, hiring plan.

### 17.1 Q1 — Foundations (Jun–Aug 2026)

**Theme:** "Productize what already works."

**Scope:**
- Rename and publish the Branch B harness as `@cuit/harness` on npm.
- Build `npx @cuit/harness init` CLI with React+Zustand, React+Redux, Vue+Pinia auto-detection.
- Anonymous opt-out heartbeat.
- Public docs site (`cuit.dev` placeholder) with: install guide, API reference, cookbook of common patterns, comparison to alternatives.
- Internal dogfood: migrate the SpeechLab waveform to consume the published OSS library, not the in-tree code.
- Hire #1: founding engineer (extraction pipeline lead).
- Begin SOC 2 readiness (Vanta/Drata setup).

**Exit criteria:**
- `@cuit/harness@1.0.0` published with stable API
- SpeechLab waveform running on `@cuit/harness@1.0.0` with all 9 specs + 37 jest tests green
- 5 external engineers complete install in <1 day without founder hand-holding
- Docs site live
- 100+ OSS weekly active installs

### 17.2 Q2 — Design partner ready (Sep–Nov 2026)

**Theme:** "Close the loop from session to spec PR."

**Scope:**
- Jam connector (OAuth) + Sentry Replay connector (org token) — the two SpeechLab uses today.
- LogRocket connector (org token, polling).
- rrweb normalization layer (single internal schema across the three connectors).
- LLM extraction pipeline (Pass 1/2/3) with eval harness and golden sessions.
- Dry-run sandbox: spec runs against customer's staging URL, labelled RED/GREEN/INCONCLUSIVE.
- GitHub App with PR creation.
- Minimal dashboard: Inbox + Specs + Sources + Settings.
- RBAC + SSO via WorkOS.
- 3 design partner contracts signed at $24k–$60k ACV.
- Hire #2: founding sales engineer (technical generalist).

**Exit criteria:**
- 3 design partners actively using the SaaS
- Median time session → spec PR <20 min
- Spec acceptance rate ≥60%
- $90k ARR

### 17.3 Q3 — Paid GA (Dec 2026–Feb 2027)

**Theme:** "Stand on our own — self-serve and procurement-ready."

**Scope:**
- Self-serve signup + Stripe billing for Starter and Team tiers.
- Usage dashboard with budget caps.
- Audit log + SOC 2 Type I report available.
- FullStory connector.
- Hosted Playwright runner (optional add-on).
- Auto-reopen issue on regression detection.
- Public roadmap, public changelog, public status page.
- Conference talks: React Summit or TestJS Summit launch moment.
- Hire #3: backend engineer (connectors + ingestion).

**Exit criteria:**
- 5 paying customers
- $200k ARR
- SOC 2 Type I complete
- Spec acceptance rate ≥70%
- Public GA announcement

### 17.4 Q4 — Scale (Mar–May 2027)

**Theme:** "Top of the funnel and Enterprise readiness."

**Scope:**
- Datadog RUM Replay connector.
- Bring-your-own-model option (Anthropic / OpenAI / Azure OpenAI keys).
- SCIM for SSO provisioning.
- SOC 2 Type II report.
- Multi-repo support per customer.
- Self-hosted SaaS option (Docker images for connector + extractor + dashboard) for security-strict Enterprise prospects.
- BDR hire for outbound to Tier-1 ICP.
- Hire #4–6: 2 more engineers, 1 designer.
- First 2 Enterprise contracts closed.

**Exit criteria:**
- 10 paying customers
- $400k ARR
- SOC 2 Type II complete
- Spec acceptance rate ≥75%
- First Enterprise contract ($60k+ ACV) closed

### 17.5 Headcount plan

| Quarter | Hires | Cumulative team |
|---|---|---|
| Q1 | Founder + Hire #1 (eng) | 2 |
| Q2 | Hire #2 (founding sales eng) | 3 |
| Q3 | Hire #3 (backend eng) | 4 |
| Q4 | Hire #4 (eng), Hire #5 (eng), Hire #6 (designer), Hire #7 (BDR) | 7–8 |

Capital efficiency target: $400k ARR / 8 FTE ≈ $50k ARR-per-FTE in Y1. This is below the public SaaS benchmark of $150k–$200k per FTE — appropriate for a startup pre-product-market-fit. The target in Y2 is to triple ARR while doubling headcount, getting ARR-per-FTE to $150k+.

---


## 18. Open questions and decisions needed

Before we lock the design, these decisions need explicit sign-off from Ryan (founder) and the eventual design-partner candidates. Track each as a stakeholder decision.

- [ ] **Product name.** "complex-ui-tester" is a working name. Candidates: Harness, Loop, Specwright, Reproduce, Fixed (with a play on "stays fixed"). Action: decide by end of Q1.
- [ ] **License.** MIT vs Apache-2.0. Apache provides explicit patent grant and is slightly more enterprise-friendly. Lean Apache-2.0. Action: confirm with first design partner's legal.
- [ ] **OSS repo location.** GitHub org `cuit/` or `speechlabinc/`. Recommend a neutral org to signal independent governance even though SpeechLab is the founding contributor. Action: create org by end of Q1.
- [ ] **First connector to ship.** Jam or Sentry Replay? Both are SpeechLab-internal but Sentry has wider market presence. Recommend shipping both in Q2 to maximize design-partner addressability; if forced to pick one, Sentry first.
- [ ] **LLM provider primary.** Anthropic Claude 4.x vs OpenAI GPT-5. Recommend Anthropic primary (better long-context handling for session events, lower hallucination on structured-data tasks per current evals); OpenAI secondary fallback. Action: build eval harness with both in Q1.
- [ ] **OSS contributions during the closed-beta phase.** Do we accept community PRs to the harness before Q2 GA, or freeze the OSS to internal-only contributions until then? Recommend freeze-but-public: repo is public read-only, PRs welcomed but not actively merged until Q2.
- [ ] **Hosted runner default-on or default-off.** Most customers will want to keep CI in their own stack. Recommend default-off; add a marketing-friendly hosted-runner option later.
- [ ] **Pricing display: per-spec vs per-session as the headline metric.** Per-spec is more aligned with value delivered; per-session is closer to a usage cap. Recommend per-spec as the headline, with per-session as a soft cap. Action: validate with first 3 design partner conversations.
- [ ] **Data residency for EU customers.** EU-resident customer data — store in eu-west-1 from day one or punt to Y2? Recommend punt; address as Enterprise add-on when the first EU buyer arrives.
- [ ] **Should we ever offer "Mabl-style" hosted recorder?** A browser extension that records the user's interaction and turns it into a spec, no Jam/LogRocket needed. Recommend no in Y1 — it positions us against Mabl and increases scope; revisit Y2.
- [ ] **Whether to support Cypress as a second test runner.** Cypress installed base is large but declining; Playwright is the future. Recommend Playwright-only in Y1; Cypress adapter in Y2 if customer demand justifies.

---

## 19. Glossary

| Term | Meaning |
|---|---|
| **Harness** | The OSS library and its primitives (`dispatchDrag`, `setClock`, `getState`, etc.) |
| **Spec** | A Playwright `.spec.ts` file generated by our pipeline |
| **Session** | A user's recorded interaction (DOM events + console + network) from Jam/LogRocket/Sentry/FullStory/Datadog |
| **Connector** | Per-vendor adapter that pulls sessions into our normalized format |
| **Extraction pipeline** | The 3-pass LLM workflow that converts a session into a spec |
| **Dry-run sandbox** | Hosted Playwright env that runs the generated spec against the customer's staging URL to label it RED/GREEN/INCONCLUSIVE |
| **rrweb** | Open-source DOM-recording library used by Sentry Replay and others; our internal canonical format |
| **INCONCLUSIVE** | A spec the LLM produced but with confidence below threshold — not eligible for auto-PR, not billed |
| **Reopen rate** | % of bugs that re-opened within 90 days of being marked fixed — our primary outcome metric |
| **Branch B / PR #1995** | SpeechLab's internal proof-of-concept implementing harness Layers 1–6 |
| **Layers 1–13** | The architectural stack from the source vision doc; Layers 1–6 are built (Branch B), 7–10 are scoped, 11–13 are the product opportunity |

---

## 20. Appendix — sample spec output

For grounding, what a generated spec looks like (synthetic example, modeled on a SpeechLab bug):

```typescript
// tests/playwright/waveform/issue-1933-segment-drag-snap-back.spec.ts
// Generated by complex-ui-tester from Jam session jam_recording_xyz
// Issue: https://github.com/speechlabinc/translate-ui-react/issues/1933
// Confidence: 0.82

import { test, expect } from '@playwright/test';
import * as cuit from '@cuit/harness';

test.describe('Issue #1933 — segment 0 drag snaps back to original position', () => {
  test('drag segment 0 by +120px stays at new position after release', async ({ page }) => {
    await page.goto('/editor/project_demo');
    await cuit.installDebugApi({ page, stores: ['useEditorStore'] });

    // Freeze clock so animation timing is deterministic
    await cuit.setClock(0);

    const before = await cuit.getState<EditorState>();
    expect(before.segments[0].start).toBe(0);

    await cuit.dispatchDrag('segment-0', { deltaX: 120 });
    await cuit.tick(16);  // advance one frame

    const after = await cuit.getState<EditorState>();
    expect(after.segments[0].start).toBe(120 / before.pixelsPerSecond);
    expect(after.segments[0].start).not.toBe(before.segments[0].start);
  });
});
```

Note what the generated spec is NOT doing:
- No `page.mouse.move(x, y)` math
- No `await page.waitForTimeout()`
- No pixel-screenshot diff
- No browser-specific branching

What it IS doing:
- Calls harness primitives (`dispatchDrag`, `setClock`, `tick`, `getState`)
- Asserts on state shape, not pixels
- Uses element IDs (test IDs), not text
- Runs identically on Chromium / Firefox / WebKit

This is the artifact every customer gets — readable, maintainable, ownable.

---

## 21. Document control

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-05-25 | Ryan Medlin + Claude | Initial draft from source vision document |

**Next review:** after first 3 design-partner conversations; expected end of Q1.

**Approval needed from:**
- Ryan (founder) — overall strategy and pricing
- Andrew Davis (SpeechLab CTO) — architecture and OSS/SaaS boundary
- First design partner — pricing, packaging, and connector priority

**Distribution:** SpeechLab leadership, founding engineering team, prospective design partners under NDA.
