export function SceneJamCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Jam · Bug created
            </span>
            <span className="font-mono text-[10px] text-[var(--color-accent)]">
              JAM-2014
            </span>
          </div>
          <h4 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Drag on waveform segment doesn&apos;t move
          </h4>
          <p className="text-xs text-[var(--text-tertiary)]">
            Reported by sam@acme.io · 12 sec ago
          </p>
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="font-mono text-[10px] px-2 py-1 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)]"
        >
          Share link
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        {[
          ["Session length", "4m 12s"],
          ["Browser", "Chrome 128"],
          ["OS", "macOS 15.1"],
          ["Viewport", "1440 × 900"],
          ["Console events", "14"],
          ["Network events", "38"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-2 py-1.5 px-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
          >
            <span className="text-[var(--text-tertiary)]">{k}</span>
            <span className="font-mono text-[var(--text-primary)]">{v}</span>
          </div>
        ))}
      </div>
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3 leading-relaxed">
        <div className="flex items-center gap-1.5">
          <span className="text-green-400">●</span>
          <span>Webhook delivered → complex-ui-tester</span>
          <span className="ml-auto">204 OK · 142ms</span>
        </div>
      </div>
    </div>
  );
}
