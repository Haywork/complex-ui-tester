import { CodeBlock } from "@/components/ui/Code";
import { Badge } from "@/components/ui/Badge";
import { FLOWS } from "@/content/two-flows";

const FLOW_DETECT_SNIPPET = `# .claude/skills/cuit-loop/SKILL.md auto-detects the flow:

read session
generateSpec(events) -> spec.ts
run spec against the current code

  if PASS  ->  Flow B (baseline lock-in)
                commit spec, open PR. The interaction is now gated.

  if FAIL  ->  Flow A (bug reproduction)
                read expected vs actual,
                identify smallest code change,
                apply fix, re-run, expect GREEN,
                commit fix + spec, open PR.

# One skill. One CLI. Two flows. Both end in a GREEN .spec.ts.`;

export function TwoFlows() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="two-flows-heading"
      id="two-flows"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            Two flows — same recorder, same loop, same final artifact
          </p>
          <h2
            id="two-flows-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            Lock in what works.
            <br />
            Or reproduce what doesn&apos;t.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The recorder doesn&apos;t care whether the code is broken when you
            press Start. Capture a working interaction → the agent recognizes
            a baseline and gates it. Capture a buggy interaction → the agent
            recognizes a regression and walks RED → fix → GREEN. The skill
            detects which flow you&apos;re in on the first run of the
            generated spec.
          </p>
        </div>

        {/* The two flow cards side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {FLOWS.map((flow) => {
            const accent =
              flow.id === "baseline"
                ? "border-green-900/40 bg-green-950/[0.06]"
                : "border-red-900/40 bg-red-950/[0.06]";
            const accentText =
              flow.id === "baseline" ? "text-green-400" : "text-red-400";
            return (
              <article
                key={flow.id}
                className={`rounded-[var(--radius-lg)] border ${accent} p-6 md:p-7 flex flex-col`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={flow.badgeVariant}>{flow.badge}</Badge>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2 leading-snug">
                  {flow.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-5 italic leading-relaxed">
                  {flow.oneLiner}
                </p>

                <div className="mb-5">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                    You start with
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {flow.startsWith}
                  </p>
                </div>

                <ol className="space-y-3 mb-5 border-t border-[var(--border-color)] pt-5">
                  {flow.steps.map((s) => (
                    <li key={s.label} className="flex flex-col gap-1">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest ${accentText}`}
                      >
                        {s.label}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {s.detail}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-auto pt-5 border-t border-[var(--border-color)]">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                    You end with
                  </h4>
                  <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                    {flow.outcome}
                  </p>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)] leading-relaxed">
                    <strong className={accentText}>How the agent detects this:</strong>{" "}
                    {flow.detection}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* The actual decision logic */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              How the skill decides which flow you&apos;re in
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Verbatim logic from{" "}
              <code className="font-mono text-[var(--color-accent)]">
                .claude/skills/cuit-loop/SKILL.md
              </code>{" "}
              — the agent reads this exact decision tree.
            </p>
          </div>
          <div className="p-5 bg-[var(--bg-primary)]">
            <CodeBlock
              code={FLOW_DETECT_SNIPPET}
              filename="SKILL.md — flow detection"
              language="bash"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
