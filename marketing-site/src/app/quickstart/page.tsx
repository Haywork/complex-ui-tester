import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Quickstart — Claude Code + MCP UI Testing in 90s",
  description:
    "Add the CUIT MCP server to Claude Code, invoke /cuit-loop or /cuit-instrument, and watch the agent close the UI feedback loop. No curl required.",
  keywords: [
    "claude code ui testing",
    "mcp server ui regression",
    "closed loop verification for agents",
    "agentic ui test generation",
    "Claude Code MCP quickstart",
    "UI feedback loop",
    "CUIT quickstart",
  ],
  openGraph: {
    title: "Quickstart — Claude Code + MCP UI Testing in 90 Seconds | CUIT",
    description:
      "Add the CUIT MCP server to Claude Code, invoke /cuit-loop or /cuit-instrument, and watch the agent close the UI feedback loop. No curl required.",
  },
};

const API_URL = "https://cuit-saas-pilot.fly.dev";
const REPO = "https://github.com/speechlabinc/complex-ui-tester";

function CodeBlock({ children, lang }: { children: React.ReactNode; lang?: string }) {
  return (
    <pre className="text-xs sm:text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md p-4 overflow-x-auto leading-relaxed text-[var(--text-primary)] whitespace-pre">
      {lang && (
        <span className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-widest block mb-2">
          {lang}
        </span>
      )}
      {children}
    </pre>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-l-2 border-[var(--border-color)] pl-6 py-2 mb-10 relative">
      <div className="absolute -left-[14px] top-2 w-6 h-6 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] flex items-center justify-center font-mono text-xs font-bold text-[var(--accent-primary)]">
        {n}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function QuickstartPage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="pt-12 pb-10 md:pt-20 md:pb-14 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Quickstart
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
            Three steps. Ninety seconds.
            <br />
            <span className="text-[var(--text-secondary)]">Inside Claude Code.</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-6">
            CUIT is built for agentic coding tools. The product surface is the{" "}
            <strong className="text-[var(--text-primary)]">MCP server</strong> and a pair of{" "}
            <strong className="text-[var(--text-primary)]">Claude Code skills</strong> —{" "}
            <code className="font-mono text-sm bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">/cuit-instrument</code>{" "}
            wires CUIT into a fresh repo;{" "}
            <code className="font-mono text-sm bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">/cuit-loop</code>{" "}
            closes the regression-spec loop from a recorded session.
          </p>
          <p className="text-base text-[var(--text-tertiary)] max-w-3xl leading-relaxed">
            You will not be writing curl commands. You&apos;ll be talking to
            Claude Code about your bug, and watching it pull session data,
            generate a spec, and run it — using the same tools your engineers
            already use every day.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge>90 seconds</Badge>
            <Badge>Claude Code-native</Badge>
            <Badge>MCP-first</Badge>
            <Badge>No curl</Badge>
          </div>
        </div>
      </section>

      {/* PRE-REQS */}
      <section className="py-10 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            What you need
          </h2>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2 leading-relaxed">
            <li>
              <strong className="text-[var(--text-primary)]">Claude Code installed.</strong>{" "}
              Either the CLI (<code className="font-mono text-xs">claude.ai/code</code>) or the
              VS Code/JetBrains extension. If you don&apos;t have it, install it first — this
              page is written for you to read once you&apos;re inside the editor.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">A tenant token.</strong>{" "}
              Get one in 10 seconds at{" "}
              <Link href="/signup" className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                /signup
              </Link>
              {" "}— no human in the loop. The form returns your bearer token; copy it now.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">A repo to work in.</strong>{" "}
              Doesn&apos;t matter what framework — Next.js, Vite, Remix, Astro,
              whatever. The <code className="font-mono text-xs">/cuit-instrument</code> skill
              detects it and writes the integration for you.
            </li>
          </ul>
        </div>
      </section>

      {/* THE 3 STEPS */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            The 3 steps
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-10 max-w-3xl leading-relaxed">
            Steps 1 and 2 happen once per machine. Step 3 you&apos;ll repeat for
            every app you instrument.
          </p>

          {/* Step 1 — MCP config */}
          <Step n={1} title="Drop the CUIT MCP server into Claude Code">
            <p>
              Edit (or create){" "}
              <code className="font-mono text-xs">~/.claude/mcp_servers.json</code>{" "}
              and add the <code className="font-mono text-xs">cuit</code> entry below. Paste
              your tenant token in the env block.
            </p>
            <CodeBlock lang="json">{`{
  "mcpServers": {
    "cuit": {
      "command": "npx",
      "args": ["-y", "@cuit-saas/mcp"],
      "env": {
        "CUIT_API_URL": "${API_URL}",
        "CUIT_TENANT_TOKEN": "<paste-your-token-here>"
      }
    }
  }
}`}</CodeBlock>
            <p>
              Restart Claude Code. The CUIT MCP server boots in the background
              and exposes 12 tools that Claude can call mid-conversation:
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs font-mono text-[var(--text-tertiary)]">
              <div>cuit__query_sessions</div>
              <div>cuit__find_similar_sessions</div>
              <div>cuit__flake_rate</div>
              <div>cuit__bug_class_distribution</div>
              <div>cuit__detect_app_shape</div>
              <div>cuit__propose_instrumentation</div>
              <div>cuit__generate_spec_from_session</div>
              <div>cuit__run_spec</div>
              <div>cuit__regression_test_for_pr</div>
              <div>cuit__audit_export</div>
              <div>cuit__verify_session_round_trip</div>
              <div>cuit__list_instrumentations</div>
            </div>
            <p className="text-[var(--text-tertiary)] text-xs">
              Verify it loaded: in Claude Code type <code className="font-mono text-xs">/mcp list</code> — you
              should see <code className="font-mono text-xs">cuit</code> with 12 tools.
            </p>
          </Step>

          {/* Step 2 — instrument */}
          <Step n={2} title="Open your app's repo in Claude Code and run /cuit-instrument">
            <p>
              Inside Claude Code, with your app&apos;s repo as the working
              directory, just type:
            </p>
            <CodeBlock lang="claude code">{`/cuit-instrument`}</CodeBlock>
            <p>The skill walks 5 phases. You watch:</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>
                <strong className="text-[var(--text-primary)]">Detect</strong> — calls{" "}
                <code className="font-mono text-xs">cuit__detect_app_shape</code> against your
                repo. Reports framework, state lib, candidate root + state files.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Propose</strong> — calls{" "}
                <code className="font-mono text-xs">cuit__propose_instrumentation</code>.
                Returns a structured diff: which files to create, which to edit, what to add to{" "}
                <code className="font-mono text-xs">package.json</code>.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Apply</strong> — Claude uses its
                Edit/Write tools to write the diff. You see every change before it
                commits. You can reject or refine inline.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Verify</strong> — Claude runs{" "}
                <code className="font-mono text-xs">pnpm install</code> +{" "}
                <code className="font-mono text-xs">pnpm typecheck</code>, then calls{" "}
                <code className="font-mono text-xs">cuit__verify_session_round_trip</code> to
                confirm a session actually reaches the warehouse.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Confirm</strong> — Summary of
                files changed, first generated spec, dashboard URL.
              </li>
            </ol>
            <p className="text-[var(--text-tertiary)] text-xs">
              Wall-clock: 10–15 minutes the first time. On a typical Next.js +
              Zustand app it&apos;s closer to 8.
            </p>
          </Step>

          {/* Step 3 — close the loop */}
          <Step n={3} title="Hit a bug. Type /cuit-loop. Done.">
            <p>
              From here on, this is the daily workflow. When you find a bug:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>
                Open your app in Chrome with{" "}
                <code className="font-mono text-xs">?cuitRecorder=1</code>. Reproduce
                the bug. Stop the recording.
              </li>
              <li>
                Back in Claude Code, attach the session JSON (or just paste it)
                and type:
              </li>
            </ol>
            <CodeBlock lang="claude code">{`/cuit-loop`}</CodeBlock>
            <p>The skill auto-detects which flow you&apos;re in:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-[var(--text-primary)]">Flow A — bug reproduction.</strong>{" "}
                Spec fails on first run (RED). Claude walks the diagnose-fix-rerun
                loop until GREEN.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Flow B — baseline lock-in.</strong>{" "}
                Spec passes on first run (GREEN). Claude commits it as a permanent
                regression gate.
              </li>
            </ul>
            <p>
              You did not write a test. You did not write a curl command. You
              described the bug to Claude, and it generated, ran, and gated the
              regression for you.
            </p>
          </Step>
        </div>
      </section>

      {/* WHAT THIS UNLOCKS */}
      <section className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
            What this unlocks in Claude Code
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-3xl leading-relaxed">
            Once the MCP server is connected, ANY conversation can query the
            warehouse mid-task. Try saying these in your next Claude Code
            session:
          </p>
          <div className="space-y-3">
            <CodeBlock>{`"Find sessions similar to the bug I just fixed in PR #487."`}</CodeBlock>
            <CodeBlock>{`"Show me the bug-class distribution for the last 28 days."`}</CodeBlock>
            <CodeBlock>{`"What's our flake rate trend over the last quarter?"`}</CodeBlock>
            <CodeBlock>{`"For the segment-drag bug, generate a regression spec from the most recent matching session and run it."`}</CodeBlock>
            <CodeBlock>{`"Detect the app shape of ./apps/dashboard and propose how to instrument it."`}</CodeBlock>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-6 leading-relaxed">
            Claude routes each one to the matching MCP tool, makes the API
            call, and reasons about the response. Your engineering team gets
            CUIT&apos;s entire warehouse as ambient context — without leaving
            the editor.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Get your token. Connect the MCP. Type a slash command.
          </h2>
          <p className="text-base text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto leading-relaxed">
            That&apos;s the whole onboarding. The first time anyone on the QA
            team should hit a curl prompt is when they&apos;re building CI
            integrations — not when they&apos;re evaluating the product.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup"
              className="px-5 py-3 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-md font-semibold hover:opacity-90 transition"
            >
              Sign up → get a token
            </Link>
            <Link
              href="/examples/speechlab-waveform"
              className="px-5 py-3 border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              See the SpeechLab example
            </Link>
            <Link
              href={`${REPO}/blob/main/.claude/skills/cuit-loop/SKILL.md`}
              className="px-5 py-3 border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              Read the /cuit-loop skill
            </Link>
          </div>
        </div>
      </section>

      {/* REST FALLBACK */}
      <section className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <details className="group">
            <summary className="cursor-pointer flex items-baseline gap-3 list-none">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] group-open:text-[var(--text-secondary)]">
                ▸ Need REST instead?
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                For CI integrations, hostile network environments, or non-agentic toolchains.
              </span>
            </summary>
            <div className="mt-6 space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                The MCP server is a thin wrapper over the REST API. If your
                environment blocks Claude Code or you need to script against
                CI, you can drive everything via{" "}
                <code className="font-mono text-xs">curl</code> against{" "}
                <code className="font-mono text-xs">{API_URL}</code>.
              </p>
              <p>
                Full endpoint reference + per-endpoint{" "}
                <code className="font-mono text-xs">curl</code> examples lives at{" "}
                <Link href="/docs/api" className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  /docs/api
                </Link>
                . The OpenAPI 3.0 spec lives at{" "}
                <Link
                  href={`${API_URL}/openapi.json`}
                  className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {API_URL}/openapi.json
                </Link>{" "}
                — codegen-ready for any language.
              </p>
              <p>
                Minimum proof-of-life:
              </p>
              <CodeBlock lang="bash">{`# Set token from /signup, then:
curl -s -H "Authorization: Bearer $CUIT_TENANT_TOKEN" \\
  ${API_URL}/v1/me | jq

# Round-trips through bearer auth + RLS + Postgres,
# returns your tenant info.`}</CodeBlock>
              <p className="text-[var(--text-tertiary)]">
                But honestly — if you&apos;re here for the first time, go back to step 1 above and use Claude Code. This walkthrough was written assuming you&apos;re an agentic-AI-native developer.
              </p>
            </div>
          </details>
        </div>
      </section>
    </SiteShell>
  );
}
