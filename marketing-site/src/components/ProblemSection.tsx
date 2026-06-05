const BEFORE_ITEMS = [
  {
    icon: "↻",
    title: "Reopen-after-fix loop",
    detail:
      "6/14 bugs reopened in 60 days (43%). No regression net specific to your visual bug class.",
    cost: "0.5–2 eng-days per reopen",
  },
  {
    icon: "⚠",
    title: "boundingBox() flakes",
    detail:
      "Pixel coordinates depend on viewport, CSS, browser engine. Tests fight rAF non-determinism with sleeps.",
    cost: "5–15% CI flake rate",
  },
  {
    icon: "⏱",
    title: "Session → spec translation",
    detail:
      "Engineer eyeballs the replay, hand-writes a test. Most teams skip it entirely.",
    cost: "2–6 hours per bug",
  },
  {
    icon: "⬛",
    title: "Canvas / animation blindness",
    detail:
      "Pixel screenshot diff hides sub-pixel and opacity glitches. Bugs reach prod.",
    cost: "Surface via support tickets",
  },
];

const AFTER_ITEMS = [
  {
    icon: "✓",
    title: "Spec is a CI gate forever",
    detail:
      "Generated spec runs on every PR. Reintroduce the bug six months later — CI catches it before merge.",
    value: "0% reopen on locked specs",
  },
  {
    icon: "✓",
    title: "Harness primitives, not pixels",
    detail:
      "dispatchDrag, setClock, getStateSnapshot — no coordinates, no sleeps, no layout dependency.",
    value: "0% flake on 9 new specs",
  },
  {
    icon: "✓",
    title: "Session → spec in minutes",
    detail:
      "Jam session URL lands in Slack. 8 minutes later, a PR is open with a grounded Playwright spec.",
    value: "<8 min median",
  },
  {
    icon: "✓",
    title: "Three-browser verification",
    detail:
      "All generated specs are dry-run on Chromium, Firefox, and WebKit before the PR opens.",
    value: "3 browsers, 1 command",
  },
];

export function ProblemSection() {
  return (
    <section
      className="py-20 md:py-28"
      aria-labelledby="problem-heading"
      id="problem"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            The problem
          </p>
          <h2
            id="problem-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            Teams shipping complex UIs are on a treadmill.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Waveform editors, video tools, design tools, dashboard with
            reorderable rows. The existing tooling stack — Playwright, Cypress,
            screenshot diff, session replay — produces flaky tests, misses
            canvas regressions, and offers no automated path from a recorded
            user session to a deterministic regression test.
          </p>
        </div>

        {/* Two-pane comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before */}
          <div className="rounded-[var(--radius-lg)] border border-red-900/40 bg-red-950/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-900/30 bg-red-950/20">
              <h3 className="font-mono text-sm text-red-400 font-medium tracking-wide">
                BEFORE CUIT
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                What teams do today — 6 Reopened bugs in 60 days
              </p>
            </div>
            <div className="p-6 space-y-5">
              {BEFORE_ITEMS.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span
                    className="mt-0.5 text-red-500/70 text-base leading-none shrink-0 w-5"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                      {item.title}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.detail}
                    </p>
                    <p className="mt-1 font-mono text-xs text-red-400">
                      {item.cost}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="rounded-[var(--radius-lg)] border border-green-900/40 bg-green-950/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-green-900/30 bg-green-950/20">
              <h3 className="font-mono text-sm text-green-400 font-medium tracking-wide">
                WITH CUIT
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Branch B: 8 bugs locked in, 0% flake, 3 browsers verified
              </p>
            </div>
            <div className="p-6 space-y-5">
              {AFTER_ITEMS.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span
                    className="mt-0.5 text-green-500 text-base leading-none shrink-0 w-5"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                      {item.title}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.detail}
                    </p>
                    <p className="mt-1 font-mono text-xs text-green-400">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
