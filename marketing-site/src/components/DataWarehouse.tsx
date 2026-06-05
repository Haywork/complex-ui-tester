import Link from "next/link";
import { CodeBlock } from "@/components/ui/Code";
import { Badge } from "@/components/ui/Badge";
import {
  DATA_WAREHOUSE_CAPABILITIES,
  EXAMPLE_QUERIES,
  OSS_VS_SAAS,
  THREE_TAPS,
} from "@/content/data-warehouse";

export function DataWarehouse() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)] relative overflow-hidden"
      aria-labelledby="data-warehouse-heading"
      id="data-warehouse"
    >
      <div
        className="absolute inset-x-0 top-0 h-72 opacity-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 0%, var(--color-accent) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            What the SaaS adds — the org-wide QA data warehouse
          </p>
          <h2
            id="data-warehouse-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            One developer needs a loop.
            <br />A team needs a corpus.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The OSS library is enough for one developer running the loop on
            their own laptop. The moment you have two — and the moment AI
            coding tools start writing UI changes for the whole team — you
            need somewhere central for every session to land, every spec to
            roll up, every QA insight to query. That somewhere is the SaaS.
          </p>
        </div>

        {/* OSS vs SaaS — the buy-vs-build line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          {/* OSS */}
          <article className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 md:p-7 flex flex-col">
            <div className="flex items-baseline gap-3 mb-3">
              <Badge variant="mono">{OSS_VS_SAAS.oss.badge}</Badge>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2 leading-snug">
              {OSS_VS_SAAS.oss.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 italic">
              {OSS_VS_SAAS.oss.summary}
            </p>
            <div className="mb-5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-green-400 mb-2">
                What it covers
              </h4>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {OSS_VS_SAAS.oss.works.map((w) => (
                  <li key={w} className="flex items-start gap-2 leading-snug">
                    <span className="text-green-400 mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto border-t border-[var(--border-color)] pt-5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Where it stops
              </h4>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {OSS_VS_SAAS.oss.limits.map((l) => (
                  <li key={l} className="flex items-start gap-2 leading-snug">
                    <span
                      className="text-[var(--text-tertiary)] mt-0.5"
                      aria-hidden="true"
                    >
                      ○
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* SaaS */}
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04] p-6 md:p-7 flex flex-col">
            <div className="flex items-baseline gap-3 mb-3">
              <Badge variant="accent">{OSS_VS_SAAS.saas.badge}</Badge>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2 leading-snug">
              {OSS_VS_SAAS.saas.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 italic">
              {OSS_VS_SAAS.saas.summary}
            </p>
            <div className="mb-5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-accent)] mb-2">
                What it unlocks
              </h4>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {OSS_VS_SAAS.saas.works.map((w) => (
                  <li key={w} className="flex items-start gap-2 leading-snug">
                    <span
                      className="text-[var(--color-accent)] mt-0.5"
                      aria-hidden="true"
                    >
                      →
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto border-t border-[var(--border-color)] pt-5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Trade-offs
              </h4>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {OSS_VS_SAAS.saas.limits.map((l) => (
                  <li key={l} className="flex items-start gap-2 leading-snug">
                    <span
                      className="text-[var(--text-tertiary)] mt-0.5"
                      aria-hidden="true"
                    >
                      ○
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>

        {/* What the corpus unlocks */}
        <div className="mb-14">
          <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-6">
            What the corpus unlocks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATA_WAREHOUSE_CAPABILITIES.map((cap) => (
              <article
                key={cap.title}
                className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5"
              >
                <h4 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                  {cap.title}
                </h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {cap.body}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Three taps */}
        <div className="mb-14">
          <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">
            Three ways your agent taps in
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-3xl">
            The corpus is reachable through the Claude Code skill (drop-in),
            the REST API (CI integrations and batch work), and an MCP server
            (mid-task investigation without leaving the agent loop). Pick
            whichever fits.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {THREE_TAPS.map((tap) => (
              <article
                key={tap.name}
                className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 flex flex-col"
              >
                <h4 className="text-base font-bold text-[var(--text-primary)] mb-1 font-mono">
                  {tap.name}
                </h4>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                  {tap.surface}
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  {tap.use}
                </p>
                <div className="mb-4">
                  <CodeBlock
                    code={tap.example}
                    filename="example"
                    language="bash"
                  />
                </div>
                <Link
                  href={tap.docHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-xs font-mono text-[var(--color-accent)] hover:underline"
                >
                  Read the spec ↗
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Example queries */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              Same question, three surfaces
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Ask the corpus in natural language inside Claude Code, in MCP
              tool calls, or via the REST API. Same answer, different shape.
            </p>
          </div>
          <ul className="divide-y divide-[var(--border-color)]">
            {EXAMPLE_QUERIES.map((q) => (
              <li key={q.natural} className="p-5">
                <p className="text-sm text-[var(--text-primary)] font-medium mb-3 italic">
                  &ldquo;{q.natural}&rdquo;
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
                      via MCP (Claude Code, Cursor)
                    </p>
                    <CodeBlock
                      code={q.asMcp}
                      filename="mcp tool call"
                      language="typescript"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
                      via REST API
                    </p>
                    <CodeBlock
                      code={q.asApi}
                      filename="HTTPS"
                      language="bash"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-sm text-[var(--text-tertiary)] leading-relaxed max-w-3xl">
          Full data model, security posture (encryption, per-tenant KMS keys,
          SOC 2 posture), and the complete REST + MCP surface live in{" "}
          <Link
            href="https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/12-qa-data-warehouse.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline font-mono"
          >
            docs/12-qa-data-warehouse.md
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
