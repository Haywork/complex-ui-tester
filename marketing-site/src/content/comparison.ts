// Honest comparison to existing approaches. Every "wins" / "loses" column
// is grounded — not a strawman.

export interface ComparisonRow {
  approach: string;
  oneLine: string;
  works: string[];
  problems: string[];
  vsCuit: string;
}

/** Status values for the agentic-native feature matrix. */
export type AgenticStatus = "yes" | "no" | "partial";

export interface AgenticFeatureRow {
  /** Short label for the feature being compared. */
  feature: string;
  /** One-line explanation shown below the label. */
  detail: string;
  /** Status per tool — keys must match AgenticMatrixColumn.key. */
  values: Record<string, AgenticStatus>;
}

export interface AgenticMatrixColumn {
  /** Stable identifier used as key in AgenticFeatureRow.values. */
  key: string;
  /** Display name shown in the column header. */
  label: string;
  /** Whether this is the "us" column — gets accent treatment. */
  isCuit?: boolean;
}

export const AGENTIC_COLUMNS: AgenticMatrixColumn[] = [
  { key: "cuit",             label: "CUIT",              isCuit: true },
  { key: "mabl",             label: "Mabl" },
  { key: "octomind",         label: "Octomind" },
  { key: "playwright_diy",   label: "Playwright (DIY)" },
  { key: "claude_in_chrome", label: "claude-in-chrome" },
];

export const AGENTIC_FEATURE_ROWS: AgenticFeatureRow[] = [
  {
    feature: "Agentic-tool-native (Claude Code, Cursor, MCP)",
    detail:
      "Ships an MCP server + skills so Claude Code can generate and run specs without leaving the conversation — no curl, no REST.",
    values: {
      cuit:             "yes",
      mabl:             "no",
      octomind:         "no",
      playwright_diy:   "no",
      claude_in_chrome: "partial",
    },
  },
];

export const COMPARISON: ComparisonRow[] = [
  {
    approach: 'Playwright tests written by hand',
    oneLine:
      'The standard. A human reads the bug, writes the spec, lands the PR.',
    works: [
      'Battle-tested, predictable execution model',
      'Source-controllable, diff-reviewable',
      'Free, open source',
    ],
    problems: [
      'Pixel coordinates flake when CSS changes — 5–15% CI flake on complex UIs',
      '2–6 hours of engineering time per spec, most teams skip writing them',
      'No path from a recorded user session to a working spec',
      'Manual selector authoring drifts when components rename',
    ],
    vsCuit:
      'We emit Playwright/Vitest specs automatically from real sessions, grounded in semantic targets (data-segment-id, data-testid) and harness primitives — no pixel coordinates, no manual authoring.',
  },
  {
    approach: 'Claude Code / Codex writes the Playwright test for you',
    oneLine:
      'Tell the agent: "write a Playwright test for this bug." It writes one.',
    works: [
      'Faster than hand-writing',
      'Source-controllable output',
      'AI fluency with Playwright API is solid',
    ],
    problems: [
      'The agent has no recording — it guesses selectors and clientX/Y',
      'Same pixel-flake problem as hand-written tests',
      'No deterministic state-snapshot — agent infers expected state from DOM, often wrong',
      'No feedback loop — agent writes the test, can\'t verify it caught the actual bug',
    ],
    vsCuit:
      'We give the agent a deterministic input (recorded SessionEvent[]) and a deterministic execution model (harness primitives) — so the spec it generates actually catches the bug and stays stable across CSS changes.',
  },
  {
    approach: 'Agent driving a real browser (claude-in-chrome MCP, etc.)',
    oneLine:
      'The agent itself opens Chrome, clicks around, reads the page.',
    works: [
      'No human in the loop for exploration',
      'Can interact with arbitrary pages',
      'Useful for one-off "is this UI broken?" questions',
    ],
    problems: [
      'Non-deterministic — same prompt produces different action sequences',
      'No artifact left behind — nothing gates CI on future PRs',
      'Token-expensive — every interaction is an LLM call',
      'Slow — wall-clock minutes per interaction sequence',
      'Can\'t reliably reproduce a complex multi-step user bug',
    ],
    vsCuit:
      'Our loop is deterministic. The output is a .spec.ts file that runs in your existing CI without an LLM in the hot path. The agent runs once at generation time; from then on, the regression test is free.',
  },
  {
    approach: 'Session replay vendors (Jam, LogRocket, Sentry Replay, FullStory)',
    oneLine:
      'Customer files a bug; vendor sends you a video and a DOM event timeline.',
    works: [
      'Captures the full user session out of the box',
      'Mature integrations, account-driven',
      'Useful for triage and root-cause analysis',
    ],
    problems: [
      'No regression test output — the replay is a watching artifact, not a CI gate',
      'Vendor lock-in and per-seat / per-session pricing',
      'No semantic selectors — replays use pixel coords or best-effort CSS',
      'No state-snapshot — vendors don\'t know about window.__cuitDebug',
      'Manual translation needed: engineer watches the replay, writes the spec by hand',
    ],
    vsCuit:
      'We adapt their replays (see docs/10) and ship a first-party Chrome extension that captures semantic + state data they structurally cannot. Then we generate the spec — no human translation.',
  },
  {
    approach: 'Screenshot diff testing (Percy, Chromatic, Argos)',
    oneLine:
      'Take a screenshot, diff pixels, fail if anything changes.',
    works: [
      'Catches visual regressions humans would miss',
      'Mature CI integrations',
      'Component-library workflows are well-supported',
    ],
    problems: [
      'Pixel-noisy — anti-aliasing, font hinting, browser version differences create false positives',
      'Says nothing about behavior — segments could overlap visually but state could be correct, or vice versa',
      'Doesn\'t capture interactions — only the final rendered state',
      'High-maintenance: every intentional design change needs baseline re-approval',
    ],
    vsCuit:
      'We test behavior, not pixels. Our specs assert against the host app\'s state model — segments[0].x === 100 — not against rendered pixels. Pixel-diff tools and our tool are complementary, not competing.',
  },
];
