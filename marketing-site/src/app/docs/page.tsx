import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Badge } from "@/components/ui/Badge";
import { DOCS, TOP_LEVEL_DOCS } from "@/content/docs-index";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Architecture, security, operations, GTM, adapter specs. 10 numbered design documents plus top-level repo guides.",
};

export default function DocsPage() {
  return (
    <SiteShell>
      <section className="pt-12 pb-12 md:pt-20 md:pb-16 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
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
