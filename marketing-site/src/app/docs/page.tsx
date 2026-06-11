import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Badge } from "@/components/ui/Badge";
import { DOCS, TOP_LEVEL_DOCS } from "@/content/docs-index";

export const metadata: Metadata = {
  title: "Docs — CUIT Architecture & Design Documents",
  description:
    "10 numbered design docs covering CUIT architecture, security, MCP server integration, adapter specs, and closed-loop UI verification for Claude Code agents.",
  keywords: [
    "CUIT documentation",
    "claude code ui testing",
    "mcp server ui regression",
    "closed loop verification for agents",
    "UI feedback loop",
    "agentic ui test generation",
    "architecture",
    "design documents",
  ],
  openGraph: {
    title: "Docs — CUIT Architecture & Design Documents | CUIT",
    description:
      "10 numbered design docs covering CUIT architecture, security, MCP server integration, adapter specs, and closed-loop UI verification for Claude Code agents.",
  },
};

export default function DocsPage() {
  return (
    <SiteShell>
      <section className="pt-12 pb-12 md:pt-20 md:pb-16 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Documentation
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 max-w-3xl">
            10 design documents.
            <br />
            One source of truth.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Every architectural decision, evidence claim, and commitment lives
            in one of these documents. They cross-reference each other heavily
            — start with whichever matches your role.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-6">
            Numbered design docs
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {DOCS.map((doc) => (
              <Link
                key={doc.slug}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 hover:border-[var(--color-mute-4)] hover:bg-[var(--bg-tertiary)] transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="font-mono text-2xl font-bold text-[var(--color-mute-3)] group-hover:text-[var(--color-accent)] transition-colors shrink-0 leading-none"
                    aria-hidden="true"
                  >
                    {doc.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {doc.title}
                      </h3>
                      <Badge variant="success">{doc.status}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                      {doc.description}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                      For: {doc.audience}
                    </p>
                  </div>
                  <span
                    className="text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maturity ladder — compact table mirror ─────────────────────────── */}
      <section
        className="py-16 md:py-20 border-t border-[var(--border-color)]"
        aria-labelledby="docs-maturity-heading"
        id="maturity"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Maturity ladder — no surprises
          </p>
          <h2
            id="docs-maturity-heading"
            className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 leading-tight"
          >
            Here&apos;s exactly what runs today.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-2xl leading-relaxed">
            Full three-column breakdown lives on the{" "}
            <Link
              href="/#maturity"
              className="text-[var(--color-accent)] hover:underline font-mono"
            >
              homepage ↗
            </Link>
            . Quick-reference table below.
          </p>

          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
            <table className="w-full text-sm" aria-label="CUIT maturity ladder">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <th
                    scope="col"
                    className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] w-36"
                  >
                    Tier
                  </th>
                  <th
                    scope="col"
                    className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-[var(--text-tertiary)]"
                  >
                    What&apos;s in it
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-secondary)]">
                {/* SHIPPING NOW */}
                <tr className="align-top">
                  <td className="px-5 py-4 shrink-0">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--accent-green)]">
                      <span aria-hidden="true">●</span>
                      Shipping Now
                    </span>
                    <span className="block mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
                      v0.x — OSS
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary)] leading-relaxed">
                    Deterministic harness; generalized spec-gen (drag, click,
                    text shapes); real spec execution via primitive-exec;
                    recorder with console + error capture; local MCP shim (OSS
                    runs standalone); 2 adapters (Jam, CUIT); /cuit-loop +
                    /cuit-instrument skills; AX envelopes + step-back debug
                    primitives.
                  </td>
                </tr>

                {/* IN PROGRESS */}
                <tr className="align-top">
                  <td className="px-5 py-4 shrink-0">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--color-warning)]">
                      <span aria-hidden="true">◑</span>
                      In Progress
                    </span>
                    <span className="block mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
                      private pilot
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary)] leading-relaxed">
                    Hosted SaaS data warehouse (private pilot on Fly + Neon);
                    LLM 3-pass spec-gen (rule-based is the default today); more
                    interaction shapes; self-healing selectors.
                  </td>
                </tr>

                {/* NOT YET */}
                <tr className="align-top">
                  <td className="px-5 py-4 shrink-0">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--text-tertiary)]">
                      <span aria-hidden="true">○</span>
                      Not Yet
                    </span>
                    <span className="block mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
                      roadmap
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary)] leading-relaxed">
                    AWS production infrastructure; general step-extractor for
                    arbitrary interactions; SOC 2 Type II report.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-6">
            Top-level guides
          </h2>
          <ul
            className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]"
            role="list"
          >
            {TOP_LEVEL_DOCS.map((doc) => (
              <li key={doc.name}>
                <Link
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 py-4 px-2 hover:bg-[var(--bg-secondary)]/50 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
                >
                  <span className="font-mono text-sm text-[var(--color-accent)] w-40 shrink-0">
                    {doc.name}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] flex-1">
                    {doc.description}
                  </span>
                  <span
                    className="text-[var(--text-tertiary)] shrink-0"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
