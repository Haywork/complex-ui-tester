import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { TranscriptCard } from "@/components/TranscriptCard";
import { Badge } from "@/components/ui/Badge";
import { TRANSCRIPTS } from "@/content/claude-code-transcripts";

export const metadata: Metadata = {
  title: "Five Claude Code conversations — CUIT in real engineer workflows",
  description:
    "Real Claude Code transcripts using CUIT MCP tools. Segment-drag regression, fresh Next.js instrumentation, flake diagnosis, PR-gating, SOC 2 audit export. The loop is the product; this is how engineers feel it.",
};

export default function ClaudeCodeWorkflowsPage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="pt-12 pb-10 md:pt-20 md:pb-14 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Examples · Claude Code conversations
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
            Five conversations.<br />
            <span className="text-[var(--text-secondary)]">Five outcomes.</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-6">
            What it looks like when an engineer drops the CUIT MCP server into
            Claude Code and uses it for real work. Not slides. Not a demo
            video. Five end-to-end transcripts where the agent observes,
            calls tools, reads results, decides — and lands at an outcome.
          </p>
          <p className="text-base text-[var(--text-tertiary)] max-w-3xl leading-relaxed">
            The loop is the product. These transcripts are how engineers
            feel it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge>5 conversations</Badge>
            <Badge>{TRANSCRIPTS.reduce((n, t) => n + t.turns.length, 0)} turns</Badge>
            <Badge>real MCP tools</Badge>
            <Badge>Claude Code-native</Badge>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="py-10 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
            What you&apos;re looking at
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--accent-primary)" }}>
                The loop is the product
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Per Lance Martin&apos;s framing of the agentic landscape: the
                feedback loop is the durable layer that survives model churn.
                CUIT is the UI-domain instantiation — define an outcome
                (regression caught), call tools, observe, iterate.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--accent-primary)" }}>
                Ease of integration is the moat
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                The engineer in these transcripts is conversational, not
                writing API code. That&apos;s deliberate. The MCP server +
                two skills compress the integration surface from days of
                Playwright authoring to one chat session.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--accent-primary)" }}>
                Claude Code is the primary surface
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Every transcript on this page happens inside Claude Code,
                with CUIT as native tools. No terminal tabs, no Postman,
                no curl. That&apos;s our positioning — see{" "}
                <Link
                  href="https://github.com/speechlabinc/cuit-internal/blob/main/wiki/25-adr-008-agentic-native-onboarding.md"
                  className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ADR-008
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TABLE OF CONTENTS */}
      <section className="py-8 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Jump to a conversation
          </h2>
          <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {TRANSCRIPTS.map((t, i) => (
              <li key={t.slug}>
                <Link
                  href={`#${t.slug}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                >
                  <span className="font-mono text-xs text-[var(--text-tertiary)] mr-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TRANSCRIPTS */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {TRANSCRIPTS.map((t) => (
            <TranscriptCard key={t.slug} transcript={t} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Run these conversations yourself
          </h2>
          <p className="text-base text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto leading-relaxed">
            Sign up, drop the CUIT MCP server into your Claude Code config,
            type <code className="font-mono text-sm bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">/cuit-instrument</code>{" "}
            in any repo, and you&apos;re in the loop on your own app within
            ten minutes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup"
              className="px-5 py-3 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-md font-semibold hover:opacity-90 transition"
            >
              Sign up → get your token
            </Link>
            <Link
              href="/quickstart"
              className="px-5 py-3 border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              90-second setup
            </Link>
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/.claude/skills/cuit-loop/SKILL.md"
              className="px-5 py-3 border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              Read the /cuit-loop skill
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
