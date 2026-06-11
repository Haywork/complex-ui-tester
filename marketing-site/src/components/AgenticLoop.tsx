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

/**
 * Each stage of the observe→propose→verify→gate loop, annotated with the
 * MCP tool or Claude Code skill that closes that edge.
 */
const STAGES = [
  {
    label: 'Observe',
    edge: 'cuit__get_session',
    edgeKind: 'MCP tool' as const,
    detail:
      'Whatever feedback source you already use — your recorder, Jam, LogRocket, Sentry Replay, RUM — normalizes into one SessionEvent[] representation: pointer events, semantic selectors, console/errors, window.__cuitDebug snapshots. No curl. Claude Code calls the tool directly.',
  },
  {
    label: 'Propose',
    edge: '/cuit-loop',
    edgeKind: 'Claude Code skill' as const,
    detail:
      'Typing /cuit-loop in Claude Code invokes @cuit/spec-gen to turn the session into a Playwright/Vitest spec grounded in @cuit/harness primitives — no pixel coords, no waitForTimeout.',
  },
  {
    label: 'Verify',
    edge: '/cuit-loop',
    edgeKind: 'Claude Code skill' as const,
    detail:
      'The same /cuit-loop skill runs the spec against the unfixed code → RED (bug deterministically reproduced), then against the fix → GREEN. Claude Code sees both signals without leaving the conversation.',
  },
  {
    label: 'Gate',
    edge: 'mcp__gitnexus__detect_changes',
    edgeKind: 'MCP tool' as const,
    detail:
      'The generated spec is committed as a permanent CI regression gate. The GitNexus MCP tool tracks the change graph so future model calls know which specs are load-bearing before they touch related code.',
  },
];

/** Concrete walkthrough: one engineer, one slash command, the full cycle. */
const CUIT_LOOP_EXAMPLE = `# Claude Code conversation — no curl, no POST /v1/sessions

> /cuit-loop

  [cuit-loop] Reading session via cuit__get_session (source: any adapter)...
  [cuit-loop] 27 events normalized (6 pointer, 20 state-snapshot)

  [cuit-loop] Generating spec with @cuit/spec-gen...
  [cuit-loop] wrote out/agent-loop.spec.ts (18 lines, 6 primitives)

  [cuit-loop] Running spec — EXPECT RED...
  [cuit-loop]   segments[0].x: expected=100, actual=25 ✗  ← bug reproduced

  [cuit-loop] Hypothesis: collision short-circuit in onPointerMove blocks move
  [cuit-loop] Applying fix...

  [cuit-loop] Re-running spec — EXPECT GREEN...
  [cuit-loop]   segments[0].x: expected=100, actual=100 ✓  ← fix verified

  [cuit-loop] Opening PR with spec as regression gate.

  LOOP CLOSED in ${PROOF_STATS.agentLoopDurationS}s`;

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
        {/* Section header */}
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            Claude Code · MCP · skills — not REST, not curl
          </p>
          <h2
            id="agentic-loop-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            Claude Code closes the loop.
            <br />
            <em>One skill. No endpoints.</em>
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Every edge of the observe&nbsp;&rarr;&nbsp;propose&nbsp;&rarr;&nbsp;verify&nbsp;&rarr;&nbsp;gate
            cycle is closed by an MCP tool or a Claude Code skill — not a REST
            call. An engineer types{' '}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              /cuit-loop
            </code>{' '}
            and the full cycle runs inside the conversation in{' '}
            {PROOF_STATS.agentLoopDurationS}s.
          </p>
        </div>

        {/* Four-stage strip — each edge annotated with its MCP tool or skill */}
        <ol
          className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[var(--border-color)] rounded-[var(--radius-lg)] overflow-hidden mb-6 border border-[var(--border-color)]"
          aria-label="Closed-loop stages with MCP/skill annotations"
        >
          {STAGES.map((s, i) => (
            <li
              key={s.label}
              className="bg-[var(--bg-secondary)] p-5 flex flex-col"
            >
              <div className="flex items-baseline gap-2 mb-2">
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
              {/* Edge annotation */}
              <div className="mb-3">
                <Badge variant={s.edgeKind === 'MCP tool' ? 'mono' : 'accent'}>
                  {s.edgeKind === 'MCP tool' ? 'MCP' : 'skill'}&nbsp;·&nbsp;
                  <span className="font-mono">{s.edge}</span>
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {s.detail}
              </p>
            </li>
          ))}
        </ol>

        {/* Verifier's Law / model-churn callout */}
        <aside
          className="mb-12 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.04] px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4"
          aria-label="Verifier's Law — the loop is model-invariant"
        >
          <span
            className="shrink-0 font-mono text-2xl text-[var(--color-accent)] leading-none"
            aria-hidden="true"
          >
            &#x221e;
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              The loop is what survives model churn.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Models improve, deprecate, and get replaced. The feedback loop —
              observe, propose, verify, gate — is the durable substrate.{' '}
              <Link
                href="https://en.wikipedia.org/wiki/Verifier%27s_law"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Verifier&apos;s Law (wiki/19)&nbsp;&#x2197;
              </Link>{' '}
              and Lance Martin&apos;s work on agentic evals both converge on the
              same insight: a model that can&apos;t verify its own output is not
              yet reliable, but a{' '}
              <em>loop</em> with a deterministic verifier is model-invariant.
              Swap GPT-4 for Sonnet for Gemini — the spec still turns RED on
              the bug and GREEN on the fix.
            </p>
          </div>
        </aside>

        {/* Concrete example: /cuit-loop in Claude Code */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="accent">Claude Code</Badge>
            <span className="text-xs text-[var(--text-tertiary)]">
              one skill invocation — the full cycle, no REST endpoints
            </span>
          </div>
          <CodeBlock
            code={CUIT_LOOP_EXAMPLE}
            filename="/cuit-loop — Claude Code conversation"
            language="bash"
          />
          <p className="mt-3 text-xs text-[var(--text-tertiary)] font-mono">
            observe → propose → verify → gate · {PROOF_STATS.agentLoopDurationS}s end-to-end
          </p>
        </div>

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
                recorder. Real spec-gen. Real RED&nbsp;&rarr;&nbsp;fix&nbsp;&rarr;&nbsp;GREEN.
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
              <Badge variant="accent">Claude Code side</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">
                paste into Claude Code — or just type /cuit-loop
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
                  <span className="text-[var(--color-accent)] mt-0.5">&rarr;</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      Type{' '}
                      <code className="font-mono text-[var(--color-accent)]">
                        /cuit-loop
                      </code>{' '}
                      in Claude Code.
                    </strong>{' '}
                    The skill wires whatever feedback source you have, spec-gen,
                    and the harness into one conversation turn. Observe&nbsp;&rarr;&nbsp;propose&nbsp;&rarr;&nbsp;verify&nbsp;&rarr;&nbsp;gate
                    without leaving your editor.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">&rarr;</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      Run the demo loop locally.
                    </strong>{' '}
                    Clone the repo, install, run{' '}
                    <code className="font-mono text-[var(--color-accent)]">
                      pnpm proof:agent-loop
                    </code>
                    . The same stdout above prints on your machine in under a
                    second — no API key, no account.
                  </span>
                </li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/proof"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  Full proof artifacts &rarr;
                </Link>
                <span className="text-[var(--text-tertiary)]">·</span>
                <Link
                  href="https://github.com/speechlabinc/complex-ui-tester/tree/main/proof-of-concept/packages/recorder-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  Extension source on GitHub &#x2197;
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
