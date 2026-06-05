// Real artifacts from the shipping recorder. Update via:
//   1. Build the zip:     pnpm -F @cuit/recorder-extension build && cd packages/recorder-extension && zip -r ../../../../marketing-site/public/downloads/cuit-recorder-alpha.zip *
//   2. Refresh fixtures:  copy from .claude/skills/cuit-loop/example-session.json
//   3. Bump the version below.

export const RECORDER_ALPHA = {
  version: '0.1.0-alpha.1',
  zipPath: '/downloads/cuit-recorder-alpha.zip',
  installTxtPath: '/downloads/INSTALL.txt',
  sizeKB: 10,
  manifestVersion: 3,
  sourceUrl:
    'https://github.com/speechlabinc/complex-ui-tester/tree/main/proof-of-concept/packages/recorder-extension',
};

export const EXAMPLE_CAPTURE = `{
  "sessionId": "demo-collision-001",
  "vendor": "cuit",
  "createdAt": 1748952000123,
  "url": "http://localhost:5173/",
  "events": [
    { "seq": 0, "type": "nav",   "url": "http://localhost:5173/" },
    { "seq": 1, "type": "state-snapshot", "path": "segments[0].x",  "value": 0 },
    { "seq": 5, "type": "state-snapshot", "path": "segments[1].x",  "value": 120 },
    { "seq": 7, "type": "pointer", "phase": "down",
      "targetName": "seg-0", "x": 40,  "y": 32, "pointerId": 1 },
    { "seq": 8,  "type": "pointer", "phase": "move",
      "targetName": "seg-0", "x": 65,  "y": 32, "pointerId": 1 },
    { "seq": 9,  "type": "pointer", "phase": "move",
      "targetName": "seg-0", "x": 90,  "y": 32, "pointerId": 1 },
    { "seq": 10, "type": "pointer", "phase": "move",
      "targetName": "seg-0", "x": 115, "y": 32, "pointerId": 1 },
    { "seq": 11, "type": "pointer", "phase": "move",
      "targetName": "seg-0", "x": 140, "y": 32, "pointerId": 1 },
    { "seq": 12, "type": "pointer", "phase": "up",
      "targetName": "seg-0", "x": 140, "y": 32, "pointerId": 1 },
    { "seq": 13, "type": "state-snapshot", "path": "segments[0].x",  "value": 25 }
  ]
}`;

export const AGENT_INVOCATION = `# Claude Code · Codex · Cursor · Aider
# Drop the session JSON in your repo, then run:

/cuit-loop ./cuit-session-demo-collision-001.json

# The agent reads .claude/skills/cuit-loop/SKILL.md and walks the loop:
#   1. validate the session shape
#   2. generateSpec(events) -> spec.ts grounded in @cuit/harness
#   3. run the spec -> RED expected (bug reproduced)
#   4. diagnose: actual segments[0].x = 25, expected 100
#   5. propose minimum fix to onPointerMove collision check
#   6. re-run -> GREEN
#   7. open PR with the spec + the fix
#
# Total: ~30 seconds of agent time for a fix that took your engineer
# 2-6 hours by hand.`;

export const AGENT_OUTPUT = `cuit-loop complete

  session     demo-collision-001 (14 events)
  spec        out/generated.spec.ts (6 primitives)
  red-actual  segments[0].x = 25 (expected 100)
  fix         remove over-eager collision check in onPointerMove
              (App.tsx, 4 lines deleted)
  green       ✓ same spec passes after fix
  pr          https://github.com/your-org/your-app/pull/4218`;

export const INSTALL_STEPS = [
  {
    n: 1,
    title: 'Download',
    body: 'Click the download button below to get cuit-recorder-alpha.zip (about 10 KB).',
  },
  {
    n: 2,
    title: 'Unzip',
    body: 'Unzip anywhere. You’ll see a folder with manifest.json, content.js, popup.html, and four icon PNGs.',
  },
  {
    n: 3,
    title: 'Load unpacked in Chrome',
    body: 'Open chrome://extensions, toggle Developer mode (top-right), click Load unpacked, and select the unzipped folder. Pin the extension from the puzzle-piece menu.',
  },
  {
    n: 4,
    title: 'Wire window.__cuitDebug in your app',
    body: 'In a useEffect, set window.__cuitDebug = { getState: () => yourReduxOrZustandOrWhatever }. The recorder reads from this hook to capture state snapshots.',
  },
  {
    n: 5,
    title: 'Record. Stop. Copy. Drop into Claude Code.',
    body: 'Click the pin, hit Start, reproduce the bug, hit Stop, click Copy JSON. Paste into your agent and invoke /cuit-loop. The skill walks the closed loop from observe to GREEN.',
  },
];
