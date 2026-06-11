import { Badge } from "@/components/ui/Badge";
import {
  AGENTIC_COLUMNS,
  AGENTIC_FEATURE_ROWS,
  AgenticStatus,
  COMPARISON,
} from "@/content/comparison";

/** Maps AgenticStatus to a display cell. */
function AgenticCell({ status }: { status: AgenticStatus }) {
  if (status === "yes") {
    return (
      <span className="flex items-center justify-center gap-1.5 text-green-400 font-medium text-sm">
        <span aria-hidden="true">✓</span>
        <span>Yes</span>
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="flex items-center justify-center gap-1.5 text-amber-400 font-medium text-sm">
        <span aria-hidden="true">~</span>
        <span>Partial</span>
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center gap-1.5 text-red-400 font-medium text-sm">
      <span aria-hidden="true">✗</span>
      <span>No</span>
    </span>
  );
}

export function Comparison() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="comparison-heading"
      id="comparison"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            Claude Code-native · MCP server + skills · zero curl required
          </p>
          <h2
            id="comparison-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            The only testing tool
            <br />
            built for Claude Code &amp; Codex.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Every other approach hands you a REST endpoint and says good luck.
            CUIT ships an MCP server and two Claude Code skills — the feedback
            loop lives inside your coding session, not a separate dashboard.
            And when the model changes, the loop stays: the substrate is
            deterministic specs, not LLM calls in CI.
          </p>
        </div>

        {/* ── Agentic-native feature matrix ────────────────────────────── */}
        <div
          className="mb-12 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--bg-secondary)] overflow-hidden"
          role="region"
          aria-label="Agentic-tool-native feature comparison"
        >
          <div className="px-5 py-4 border-b border-[var(--color-accent)]/20 bg-orange-950/20">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)] flex items-center gap-2">
              <span aria-hidden="true">◆</span>
              Key differentiator
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Agentic-native support by tool">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  {/* Feature label column */}
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] w-1/3"
                  >
                    Feature
                  </th>
                  {AGENTIC_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={[
                        "px-4 py-3 text-center text-xs font-semibold whitespace-nowrap",
                        col.isCuit
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--text-secondary)]",
                      ].join(" ")}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENTIC_FEATURE_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-[var(--border-color)] last:border-0"
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium text-[var(--text-primary)] text-sm leading-snug">
                        {row.feature}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                        {row.detail}
                      </p>
                    </td>
                    {AGENTIC_COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={[
                          "px-4 py-4 text-center align-middle",
                          col.isCuit ? "bg-orange-950/10" : "",
                        ].join(" ")}
                      >
                        <AgenticCell status={row.values[col.key] as AgenticStatus} />
                        {col.key === "claude_in_chrome" && row.values[col.key] === "partial" && (
                          <p className="mt-1 text-[10px] text-[var(--text-tertiary)] leading-tight">
                            Chrome plugin only
                          </p>
                        )}
                        {col.key === "playwright_diy" && row.values[col.key] === "no" && (
                          <p className="mt-1 text-[10px] text-[var(--text-tertiary)] leading-tight">
                            unless you build it
                          </p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* ── End agentic-native matrix ─────────────────────────────────── */}

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
                  <Badge variant="accent">CUIT</Badge>
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
