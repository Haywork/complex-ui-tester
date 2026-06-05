---
name: cuit-loop
description: Close the UI feedback loop for an agentic coding model. Given a recorded session JSON (from the @cuit/recorder-extension Chrome extension, the @cuit/recorder npm module, or a third-party adapter), generate a Playwright/Vitest spec via @cuit/spec-gen, run it against the app, AUTO-DETECT which flow (baseline lock-in vs bug reproduction) the developer is in based on whether the spec passes on first run, then commit a GREEN regression gate. Use this whenever the user attaches a cuit-session JSON file or pastes session events.
trigger: cuit session JSON · cuit-recorder · @cuit/recorder-extension · .cuit-session · SessionEvent[] · "close the loop" · "fix this UI bug" with attached session · "lock this in" with attached session · "add regression coverage" with attached session
---

# cuit-loop — agentic UI feedback loop

This skill turns a captured user session into a permanent CI regression
gate. There are TWO flows the recorder supports, and the skill auto-detects
which one the developer is in based on the result of the first spec run.

```
                        session.json
                            │
                            ▼
                       @cuit/spec-gen
                            │
                            ▼
                  run spec against current code
                            │
              ┌─────────────┴─────────────┐
              │                           │
            PASS                        FAIL
              │                           │
              ▼                           ▼
       ┌──────────────┐         ┌──────────────┐
       │   FLOW B     │         │   FLOW A     │
       │   baseline   │         │  bug repro   │
       │   lock-in    │         │              │
       └──────┬───────┘         └──────┬───────┘
              │                        │
              │                        ▼
              │              read expected vs actual
              │              propose smallest code fix
              │              apply fix, re-run spec
              │                        │
              │              ┌─────────┴─────────┐
              │            PASS                FAIL
              │              │                   │
              │              ▼                   ▼
              │        GREEN — go to commit   ITERATE up
              │              │                to 3 times
              │              │                then escalate
              ▼              ▼
              └──────► commit spec to tests/regressions/
                      open PR
                      done
```

Both flows produce the same final artifact: a GREEN `.spec.ts` file
committed to the customer's repo, gating future PRs.

## When to invoke this skill

- The user attaches or pastes a JSON file with `vendor: "cuit"` and an
  `events` array of `SessionEvent` objects.
- The user mentions "the recorder", "@cuit/recorder", or
  "cuit-recorder-extension".
- The user says "close the loop" / "fix this bug" / "lock this in" /
  "add regression coverage" with a session attached.

Do NOT invoke this skill for:

- Generic Playwright test writing without a captured session.
- Backend bugs.
- Bugs the user describes in prose only — ask them to record a session
  with the extension first.

## Pre-flight check

1. Confirm the session JSON has `vendor`, `events`, `sessionId`, `url`.
   If shape mismatches, stop and tell the user the expected schema is in
   `docs/11-recorder-extension.md §4`.
