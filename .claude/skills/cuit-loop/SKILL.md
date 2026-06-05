---
name: cuit-loop
description: Close the UI feedback loop for an agentic coding model. Given a recorded session JSON (from the @cuit/recorder-extension Chrome extension, the @cuit/recorder npm module, or a third-party adapter), generate a Playwright/Vitest spec via @cuit/spec-gen, run it against the app, observe RED (bug reproduced), propose the smallest code fix, re-run, confirm GREEN, and open a PR. Use this whenever the user attaches a cuit-session JSON file or pastes session events and asks for a regression fix.
trigger: cuit session JSON · cuit-recorder · @cuit/recorder-extension · .cuit-session · SessionEvent[] · "close the loop" · "fix this UI bug" with attached session
---

# cuit-loop — agentic UI feedback loop

This skill turns a captured user session into a permanent CI regression
gate. The pipeline is:

```
session.json
   │
   ▼
@cuit/spec-gen ── produces .spec.ts grounded in @cuit/harness primitives
   │
   ▼
run the spec against the unfixed code
   │
   ├── RED  →  expected. The bug is now caught by a deterministic test.
   │           Read the failure. Identify the smallest code change. Apply
   │           the fix. Re-run.
   ▼
run the spec again against the fixed code
   │
   └── GREEN → fix verified. Open a PR. The spec becomes the regression gate.
```

## When to invoke this skill

- The user attaches or pastes a JSON file with `vendor: "cuit"` and an
  `events` array of `SessionEvent` objects.
- The user mentions "the recorder", "@cuit/recorder", or
  "cuit-recorder-extension".
- The user asks you to "close the loop" on a UI bug with a session
  attached.
- The user says "use the harness to verify this fix".

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

## Steps

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

### 3. Run the spec — expect RED

Run the spec against the **current** code. The expected outcome is
RED — the bug should reproduce. If it goes GREEN, either the bug isn't
present in the current code or the spec didn't capture it. Stop and tell
the user.

```bash
# In the complex-ui-tester PoC:
pnpm proof:agent-loop

# In a customer repo:
pnpm exec vitest run out/generated.spec.ts
```

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

### 5. Apply the minimal fix

Edit the source. Run typecheck. Run the targeted unit tests for the
file you changed.

### 6. Re-run the spec — confirm GREEN

```bash
pnpm exec vitest run out/generated.spec.ts
```

Expected: PASS. If it's still RED, the fix didn't take or the bug had
multiple root causes. Iterate.

### 7. Commit and open a PR

```bash
git checkout -b fix/<short-description>
git add <source-file> out/generated.spec.ts
git commit -m "fix: <description>

Closes <issue> · regression locked in via @cuit/spec-gen.
Session: <sessionId>"
gh pr create --title "..." --body "..."
```

The PR body should include the verbatim 6-line RED → GREEN output as
proof.

## Output format

When you finish, summarize like this:

```
cuit-loop complete

  session     <sessionId> (<N> events)
  spec        out/generated.spec.ts (<N> primitives)
  red-actual  <path>=<value>
  fix         <one-line description>
  green       ✓
  pr          <url>
```

## Failure modes

| Failure | What to do |
|---|---|
| `generateSpec` throws | The session is malformed. Show the user the expected schema in `docs/11-recorder-extension.md §4` and stop. |
| Spec is GREEN on the first run | The bug isn't present in the current code — either it was already fixed or the session captures didn't include the failure. Stop and tell the user. |
| Fix changes the spec to PASS but breaks other tests | The fix introduced a regression elsewhere. Revert and propose a more targeted change. |
| Spec is still RED after your fix | Your diagnosis was wrong. Re-read the failure output, propose a different fix. Do not loop more than 3 times — escalate to the user. |
| `pnpm proof:agent-loop` exits non-zero | The PoC environment is broken. Run `pnpm install && pnpm test` to verify the workspace before continuing. |

## Reference materials in this repo

- `docs/11-recorder-extension.md` — the recorder design
- `docs/04-ai-spec-generation.md` — the spec generation architecture
- `proof-of-concept/packages/runner/src/cli-agent-loop.ts` — the
  reference implementation of this exact loop
- `proof-of-concept/agent-loop-output.log` — the verbatim
  RED → GREEN log we'd expect to see

## What this skill does NOT do

- It does NOT modify the recorder. If the recorder is missing data, the
  fix is to capture again.
- It does NOT add new harness primitives. If the generated spec needs a
  primitive that doesn't exist, escalate to the user.
- It does NOT bypass human review. Always commit the spec + fix and open
  a PR — never merge directly.
