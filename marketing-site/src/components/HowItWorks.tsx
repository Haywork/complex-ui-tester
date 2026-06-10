import { CodeBlock } from "@/components/ui/Code";

const STEPS = [
  {
    number: "01",
    title: "Drop in the MCP server",
    description:
      "Add CUIT to Claude Code in one edit. Paste the server block into ~/.claude/mcp_servers.json and you're wired — no SDK changes, no new instrumentation, nothing your users ever see.",
    visual: "terminal" as const,
    code: `// ~/.claude/mcp_servers.json
{
  "mcpServers": {
    "cuit": {
      "command": "npx",
      "args": ["-y", "@cuit/mcp-server"]
    }
  }
}

# Claude Code picks it up on next launch.
# Verify with: /mcp`,
    filename: "mcp_servers.json",
    badge: "One-time setup",
  },
  {
    number: "02",
    title: "Run /cuit-instrument in your repo",
    description:
      "Open Claude Code, type /cuit-instrument, and the skill auto-detects your framework and state library, mounts window.__cuitDebug, installs the recorder bridge, and sets up the GitHub Action. Compress what used to be a day of wiring into under a minute.",
    visual: "code" as const,
    code: `# In Claude Code — just type the skill name:

> /cuit-instrument

  ✔ Detected: Next.js 14 + Zustand
  ✔ Mounted window.__cuitDebug bridge
  ✔ Installed @cuit/recorder (dev dep)
  ✔ Added .github/workflows/cuit.yml
  ✔ Round-trip test session: PASS

  Ready. Hit a bug and run /cuit-loop.`,
    filename: "cuit-instrument.sh",
    badge: "< 60 seconds",
  },
  {
    number: "03",
    title: "Hit a bug — type /cuit-loop, watch the gate land",
    description:
      "When a bug surfaces, run /cuit-loop in Claude Code. It reads the recorded session, generates a grounded Playwright spec, runs it red to prove the bug is real, and opens a PR. Ship the fix in the same PR — the spec goes green and becomes a permanent CI gate. The feedback loop is the substrate: model-invariant, zero maintenance.",
    visual: "pr" as const,
    code: `# Bug filed. You type in Claude Code:

> /cuit-loop

  ✔ Session ingested (Jam / LogRocket / Sentry Replay)
  ✔ Spec generated — confidence 0.91, AST grounded
  ✔ Dry-run: RED  (bug reproduced ✓)
  ✔ PR opened: fix + spec in one branch

  After your fix lands:
  cuit/dry-run   ✅ GREEN — gate permanent`,
    filename: "cuit-loop.sh",
    badge: "Gate is permanent",
  },
];

/** REST / curl users: see /docs/api for the HTTP fallback. */
function RestFallbackFooter() {
  return (
    <p className="text-center text-xs text-[var(--text-tertiary)] mt-12">
      Prefer HTTP?{" "}
      <a
        href="/docs/api"
        className="underline underline-offset-2 hover:text-[var(--text-secondary)] transition-colors"
      >
        REST fallback docs →
      </a>
    </p>
  );
}

export function HowItWorks() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="how-it-works-heading"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            Three Claude Code commands. One permanent CI gate.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The full loop — from filed bug to merged regression spec — runs
            inside Claude Code. MCP tool, skill, done. Median time under 8
            minutes. After that, the gate costs nothing to maintain.
          </p>
        </div>

        <div className="space-y-16">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
            >
              {/* Text — alternate sides on larger screens */}
              <div
                className={
                  index % 2 === 1 ? "lg:order-2" : "lg:order-1"
                }
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="font-mono text-4xl font-bold text-[var(--color-mute-3)] leading-none"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                      {step.title}
                    </h3>
                    <span className="inline-block font-mono text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                      {step.badge}
                    </span>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base">
                  {step.description}
                </p>
              </div>

              {/* Visual */}
              <div className={index % 2 === 1 ? "lg:order-1" : "lg:order-2"}>
                <CodeBlock
                  code={step.code}
                  filename={step.filename}
                  language={
                    step.filename.endsWith(".ts")
                      ? "typescript"
                      : step.filename.endsWith(".sh") ||
                        step.filename.endsWith(".json")
                      ? "bash"
                      : "text"
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <RestFallbackFooter />
      </div>
    </section>
  );
}
