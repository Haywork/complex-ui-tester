import Link from 'next/link';
import { CodeBlock } from '@/components/ui/Code';
import { Badge } from '@/components/ui/Badge';
import {
  AGENT_LOOP_LOG,
  AGENT_PROMPT_SNIPPET,
  PROOF_STATS,
  RECORDER_LAUNCH_COMMANDS,
  RECORDER_TS_SNIPPET,
} from '@/content/proof';

const STAGES = [
  {
    label: 'Observe',
    detail:
      'Recorder Chrome extension captures pointer events, semantic selectors, and window.__cuitDebug state snapshots into one JSON blob.',
  },
  {
    label: 'Propose',
    detail:
      '@cuit/spec-gen turns the session into a Playwright/Vitest spec grounded in @cuit/harness primitives — no pixel coords, no waitForTimeout.',
  },
  {
    label: 'Verify',
    detail:
      'Run the spec against the unfixed code → RED (bug deterministically reproduced). Apply the fix → GREEN. The agent sees both signals.',
  },
  {
    label: 'Gate',
    detail:
      'The generated spec becomes a permanent CI regression gate. Re-introduce the bug six months later → CI blocks the merge.',
  },
];

export function AgenticLoop() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)] relative overflow-hidden"
      aria-labelledby="agentic-loop-heading"
      id="agentic-loop"
    >
      <div
        className="absolute inset-x-0 top-0 h-72 opacity-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 0%, var(--color-accent) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            For Claude Code · Codex · Cursor · any agentic coding model
          </p>
          <h2
            id="agentic-loop-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            Agentic coding can write UIs.
            <br />
            It can&apos;t <em>verify</em> them.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Today the loop ends at &quot;here&apos;s the diff&quot;. There&apos;s
            no deterministic feedback signal — no way for the model to
            <em> see </em>that the UI it wrote actually behaves correctly
            when a user drags a segment, scrubs a playhead, reorders a row.
            CUIT closes that loop. Observe, propose, verify,
            gate. End-to-end, in {PROOF_STATS.agentLoopDurationS}s.
          </p>
        </div>

        {/* Four-stage strip */}
        <ol
          className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[var(--border-color)] rounded-[var(--radius-lg)] overflow-hidden mb-12 border border-[var(--border-color)]"
          aria-label="Closed-loop stages"
        >
          {STAGES.map((s, i) => (
            <li
              key={s.label}
              className="bg-[var(--bg-secondary)] p-5 flex flex-col"
            >
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="font-mono text-xs font-bold text-[var(--color-accent)]"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-base font-semibold text-[var(--text-primary)]">
                  {s.label}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {s.detail}
              </p>
            </li>
          ))}
        </ol>

        {/* The actual closed-loop output */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                The closed loop, end-to-end
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                stdout of{' '}
                <code className="font-mono text-[var(--color-accent)]">
                  pnpm proof:agent-loop
                </code>{' '}
                — copied verbatim from{' '}
                <code className="font-mono">agent-loop-output.log</code>. Real
                recorder. Real spec-gen. Real RED → fix → GREEN.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">closed</Badge>
              <Badge variant="mono">{PROOF_STATS.agentLoopDurationS}s end-to-end</Badge>
            </div>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-primary)]">
            <code>{AGENT_LOOP_LOG}</code>
          </pre>
        </div>

        {/* The two interfaces — recorder + agent prompt */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">browser side</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">
                first-party — no vendor account
              </span>
            </div>
            <CodeBlock
              code={RECORDER_TS_SNIPPET}
              filename="recorder.ts"
              language="typescript"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">agent side</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">
                paste into Claude Code · Codex · Cursor
              </span>
            </div>
            <CodeBlock
              code={AGENT_PROMPT_SNIPPET}
              filename="agent-prompt.md"
              language="markdown"
            />
          </div>
        </div>

        {/* Run it */}
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04] p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-10 items-start">
            <div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 leading-tight">
                Two ways to close the loop today.
              </h3>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">→</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">Run the demo agent loop locally.</strong>{' '}
                    Clone the repo, install, run{' '}
                    <code className="font-mono text-[var(--color-accent)]">
                      pnpm proof:agent-loop
                    </code>
                    . The same six lines of stdout above will print on your
                    machine in under a second.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">→</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">Load the Chrome extension.</strong>{' '}
                    Drop{' '}
                    <code className="font-mono text-[var(--color-accent)]">
                      packages/recorder-extension/
                    </code>{' '}
                    into <code className="font-mono">chrome://extensions</code>{' '}
                    → load unpacked. Record any page that exposes{' '}
                    <code className="font-mono">window.__cuitDebug</code>.
                    Paste the resulting JSON straight into your coding agent.
                  </span>
                </li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/proof"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  Full proof artifacts →
                </Link>
                <span className="text-[var(--text-tertiary)]">·</span>
                <Link
                  href="https://github.com/speechlabinc/complex-ui-tester/tree/main/proof-of-concept/packages/recorder-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  Extension source on GitHub ↗
                </Link>
              </div>
            </div>
            <div>
              <CodeBlock
                code={RECORDER_LAUNCH_COMMANDS}
                filename="run it"
                language="bash"
              />
              <p className="mt-3 text-xs text-[var(--text-tertiary)] font-mono">
                expected: AGENT LOOP CLOSED in {PROOF_STATS.agentLoopDurationS}s · exit 0
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
