export function ScenePrCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="text-green-400">
          <path d="M5 3.254V3.25v.005a.75.75 0 110-.005v.004zm.45 1.9a2.25 2.25 0 10-1.95.218v5.256a2.25 2.25 0 101.5 0V7.123A5.735 5.735 0 009.25 9h1.378a2.251 2.251 0 100-1.5H9.25a4.25 4.25 0 01-3.8-2.346zM12.75 9a.75.75 0 100-1.5.75.75 0 000 1.5zm-8.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        </svg>
        <span className="font-mono text-[10px] text-[var(--text-secondary)]">
          speechlabinc/translate-ui-react · #2014
        </span>
        <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-green-950/60 border border-green-900/50 text-green-400">
          Open
        </span>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Add regression spec for issue #2014 — segment drag collision
        </h4>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          opened by <span className="font-mono text-[var(--color-accent)]">@cuit-bot</span> · 14 minutes ago · 2 reviewers
        </p>

        <div className="space-y-2 mb-4 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] w-20">source</span>
            <span className="font-mono text-[var(--color-accent)]">jam.dev/c/JAM-2014</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] w-20">confidence</span>
            <span className="font-mono">0.91</span>
            <span className="text-[var(--text-tertiary)]">/ threshold 0.75</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] w-20">primitives</span>
            <span className="font-mono">dispatchDrag, getStateSnapshot, setClock, getSegment</span>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
          {[
            ["cuit/spec-grounded", "AST validated — only harness primitives used", "pass"],
            ["cuit/dry-run", "RED on pre-fix · GREEN after fix commit", "pass"],
            ["cuit/confidence", "0.91 ≥ 0.75 threshold", "pass"],
            ["ci/playwright (chromium, firefox, webkit)", "3 browsers — 1.8s", "pass"],
          ].map(([name, detail, status]) => (
            <div key={name} className="flex items-center gap-3 px-3 py-2 text-xs">
              <span className={status === "pass" ? "text-green-400" : "text-red-400"}>
                {status === "pass" ? "✓" : "✗"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[var(--text-primary)] truncate">{name}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] truncate">{detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-[var(--text-tertiary)]">
          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            +1 fix commit
          </span>
          <span className="px-1.5 py-0.5 rounded bg-green-950/60 border border-green-900/50 text-green-400">
            ready to merge
          </span>
        </div>
      </div>
    </div>
  );
}
