// All content here is verbatim from the working proof-of-concept at
// /proof-of-concept in this repository. Update via:
//   pnpm proof:loop && copy the artifacts here.

export const GENERATED_SPEC_TS = `import { describe, expect, test } from 'vitest';
import {
  dispatchDrag,
  getStateSnapshot,
  setClock,
} from '@cuit/harness';

describe('issue-2014 — segment 0 drag must not collide-noop', () => {
  test('drags segment 0 right by 100px and asserts state moves', () => {
    setClock(1716800000000);

    dispatchDrag('seg-0', 100, 0);

    const snapshot = getStateSnapshot();
    expect(snapshot['segments[0].x']).toEqual(100);
  });
});
`;

export const FIXTURE_EXCERPT_JSON = `{
  "sessionId": "jam-sess-2014",
  "vendor": "jam",
  "url": "http://localhost:5173/",
  "browser": { "name": "chrome", "version": "125.0.0.0", "os": "macOS 14.4" },
  "events": [
    { "seq": 0, "type": "nav", "url": "http://localhost:5173/", "ts": 0 },
    { "seq": 1, "type": "state-snapshot", "path": "segments[0].x", "value": 0 },
    { "seq": 2, "type": "state-snapshot", "path": "segments[1].x", "value": 200 },
    { "seq": 3, "type": "state-snapshot", "path": "segments.length", "value": 2 },
    /* …42 more events: pointerdown / pointermove×N / pointerup / final state-snapshot… */
    { "seq": 45, "type": "pointer", "phase": "up",   "targetName": "seg-0", "x": 240, "y": 32, "pointerId": 1 },
    { "seq": 46, "type": "state-snapshot", "path": "segments[0].x", "value": 0 }
  ]
}`;

export const BUG_CODE = `// packages/demo-app/src/App.tsx — bug version

// Inside the pointermove handler:
setSegments((prev) => {
  const next = prev.map((s) => ({ ...s }));
  const moving = next[idx];
  const proposedX = drag.originX + dx;

  // BUG: the collision check is too eager — it blocks
  // every move that would even momentarily overlap.
  const collides = next.some((other, j) => {
    if (j === idx) return false;
    return proposedX < other.x + other.width &&
           other.x < proposedX + moving.width;
  });
  if (collides) return prev;          // <-- silently no-op'd

  moving.x = proposedX;
  return next;
});`;

export const FIX_CODE = `// packages/demo-app/src/App.tsx — fix version

// Inside the pointermove handler:
setSegments((prev) => {
  const next = prev.map((s) => ({ ...s }));
  const moving = next[idx];
  const proposedX = drag.originX + dx;

  // FIX: drop the over-eager collision short-circuit.
  // Free positioning; downstream layout handles overlap.

  moving.x = proposedX;
  return next;
});`;

export const PROOF_LOG = `[1/6] Loading recorded session events from fixtures/segment-collision.json
       -> 47 events normalized into SessionEvent[]
[2/6] Generating spec from session events
       -> wrote out/issue-2014-segment-0-drag-must-not-collide-noop.spec.ts (18 lines, 6 primitives used)
[3/6] Running spec against demo-app (bug-present mode)
       -> FAIL - segment 0 right edge stayed at x=25 (expected 100)
       -> RED - bug reproduced deterministically [SUCCESS]
[4/6] Applying canonical fix (FIX_SEGMENT_COLLISION=1)
       -> re-rendering demo-app with fix flag
[5/6] Running spec against demo-app (fixed mode)
       -> PASS - segment 0 right edge moved to x=100
       -> GREEN - fix verified, regression locked in [SUCCESS]
[6/6] Locking the spec into CI as a gate
       -> wrote .github/workflows/proof-regression.yml

LOOP COMPLETE - RED to GREEN in 0.1s`;

export const TRY_IT_SHELL = `# 1. Clone the repo
git clone git@github.com:speechlabinc/complex-ui-tester.git
cd complex-ui-tester/proof-of-concept

# 2. Install (Node 20 + pnpm)
pnpm install

# 3. Run the loop end-to-end
pnpm proof:loop

# 4. Run the package tests (61 tests across 5 packages)
pnpm test`;

export type DevProblem = {
  id: string;
  symptom: string;
  why: string;
  bad: string;
  good: string;
};

