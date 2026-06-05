export function SceneWaveform() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-xs text-[var(--text-tertiary)] ml-1">
          waveform-editor — your app
        </span>
      </div>
      <div className="p-6">
        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-2 flex justify-between">
          <span>00:00</span>
          <span>00:15</span>
          <span>00:30</span>
          <span>00:45</span>
          <span>01:00</span>
        </div>
        <div className="relative h-28 rounded-[var(--radius-md)] bg-black/30 border border-[var(--border-color)] overflow-hidden">
          <div className="absolute inset-y-2 left-[4%] right-[68%] rounded-[var(--radius-sm)] bg-gradient-to-b from-[var(--color-accent)]/80 to-[var(--color-accent-dim)]/80 border border-[var(--color-accent)]/40 flex items-center justify-center text-[10px] font-mono text-white/90">
            seg-0
          </div>
          <div className="absolute inset-y-2 left-[34%] right-[36%] rounded-[var(--radius-sm)] bg-gradient-to-b from-purple-500/80 to-purple-700/80 border border-purple-400/40 flex items-center justify-center text-[10px] font-mono text-white/90">
            seg-1
          </div>
          <div className="absolute inset-y-2 left-[66%] right-[6%] rounded-[var(--radius-sm)] bg-gradient-to-b from-cyan-500/80 to-cyan-700/80 border border-cyan-400/40 flex items-center justify-center text-[10px] font-mono text-white/90">
            seg-2
          </div>
          <div
            className="absolute inset-y-2 left-[14%] w-[26%] rounded-[var(--radius-sm)] border-2 border-dashed border-red-500/70 bg-red-500/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-[10px] font-mono text-red-400">
              attempted drag → no-op
            </span>
          </div>
          <div className="absolute right-2 top-2 font-mono text-[10px] text-red-400 bg-red-950/60 border border-red-900/50 rounded px-1.5 py-0.5">
            collision
          </div>
        </div>
        <p className="mt-4 text-xs text-[var(--text-tertiary)] leading-relaxed">
          Segment 0&apos;s right edge collides with segment 1&apos;s left edge.
          The drag silently no-ops. No error in the console.
        </p>
      </div>
    </div>
  );
}
