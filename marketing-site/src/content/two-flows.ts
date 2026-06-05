// Two flows the loop supports. Both end with the same artifact:
// a GREEN .spec.ts file committed to the customer's repo as a permanent
// regression gate. The difference is the state of the code at capture time.

export interface Flow {
  id: 'baseline' | 'bug-repro';
  badge: string;
  badgeVariant: 'success' | 'error';
  title: string;
  oneLiner: string;
  startsWith: string;
  steps: Array<{ label: string; detail: string }>;
  outcome: string;
  detection: string;
}

export const FLOWS: Flow[] = [
  {
    id: 'baseline',
    badge: 'Flow B · proactive',
    badgeVariant: 'success',
    title: 'Lock in a known-good interaction',
    oneLiner:
      'Code works. Record the interaction. Lock the behavior in before someone refactors it into a bug.',
    startsWith:
      'Your code is on a known-good build. The waveform drag works. The undo stack works. You want to keep it that way forever — without hand-writing the Playwright test that proves it.',
    steps: [
      {
        label: '01 — Record the working interaction',
        detail:
          'Click the recorder extension. Reproduce the interaction the way a real user would. Stop.',
      },
      {
        label: '02 — Generate the spec',
        detail:
          '@cuit/spec-gen turns the captured events into a deterministic Playwright/Vitest spec grounded in @cuit/harness primitives — no pixel coords.',
      },
      {
        label: '03 — Run the spec',
        detail:
          'Expect GREEN. The interaction works on current code — the spec confirms it. This is the baseline.',
      },
      {
        label: '04 — Commit the spec as the baseline',
        detail:
          'PR adds the spec to tests/regressions/. Any future PR that breaks the interaction now fails CI before merge.',
      },
    ],
    outcome:
      'A GREEN spec.ts committed to your repo. Future regressions caught automatically — no human had to hand-write a Playwright test.',
    detection:
      'When the spec passes on the first run, the agent recognizes Flow B and commits + opens a PR adding regression coverage — no fix needed.',
  },
  {
    id: 'bug-repro',
    badge: 'Flow A · reactive',
    badgeVariant: 'error',
    title: 'Reproduce a known bug, fix it, lock in the regression',
    oneLiner:
      'Bug is on prod. Reproduce it deterministically. Watch RED. Fix the code. Watch GREEN. Lock it in.',
    startsWith:
      'A user files a bug. The bug is real in the current code. You want to reproduce it deterministically, fix the smallest possible thing, and make sure it never reopens.',
    steps: [
      {
        label: '01 — Record the bug',
        detail:
          'Click the recorder extension. Reproduce the bug exactly as the user did. Stop. The recording captures the broken final state via window.__cuitDebug.',
      },
      {
        label: '02 — Generate the spec',
        detail:
          'Same step as Flow B. @cuit/spec-gen produces the spec. The assertion targets the state where the bug should NOT have happened.',
      },
      {
        label: '03 — Run the spec — expect RED',
        detail:
          'RED is the success state. The bug is now caught by a deterministic, semantically-grounded automated test. The failure shows expected vs actual, pointing the agent at the diagnosis.',
      },
      {
        label: '04 — Agent proposes the smallest fix',
        detail:
          'Claude Code / Codex reads the RED output, identifies the root cause (e.g. over-eager collision check, missing setClock advance), applies the minimum change.',
      },
      {
        label: '05 — Re-run the spec — expect GREEN',
        detail:
          'Same spec. Fixed code. PASS. The fix is verified by exactly the test that proved the bug existed. No new manual test was written.',
      },
      {
        label: '06 — Commit fix + spec, open PR',
        detail:
          'PR contains both the code fix and the spec. Reviewer sees the spec went RED before the fix and GREEN after. The spec becomes the permanent regression gate.',
      },
    ],
    outcome:
      'Bug fixed. Regression test that proves the fix locked in. The same bug cannot reopen without CI catching it.',
    detection:
      'When the spec fails on the first run, the agent recognizes Flow A and walks the diagnose → fix → re-run loop until GREEN.',
  },
];