2. Confirm the repository has `@cuit/harness`, `@cuit/spec-gen` installed
   (or is the `complex-ui-tester` PoC where they're workspace packages).
3. If running against the PoC, confirm `pnpm proof:agent-loop` works
   first as a smoke test.

## Steps — Shared (both flows)

### 1. Read the session

```bash
node -e "const s = require('./session.json'); console.log(JSON.stringify({
  sessionId: s.sessionId,
  vendor: s.vendor,
  eventCount: s.events.length,
  pointerCount: s.events.filter(e => e.type === 'pointer').length,
  snapshotCount: s.events.filter(e => e.type === 'state-snapshot').length,
}, null, 2));"
```

Confirm the counts look reasonable (≥ 1 pointerdown, ≥ 2 state-snapshots
spanning a state change).

### 2. Generate the spec

```ts
import { generateSpec, serializeSpec } from '@cuit/spec-gen';
import { readFileSync, writeFileSync } from 'node:fs';

const session = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const spec = generateSpec(session.events);
const code = serializeSpec(spec);
writeFileSync('out/generated.spec.ts', code, 'utf-8');
```

Inspect the generated spec. It should call only `@cuit/harness`
primitives (`setClock`, `dispatchDrag`, `getStateSnapshot`,
`assertStateEquals`-style assertions). If it contains `page.mouse.click`,
something has gone wrong upstream.

### 3. Run the spec — the decision point

Run the spec against the **current** code:

```bash
pnpm exec vitest run out/generated.spec.ts
# or in the PoC:
pnpm proof:agent-loop
```

**This is where the skill branches.** Two outcomes, two flows:

| Result | Flow | Meaning |
|---|---|---|
| **PASS** (GREEN) | Flow B — baseline lock-in | The interaction works as captured. Treat the spec as a baseline and gate it. Skip to step 7. |
| **FAIL** (RED) | Flow A — bug reproduction | The bug is reproduced. The captured session represents a regression. Continue to step 4 and walk the fix loop. |

Tell the user which flow you detected and why. Example:

> Detected **Flow A** (bug reproduction): spec failed on first run with
> `segments[0].x === 25, expected 100`. Walking the fix loop.

or:

> Detected **Flow B** (baseline lock-in): spec passed on first run. The
> captured interaction works on current code. Committing as a regression
> gate.

## Steps — Flow A only (bug reproduction)

### 4. Diagnose

Read the failure carefully. The format is:

```
expected segments[0].x === 100
actual   segments[0].x === 25
```

The path on the left is what the spec asserts. The value on the right
tells you where the buggy code stops short. Use this to identify the
single smallest change in the source that would flip the assertion.

Common patterns observed in the SpeechLab Branch B fixtures:

| RED symptom | Likely root cause |
|---|---|
| Drag stops short of expected x | Over-eager collision check in onPointerMove |
| Drag overshoots | Missing snap-to-grid in onPointerMove |
| State doesn't update at all | Pointer events not reaching React handlers (look for stopPropagation upstream) |
| Animation never settles | Missing setClock advance in rAF-driven code |
| Drag works once then no-ops | Stale `dragRef` from a previous mount |

### 5. Apply the minimal fix

Edit the source. Run typecheck. Run the targeted unit tests for the
file you changed. Do not introduce new abstractions or refactor
unrelated code.

### 6. Re-run the spec — confirm GREEN

```bash
pnpm exec vitest run out/generated.spec.ts
```

Expected: PASS. If it's still RED, your diagnosis was wrong — re-read the
failure output, propose a different fix.

**Iteration cap: 3.** Do not loop more than three diagnose/fix/re-run
cycles. After three failures, escalate to the user with what you tried
and what you're stuck on.

## Steps — Shared again (both flows)

### 7. Commit and open a PR

Pick one of two commit messages depending on the detected flow:

**Flow A (bug reproduction):**

```bash
git checkout -b fix/<short-description>
git add <source-file> out/generated.spec.ts
git commit -m "fix: <description>

Closes <issue> · regression locked in via @cuit/spec-gen.
Session: <sessionId>
Flow: A (bug reproduction)
RED before fix, GREEN after."
gh pr create --title "fix: <short>" --body "..."
```

**Flow B (baseline lock-in):**

```bash
git checkout -b regression/<short-description>
git add out/generated.spec.ts
git commit -m "regression: lock in <interaction>

GREEN on current code. Generated from cuit recorder session <sessionId>.
Future code that breaks this interaction now fails CI before merge.
Flow: B (baseline lock-in)"
gh pr create --title "regression: lock in <interaction>" --body "..."
```

The PR body should include the verbatim RED → GREEN output (Flow A) or
the GREEN-on-first-run output (Flow B) as proof.

## Output format

When you finish, summarize using one of these two templates:

**Flow A complete:**

```
cuit-loop complete — Flow A (bug reproduction)

  session     <sessionId> (<N> events)
  spec        out/generated.spec.ts (<N> primitives)
  red-actual  <path> = <value> (expected <expected>)
  fix         <one-line description>
              <files-touched>
  green       ✓ same spec passes after fix
  pr          <url>
```

**Flow B complete:**

```
cuit-loop complete — Flow B (baseline lock-in)

  session     <sessionId> (<N> events)
  spec        out/generated.spec.ts (<N> primitives)
  green       ✓ spec passes on current code — interaction works as captured
  baseline    locked in as regression gate
  pr          <url>
```

## Failure modes

| Failure | What to do |
|---|---|
| `generateSpec` throws | The session is malformed. Show the user the expected schema in `docs/11-recorder-extension.md §4` and stop. |
| Spec is GREEN on the first run AND the user said "fix this bug" | The captured session may not include the failure state — ask the user to re-record while reproducing the bug. The fact that GREEN was returned is real signal: either the bug isn't present, or the recording stopped before it manifested. |
| Spec is RED on the first run AND the user said "lock this in" | Either the code has an unfixed bug the user didn't know about, or the recording captured a transient bad state. Show the diagnosis, ask whether to (a) walk Flow A and fix the underlying bug, or (b) re-record. |
| Fix changes the spec to PASS but breaks other tests (Flow A) | The fix introduced a regression elsewhere. Revert and propose a more targeted change. |
| Spec is still RED after three iterations (Flow A) | Escalate to the user. Show what you tried, the diagnostic output of each attempt, and where you got stuck. |
| `pnpm proof:agent-loop` exits non-zero | The PoC environment is broken. Run `pnpm install && pnpm test` to verify the workspace before continuing. |

## Reference materials in this repo

- `docs/11-recorder-extension.md` — the recorder design (both flows
  covered in §7)
- `docs/04-ai-spec-generation.md` — the spec generation architecture
- `proof-of-concept/packages/runner/src/cli-agent-loop.ts` — the
  reference implementation of Flow A end-to-end (RED → fix → GREEN)
- `proof-of-concept/agent-loop-output.log` — the verbatim Flow A log
  we'd expect to see

## What this skill does NOT do

- It does NOT modify the recorder. If the recorder is missing data, the
  fix is to capture again — never to lower the assertion.
- It does NOT add new harness primitives. If the generated spec needs a
  primitive that doesn't exist, escalate to the user.
- It does NOT bypass human review. Always commit the spec (and the fix,
  if Flow A) and open a PR — never merge directly.
- It does NOT loop more than three times on Flow A diagnose/fix/re-run.
  Escalation after three failures is mandatory.
