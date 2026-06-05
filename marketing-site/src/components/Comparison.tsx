import { Badge } from "@/components/ui/Badge";
import { COMPARISON } from "@/content/comparison";

export function Comparison() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="comparison-heading"
      id="comparison"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            What about Playwright? · claude-in-chrome? · screenshot diff?
          </p>
          <h2
            id="comparison-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            All of these work.
            <br />
            Each one fails differently.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Verifying UI is not a solved problem with zero alternatives — five
            approaches already exist, and they all do something useful. They
            also all have specific failure modes that bite teams shipping
            complex UIs daily. Here&apos;s the honest comparison.
          </p>
        </div>

        <div className="space-y-5">
          {COMPARISON.map((row) => (
            <article
              key={row.approach}
              className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-1">
                  {row.approach}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                  {row.oneLine}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--border-color)]">
                <div className="bg-[var(--bg-secondary)] p-5">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-green-400 mb-3">
                    Where it works
                  </h4>
                  <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                    {row.works.map((w) => (
                      <li key={w} className="flex items-start gap-2 leading-snug">
                        <span className="text-green-400 mt-0.5" aria-hidden="true">
                          ✓
                        </span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[var(--bg-secondary)] p-5">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-3">
                    Where it fails
                  </h4>
                  <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                    {row.problems.map((p) => (
                      <li key={p} className="flex items-start gap-2 leading-snug">
                        <span className="text-red-400 mt-0.5" aria-hidden="true">
                          ✗
                        </span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                <div className="flex items-baseline gap-3">
                  <Badge variant="accent">complex-ui-tester</Badge>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                    {row.vsCuit}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--text-tertiary)] leading-relaxed max-w-3xl">
          <strong className="text-[var(--text-secondary)]">
            Where we stand on this:
          </strong>{" "}
          Pixel-diff and session-replay tools solve adjacent problems and are
          worth keeping. We&apos;re specifically the test-generation +
          deterministic-execution edge that the others structurally cannot
          deliver. If you already use one of the above, you can keep using it
          — we don&apos;t replace your visual-regression pipeline or your
          session-replay vendor. We give you the regression spec they
          can&apos;t.
        </p>
      </div>
    </section>
  );
}
