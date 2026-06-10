import Link from "next/link";
import { CodeBlock } from "@/components/ui/Code";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AGENT_INVOCATION,
  AGENT_OUTPUT,
  EXAMPLE_CAPTURE,
  INSTALL_STEPS,
  RECORDER_ALPHA,
} from "@/content/recorder-alpha";

export function RecorderAlpha() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)] relative overflow-hidden"
      aria-labelledby="recorder-alpha-heading"
      id="recorder-alpha"
    >
      <div
        className="absolute inset-x-0 top-0 h-40 opacity-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, var(--color-accent) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            Alpha — Chrome extension shipping today
          </p>
          <h2
            id="recorder-alpha-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            Download the recorder.
            <br />
            Feed your coding agent real data.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            10 KB. Chrome MV3. No account, no signup, no telemetry. Captures
            pointer events with semantic selectors,{" "}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              window.__cuitDebug
            </code>{" "}
            state snapshots, and every{" "}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              console.log
            </code>
            {" "}/{" "}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              warn
            </code>
            {" "}/{" "}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              error
            </code>{" "}
            and uncaught exception that fires during the session — all in one
            JSON blob. Drop the blob into Claude Code and the bundled{" "}
            <code className="font-mono text-[var(--color-accent)]">
              /cuit-loop
            </code>{" "}
            skill closes the loop: spec generated, spec run, console-error
            assertion included.
          </p>
        </div>

        {/* Download row */}
        <div className="mb-12 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.05] p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="accent">
                  alpha · v{RECORDER_ALPHA.version}
                </Badge>
                <Badge variant="mono">MV{RECORDER_ALPHA.manifestVersion}</Badge>
                <Badge variant="mono">{RECORDER_ALPHA.sizeKB} KB</Badge>
                <Badge variant="success">no telemetry · local only</Badge>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">
                cuit-recorder-alpha.zip
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                Unzipped extension ready for{" "}
                <code className="font-mono">chrome://extensions → Load unpacked</code>.
                Source is in the repo — review every line before you install
                if you want.
              </p>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <a href={RECORDER_ALPHA.zipPath} download className="inline-flex">
                <Button variant="primary" size="lg">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 2v9M4 7l4 4 4-4M2 14h12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download the alpha
                </Button>
              </a>
              <div className="flex items-center gap-3 text-xs">
                <a
                  href={RECORDER_ALPHA.installTxtPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                >
                  INSTALL.txt
                </a>
                <span className="text-[var(--text-tertiary)]">·</span>
                <a
                  href={RECORDER_ALPHA.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                >
                  Source on GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Five-step install */}
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-px bg-[var(--border-color)] rounded-[var(--radius-lg)] overflow-hidden mb-14 border border-[var(--border-color)]">
          {INSTALL_STEPS.map((s) => (
            <li key={s.n} className="bg-[var(--bg-secondary)] p-4 flex flex-col">
              <span
                className="font-mono text-xs font-bold text-[var(--color-accent)] mb-2"
                aria-hidden="true"
              >
                STEP {String(s.n).padStart(2, "0")}
              </span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                {s.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        {/* What it captures + how an agent uses it */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent">what gets captured</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">
                real recorder output · ~6 KB for a 13-event session
              </span>
            </div>
            <CodeBlock
              code={EXAMPLE_CAPTURE}
              filename="cuit-session-demo-collision-001.json"
              language="json"
            />
            <p className="mt-3 text-xs text-[var(--text-tertiary)] leading-relaxed">
              Five event types in one blob:{" "}
              <code className="font-mono">nav</code> for the page URL,{" "}
              <code className="font-mono">pointer</code> for interactions
              (semantic <code className="font-mono">targetName</code> resolved
              from <code className="font-mono">data-testid</code> /{" "}
              <code className="font-mono">data-cuit-id</code>),{" "}
              <code className="font-mono">state-snapshot</code> for the
              before/after of{" "}
              <code className="font-mono">__cuitDebug.getState()</code>,{" "}
              <code className="font-mono">console</code> for every{" "}
              <code className="font-mono">log</code> /{" "}
              <code className="font-mono">warn</code> /{" "}
              <code className="font-mono">error</code> with stack trace, and{" "}
              <code className="font-mono">uncaught-error</code> for unhandled
              exceptions. The generated spec asserts{" "}
              <code className="font-mono">expect(consoleLogs.errors).toHaveLength(0)</code>{" "}
              automatically — zero-error CI gate included.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent">how an agent uses it</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">
                the <code className="font-mono">/cuit-loop</code> Claude Code skill
              </span>
            </div>
            <CodeBlock
              code={AGENT_INVOCATION}
              filename="claude-code · codex · cursor"
              language="bash"
            />
            <p className="mt-3 text-xs text-[var(--text-tertiary)] leading-relaxed">
              The skill lives at{" "}
              <Link
                href="https://github.com/speechlabinc/complex-ui-tester/blob/main/.claude/skills/cuit-loop/SKILL.md"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[var(--color-accent)] hover:underline"
              >
                .claude/skills/cuit-loop/SKILL.md
              </Link>
              . Codex and Cursor read the same Markdown via{" "}
              <code className="font-mono">.codexrules</code> /{" "}
              <code className="font-mono">.cursorrules</code>.
            </p>
          </div>
        </div>

        {/* Competitive callout — console capture as differentiator */}
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.04] p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-10">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)] mb-3">
                We capture what Jam captures — and more
              </p>
              <p className="text-[var(--text-primary)] font-semibold text-base md:text-lg leading-snug mb-2">
                Clicks, network, and console errors — but the output is a
                regression spec your CI gates, not a replay you watch.
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Jam, LogRocket, and Sentry Replay capture console output and
                network requests behind their own accounts and pricing tiers.
                CUIT captures the same signal — pointer events, console logs,
                uncaught errors — and feeds it directly into Claude Code via{" "}
                <code className="font-mono text-[var(--color-accent)]">
                  /cuit-loop
                </code>
                . What comes out is not a video you hand to an engineer. It is
                a{" "}
                <code className="font-mono text-[var(--color-accent)]">
                  .spec.ts
                </code>{" "}
                that runs green in CI from that point on. Self-instrument in
                minutes;{" "}
                <code className="font-mono text-[var(--color-accent)]">
                  /cuit-instrument
                </code>{" "}
                handles the wiring.
              </p>
            </div>
            <div className="flex-shrink-0 md:w-64">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <span className="text-green-400 mt-0.5 font-bold" aria-hidden="true">✓</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">console.log / warn / error</strong>
                    {" "}captured with full stack trace
                  </span>
                </li>
                <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <span className="text-green-400 mt-0.5 font-bold" aria-hidden="true">✓</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">Uncaught exceptions</strong>
                    {" "}surfaced in the session blob
                  </span>
                </li>
                <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <span className="text-green-400 mt-0.5 font-bold" aria-hidden="true">✓</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      <code className="font-mono">expect(consoleLogs.errors).toHaveLength(0)</code>
                    </strong>
                    {" "}auto-asserted in every generated spec
                  </span>
                </li>
                <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <span className="text-green-400 mt-0.5 font-bold" aria-hidden="true">✓</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">No account, no SaaS pricing</strong>
                    {" "}— runs local, open source
                  </span>
                </li>
                <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)] mt-0.5" aria-hidden="true">→</span>
                  <span className="italic text-[var(--text-tertiary)]">
                    Jam / LogRocket give you a replay to watch.
                    CUIT gives Claude Code a spec to gate.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* What the agent reports back */}
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">
                What the agent reports back when the loop closes
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Structured output from the <code className="font-mono">/cuit-loop</code>{" "}
                skill — agent-readable, human-readable, PR-pasteable.
              </p>
            </div>
            <Badge variant="success">loop closed</Badge>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-primary)]">
            <code>{AGENT_OUTPUT}</code>
          </pre>
        </div>

        <p className="mt-8 text-sm text-[var(--text-tertiary)] leading-relaxed max-w-3xl">
          <strong className="text-[var(--text-secondary)]">Alpha caveat:</strong>{" "}
          this is the first public release of the recorder. Expect rough
          edges. Chrome Web Store submission and Firefox/Safari ports are on{" "}
          <Link
            href="https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/11-recorder-extension.md#11-roadmap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            the v0.2 roadmap
          </Link>
          . If you find a bug, file it at{" "}
          <Link
            href="https://github.com/speechlabinc/complex-ui-tester/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            github.com/speechlabinc/complex-ui-tester/issues
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
