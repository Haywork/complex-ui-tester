import Link from 'next/link';
import { CodeBlock } from '@/components/ui/Code';
import { Badge } from '@/components/ui/Badge';
import {
  BUG_CODE,
  DEV_PROBLEMS,
  FIX_CODE,
  FIXTURE_EXCERPT_JSON,
  GENERATED_SPEC_TS,
  PROOF_LOG,
  PROOF_STATS,
  TRY_IT_SHELL,
} from '@/content/proof';

export function ForDevelopers() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="for-developers-heading"
      id="for-developers"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            For UI developers — show me the code
          </p>
          <h2
            id="for-developers-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            Four things that flake on your team today.
            <br />
            How this fixes each one.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Every snippet below is verbatim from the working{' '}
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/tree/main/proof-of-concept"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--color-accent)] hover:underline"
            >
              proof-of-concept
            </Link>{' '}
            — not a mockup. Clone the repo and run{' '}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              pnpm proof:loop
            </code>{' '}
            to reproduce the output yourself.
          </p>
        </div>

        {/* Four problems, side-by-side bad-vs-good */}
        <div className="space-y-12 mb-20">
          {DEV_PROBLEMS.map((p, i) => (
            <div
              key={p.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
            >
              {/* Title + explanation (sticky on desktop) */}
              <div className="lg:col-span-4">
                <div className="flex items-baseline gap-3 mb-3">
                  <span
                    className="font-mono text-3xl font-bold text-[var(--color-mute-3)] leading-none"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    problem
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-3 leading-snug">
                  {p.symptom}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {p.why}
                </p>
              </div>

              {/* Bad code */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="error">today</Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    flaky / manual / brittle
                  </span>
                </div>
                <CodeBlock
                  code={p.bad}
                  filename="before.ts"
                  language="typescript"
                />
              </div>

              {/* Good code */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">with CUIT</Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    deterministic / generated / permanent
                  </span>
                </div>
                <CodeBlock
                  code={p.good}
                  filename="after.ts"
                  language="typescript"
                />
              </div>
            </div>
          ))}
        </div>

        {/* The closed loop — real artifacts */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                The proof loop, end-to-end
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Real artifacts from{' '}
                <code className="font-mono">proof-of-concept/</code> — copied
                verbatim. Run <code className="font-mono">pnpm proof:loop</code>{' '}
                to regenerate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">61 tests passing</Badge>
              <Badge variant="mono">{PROOF_STATS.loopDurationS}s end-to-end</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--border-color)]">
            {/* Step 1 — fixture */}
            <div className="bg-[var(--bg-secondary)] p-5">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                  STEP 1
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Input: recorded Jam session
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                A user files a bug via Jam. The connector pulls{' '}
                {PROOF_STATS.fixtureEvents} normalized events.
              </p>
              <CodeBlock
                code={FIXTURE_EXCERPT_JSON}
                filename="fixtures/segment-collision.json"
                language="json"
              />
            </div>

            {/* Step 2 — generated spec */}
            <div className="bg-[var(--bg-secondary)] p-5">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                  STEP 2
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Output: generated Playwright/Vitest spec
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                {PROOF_STATS.generatedSpecLines} lines.{' '}
                {PROOF_STATS.primitivesUsed} harness primitives. No pixel coords,
                no waitForTimeout, no hand-crafted selectors.
              </p>
              <CodeBlock
                code={GENERATED_SPEC_TS}
                filename="out/issue-2014.spec.ts"
                language="typescript"
              />
            </div>

            {/* Step 3 — bug code */}
            <div className="bg-[var(--bg-secondary)] p-5">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-xs font-bold text-red-400">
                  STEP 3 — RED
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Run the spec against the buggy code
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                The spec reproduces the failure deterministically. RED is the
                success state — the bug is now caught by an automated test.
              </p>
              <CodeBlock
                code={BUG_CODE}
                filename="App.tsx (buggy)"
                language="typescript"
              />
            </div>

            {/* Step 4 — fix code */}
            <div className="bg-[var(--bg-secondary)] p-5">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-xs font-bold text-green-400">
                  STEP 4 — GREEN
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Apply the fix, re-run the same spec
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                Same spec, same harness, fixed code. PASS. The spec is now a
                permanent CI gate.
              </p>
              <CodeBlock
                code={FIX_CODE}
                filename="App.tsx (fixed)"
                language="typescript"
              />
            </div>
          </div>

          {/* Real proof log */}
          <div className="border-t border-[var(--border-color)] p-5 bg-[var(--bg-primary)]">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                Actual stdout of{' '}
                <code className="text-[var(--color-accent)]">pnpm proof:loop</code>
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                — copied verbatim from{' '}
                <code className="font-mono">proof-output.log</code>
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-[var(--radius-md)] border border-[var(--border-color)]">
              <code>{PROOF_LOG}</code>
            </pre>
          </div>
        </div>

        {/* Try it yourself */}
        <div className="mt-12 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04] p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-10 items-start">
            <div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 leading-tight">
                Try it. Don&apos;t take our word.
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Four shell commands. Node 20. About thirty seconds of install.
                The same six lines of stdout you see above will print on your
                machine — RED at step 3, GREEN at step 5, exit 0.
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">→</span>
                  <span>
                    Read the source — every primitive in the spec is a real
                    exported function from{' '}
                    <code className="font-mono text-[var(--color-accent)]">
                      @cuit/harness
                    </code>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">→</span>
                  <span>
                    Inspect the tests — 61 unit tests across 5 packages,
                    TDD-first, all green.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">→</span>
                  <span>
                    Wire it into your repo — the same primitives work in any
                    React/Vue app that exposes a state-snapshot hook.
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <CodeBlock
                code={TRY_IT_SHELL}
                filename="run on your machine"
                language="bash"
              />
              <p className="mt-3 text-xs text-[var(--text-tertiary)] font-mono">
                expected output: RED to GREEN in {PROOF_STATS.loopDurationS}s · exit 0
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
