const PASSES = [
  {
    n: "01",
    name: "Normalize",
    model: "Haiku 4.5",
    cost: "$0.001",
    tokensIn: "1,840",
    tokensOut: "320",
    desc: "rrweb / Jam events → SessionEvent[]",
    color: "from-cyan-500 to-cyan-700",
  },
  {
    n: "02",
    name: "Ground",
    model: "Sonnet 4.6",
    cost: "$0.024",
    tokensIn: "4,210",
    tokensOut: "880",
    desc: "Retrieve selectors + bug-class corpus",
    color: "from-purple-500 to-purple-700",
  },
  {
    n: "03",
    name: "Materialize",
    model: "Opus 4.7",
    cost: "$0.062",
    tokensIn: "6,400",
    tokensOut: "1,420",
    desc: "Emit harness-grounded spec.ts",
    color: "from-[var(--color-accent)] to-[var(--color-accent-dim)]",
  },
];

export function ScenePipeline() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          3-pass LLM pipeline
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded bg-green-950/60 border border-green-900/50 text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          cache hit: 78%
        </span>
      </div>
      <div className="space-y-3">
        {PASSES.map((p, i) => (
          <div
            key={p.n}
            className="relative grid grid-cols-[auto,1fr,auto] gap-3 items-center"
          >
            <div
              className={`w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br ${p.color} flex items-center justify-center font-mono text-xs text-white/95 font-semibold`}
              aria-hidden="true"
            >
              {p.n}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {p.name}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  {p.model}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate">{p.desc}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-[var(--text-primary)]">{p.cost}</div>
              <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
                {p.tokensIn} in · {p.tokensOut} out
              </div>
            </div>
            {i < PASSES.length - 1 && (
              <div
                className="absolute left-5 top-10 w-px h-3 bg-[var(--border-color)]"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex justify-between items-baseline">
        <span className="text-xs text-[var(--text-secondary)]">
          Total per spec
        </span>
        <span className="font-mono text-base font-semibold text-[var(--text-primary)]">
          $0.087
          <span className="ml-2 font-mono text-[10px] text-[var(--text-tertiary)]">
            target &lt; $0.50
          </span>
        </span>
      </div>
    </div>
  );
}