export const DEV_PROBLEMS: DevProblem[] = [
  {
    id: 'pixel-coords',
    symptom: 'Your Playwright tests use page.mouse.click(412, 89)',
    why: 'Pixel coordinates depend on viewport, CSS, browser engine, and last-frame layout. Change padding by 4px and your suite flakes.',
    bad: `await page.mouse.move(412, 89);
await page.mouse.down();
await page.mouse.move(512, 89, { steps: 10 });
await page.mouse.up();`,
    good: `dispatchDrag('seg-0', 100, 0);
// Targets by stable name. No pixels.
// Same call works in Chromium, Firefox, WebKit.`,
  },
  {
    id: 'wait-for-timeout',
    symptom: "You sprinkle waitForTimeout(500) because rAF timing is unreliable",
    why: 'Real animations advance on requestAnimationFrame; pixel snapshots and CSS transitions land at the next frame. Sleeps fight non-determinism with prayer.',
    bad: `await page.waitForTimeout(500);
const box = await el.boundingBox();
// hope the animation finished by now`,
    good: `setClock(1716800000000);
// Deterministic clock. Every rAF callback fires.
// Now state is exactly where the spec says it is.`,
  },
  {
    id: 'session-to-spec',
    symptom: 'You hand-translate a Jam replay into a Playwright spec',
    why: '2–6 hours per bug. Most teams skip it. You end up with no regression net, and the same bug reopens in 3 weeks.',
    bad: `// 12-minute Jam replay
// → engineer watches it twice
// → engineer guesses selectors
// → engineer writes 80-line spec
// → engineer realizes selectors broke last week`,
    good: `pnpm cuit gen jam:sess-2014 --apply
# Reads the session, emits a spec.ts
# grounded in your harness primitives.
# PR opens. You review the diff.`,
  },
  {
    id: 'reopen-loop',
    symptom: 'The same bug keeps reopening every release',
    why: 'You shipped a fix but no regression test. Six weeks later someone refactors the collision code and re-introduces the same bug.',
    bad: `// One-shot fix. No spec.
// Six weeks later: "user reports drag broken"
// File reopened. Eng-days re-spent.`,
    good: `# Generated spec lives in tests/regressions/
# CI runs it on every PR.
# Re-introduce the bug → CI blocks merge.
# The 6-Reopened-bugs loop is over.`,
  },
];

export const PROOF_STATS = {
  fixtureEvents: 47,
  generatedSpecLines: 18,
  primitivesUsed: 6,
  packageTests: 73,
  loopDurationS: 0.1,
  agentLoopDurationS: 0.18,
  bugBeforeX: 0,
  bugAfterX: 25,
  fixedAfterX: 100,
};

export const AGENT_LOOP_LOG = `[step 1/5] Capture — recorder runs while a developer reproduces the bug
              -> recorder captured 27 events (6 pointer, 20 snapshot)
              -> wrote out/recorded-session.json
[step 2/5] Generate — spec-gen produces a deterministic Playwright/Vitest spec
              -> 6 primitives: goto -> setClock -> getStateSnapshot -> dispatchDrag -> getStateSnapshot -> assertStateEquals
              -> wrote out/agent-loop.spec.ts (18 lines)
[step 3/5] Verify - run the spec against the buggy app
              -> segments[0].x: expected=100, actual=25
              -> RED [bug reproduced - this is the success state]
[step 4/5] Decide - agent reads RED output, identifies the fix
              [agent] observation: segments[0].x stayed at 25 (expected 100)
              [agent] hypothesis : the collision short-circuit in onPointerMove blocked the move
              [agent] action     : enable FIX_SEGMENT_COLLISION=1 (in the SaaS this is a code-change PR; in the PoC it is a flag)
[step 5/5] Verify GREEN - re-run the same spec against the fixed app
              -> segments[0].x: expected=100, actual=100
              -> GREEN [fix verified - regression locked in]

AGENT LOOP CLOSED - capture -> generate -> RED -> agent-fix -> GREEN in 0.18s`;

export const RECORDER_TS_SNIPPET = `// Browser side — install once. Drop the Chrome extension OR import
// @cuit/recorder directly. Same module, same JSON shape, same downstream.

import { Recorder, cuitDebugProvider } from '@cuit/recorder';

const recorder = new Recorder({
  sessionId: 'rec-001',
  vendor: 'cuit',
  snapshotProvider: cuitDebugProvider,  // reads window.__cuitDebug.getState()
});

recorder.start();
// ... developer reproduces the bug (drag a segment, click a row, etc.) ...
recorder.stop();

const session = recorder.export();
// session is plain JSON. No vendor account. No API key.
// Pass it to Claude Code / Codex with the @cuit/spec-gen import:
//   "Use @cuit/spec-gen to convert this into a Playwright spec, run it,
//    confirm RED on the unfixed code, propose the fix."`;

export const AGENT_PROMPT_SNIPPET = `# Copy this into Claude Code / Codex / Cursor:

I just captured a session reproducing a UI bug. The JSON is attached.

1. Run \`@cuit/spec-gen\` on the events to produce a Playwright/Vitest spec.
2. Run the spec against the current code. I expect it to fail RED — that
   means the bug is reproduced.
3. Read the failure (expected vs actual). Identify the smallest code change
   that flips the assertion to pass.
4. Apply the fix. Re-run the spec. Confirm GREEN.
5. Open a PR. The same spec becomes the regression gate.

# Why this works: the recorder gave you a deterministic input.
# The harness gives you a deterministic execution model.
# You now have a closed loop — observe, propose, verify — without
# any pixel coordinates, screenshots, or waitForTimeout sleeps.`;

export const RECORDER_LAUNCH_COMMANDS = `# Try the recorder against the bundled demo
pnpm install
pnpm proof:agent-loop        # recorder -> spec-gen -> RED -> fix -> GREEN

# Or load the Chrome extension on any page that exposes window.__cuitDebug:
#   chrome://extensions  ->  Developer mode  ->  Load unpacked
#   select: proof-of-concept/packages/recorder-extension/`;
