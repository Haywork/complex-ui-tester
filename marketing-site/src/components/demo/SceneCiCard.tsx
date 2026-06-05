export function SceneCiCard() {
  const bars = [3, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11];

  return (
    <div className="rounded-[var(--radius-lg)] border border-green-900/50 bg-green-950/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-green-900/40 bg-green-950/30 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="text-green-400">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
        <span className="font-mono text-[10px] text-green-400">
          PR #2014 merged · CI gate active
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)]">
          2 min ago
        </span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Spec status
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-green-400">GREEN</span>
              <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                3 browsers
              </span>
            </div>
          </div>
          <div className="rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Total elapsed
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                12<span className="text-base text-[var(--text-tertiary)]">m 04s</span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5">
              filed → merged
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            Regressions caught (last 28 days)
          </span>
          <span className="font-mono text-xs text-green-400">▲ +47%</span>
        </div>
        <div
          className="flex items-end gap-1 h-16"
          aria-label="Sparkline trending up"
        >
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t ${
                i === bars.length - 1
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-accent)]/40"
              }`}
              style={{ height: `${(h / 11) * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--text-tertiary)]">
          <span>4 weeks ago</span>
          <span>today</span>
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-start gap-3">
          <span className="text-green-400 mt-0.5">●</span>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">
              The spec is now a CI gate.
            </strong>{" "}
            If anyone reintroduces this bug six months from now, CI flags it
            before merge. The 6-Reopened-bugs treadmill ends here.
          </p>
        </div>
      </div>
    </div>
  );
}
