import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Badge } from "@/components/ui/Badge";
import {
  ApiInfoMeta,
  ApiReference,
  ApiServerList,
} from "@/components/ApiReference";

export const metadata: Metadata = {
  title: "API reference",
  description:
    "The CUIT SaaS API. Upload a session, get a regression spec. Bearer-token auth, per-tenant warehouse, RLS-isolated. Generated from the OpenAPI 3.0 spec the API serves at /openapi.json.",
};

export default function ApiDocsPage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="pt-12 pb-10 md:pt-20 md:pb-14 border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            API reference
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
            The CUIT SaaS API.
            <br />
            <span className="text-[var(--text-secondary)]">
              Upload a session. Get a regression spec.
            </span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-6">
            This is the data plane. Customer recorders POST captured sessions to{" "}
            <code className="font-mono text-sm text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
              POST /v1/sessions
            </code>
            ; the warehouse auto-generates a Playwright/Vitest spec, persists it under tenant
            isolation, and returns the spec id and confidence in the same response. Everything else —
            spec list, insights, audit log export, MCP tool surface — is a thin shell over the same shape.
          </p>
          <p className="text-base text-[var(--text-tertiary)] max-w-3xl leading-relaxed">
            Spec is OpenAPI 3.0, sourced from the same Zod schemas that validate inbound requests at
            runtime. <strong className="text-[var(--text-secondary)]">Same source of truth as the server.</strong> When the API
            changes, this page changes — there is no hand-maintained docs drift.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge>OpenAPI 3.0</Badge>
            <Badge>Bearer token auth</Badge>
            <Badge>Multi-tenant via Postgres RLS</Badge>
            <Badge>JSON only</Badge>
          </div>
        </div>
      </section>

      {/* QUICK FACTS */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
              Authentication
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
              Per-tenant bearer token issued at onboarding. Pass on every <code className="font-mono text-xs text-[var(--text-primary)]">/v1/*</code> request:
            </p>
            <pre className="text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md p-3 leading-relaxed text-[var(--text-primary)] overflow-x-auto">
              authorization: Bearer &lt;TOKEN&gt;
            </pre>
            <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed">
              Token resolves to a <code className="font-mono">tenant_id</code> which we set in the Postgres connection&apos;s <code className="font-mono">app.current_tenant_id</code> GUC. Row Level Security handles cross-tenant isolation; the application code cannot accidentally read another tenant&apos;s data.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
              Servers
            </h3>
            <ApiServerList />
            <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed">
              Pilot is on Fly.io + Neon Postgres. Production lands on AWS ECS Fargate + Aurora in sprint week 8 — same OpenAPI surface, no breaking changes.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
              Versioning
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
              Path-prefixed under <code className="font-mono text-xs text-[var(--text-primary)]">/v1/</code>. We bump <code className="font-mono text-xs text-[var(--text-primary)]">/v2/</code> only for genuine breaking changes; additive fields and new optional parameters ship under <code className="font-mono">/v1/</code> forever.
            </p>
            <ApiInfoMeta />
          </div>
        </div>
      </section>

      {/* ERRORS */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Errors</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-3xl">
            Every error is JSON, always shape{" "}
            <code className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
              {"{ error: string, message?: string, issues?: [] }"}
            </code>
            . HTTP status is the source of truth for category; the body is the source of truth for what to
            tell the developer.
          </p>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-[var(--text-tertiary)] uppercase tracking-wider text-xs">
                <th className="text-left py-2 pr-4 font-normal">status</th>
                <th className="text-left py-2 pr-4 font-normal">error</th>
                <th className="text-left py-2 font-normal">when</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              <tr className="border-t border-[var(--border-color)]">
                <td className="py-2 pr-4 text-rose-300">400</td>
                <td className="py-2 pr-4 text-[var(--text-primary)]">invalid payload</td>
                <td className="py-2 text-[var(--text-secondary)]">Body did not match the route&apos;s Zod schema. <code>issues</code> is the Zod error array verbatim.</td>
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="py-2 pr-4 text-rose-300">401</td>
                <td className="py-2 pr-4 text-[var(--text-primary)]">missing bearer token</td>
                <td className="py-2 text-[var(--text-secondary)]">No <code>Authorization</code> header. Or the header doesn&apos;t start with <code>Bearer </code>.</td>
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="py-2 pr-4 text-rose-300">401</td>
                <td className="py-2 pr-4 text-[var(--text-primary)]">invalid token</td>
                <td className="py-2 text-[var(--text-secondary)]">Token didn&apos;t resolve to a tenant. Rotated? Revoked? Typo?</td>
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="py-2 pr-4 text-rose-300">404</td>
                <td className="py-2 pr-4 text-[var(--text-primary)]">not found</td>
                <td className="py-2 text-[var(--text-secondary)]">Resource ID doesn&apos;t exist in this tenant. RLS makes cross-tenant 404s look identical to genuinely missing — by design.</td>
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="py-2 pr-4 text-rose-300">500</td>
                <td className="py-2 pr-4 text-[var(--text-primary)]">server error</td>
                <td className="py-2 text-[var(--text-secondary)]">Our fault. <code>message</code> is the underlying exception. We log every 500 with a request id; mention it when you file a ticket.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* AGENT INTEGRATION */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Agent integration — MCP is the primary surface
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-3xl">
            The REST API exists for CI workflows, batch scripts, and direct integration. The
            <strong className="text-[var(--text-primary)]"> MCP server</strong>{" "}
            (<code className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">@cuit-saas/mcp</code>) is what Claude Code / Cursor / Codex consume in-loop. Both call the
            same endpoints below. If you&apos;re wiring an agent: use MCP. If you&apos;re wiring CI: use REST.
          </p>
          <pre className="text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md p-4 leading-relaxed text-[var(--text-primary)] overflow-x-auto">{`// ~/.claude/mcp_servers.json
{
  "mcpServers": {
    "cuit": {
      "command": "npx",
      "args": ["-y", "@cuit-saas/mcp"],
      "env": {
        "CUIT_API_URL": "https://api.cuit.dev",
        "CUIT_TENANT_TOKEN": "<YOUR_TENANT_TOKEN>"
      }
    }
  }
}`}</pre>
          <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed max-w-3xl">
            The MCP server ships 3 of 8 tools wired today (<code>query_sessions</code>,{" "}
            <code>find_similar_sessions</code>, <code>flake_rate</code>). The remaining 5 ship across
            sprint weeks 3-8 — see{" "}
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/12-qa-data-warehouse.md"
              className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              docs/12 §6
            </Link>{" "}
            for the frozen tool interface.
          </p>
        </div>
      </section>

      {/* MAIN REFERENCE */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Endpoints</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-10 max-w-3xl leading-relaxed">
            Auto-generated from{" "}
            <code className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
              openapi.json
            </code>
            . Same schemas as the runtime validation. Examples are real shapes the API accepts — copy and
            paste them.
          </p>
          <ApiReference />
        </div>
      </section>

      {/* WHAT'S NEXT */}
      <section className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">What ships next</h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            <li>
              <strong className="text-[var(--text-primary)]">Sprint week 3:</strong>{" "}
              <code className="font-mono text-xs">POST /v1/sessions</code> auto-triggers the LLM
              spec-gen pipeline (today: rule-based). Confidence threshold ≥ 0.75 enables auto-PR.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Sprint week 4:</strong>{" "}
              <code className="font-mono text-xs">POST /v1/specs/:id/run</code> against a customer
              URL, returns RED or GREEN with structured step-level annotations.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Sprint week 5:</strong>{" "}
              <code className="font-mono text-xs">cuit__find_similar_sessions</code> wires the pgvector
              query end-to-end. New endpoints land for app-shape detection + instrumentation
              proposal — see the <Link href="https://github.com/speechlabinc/complex-ui-tester/blob/main/.claude/skills/cuit-instrument/SKILL.md" className="underline">/cuit-instrument skill</Link>.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Sprint week 7:</strong>{" "}
              <code className="font-mono text-xs">GET /v1/audit?since=...&until=...</code> with
              streaming CSV export. Stripe billing webhooks. Rate limits per tier.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Sprint week 8:</strong>{" "}
              <code className="font-mono text-xs">api.cuit.dev</code> is the production URL. SOC 2
              evidence collection begins.
            </li>
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/docs"
              className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← Back to docs
            </Link>
            <a
              href="/openapi.json"
              className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              download
            >
              Download openapi.json
            </a>
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/12-qa-data-warehouse.md"
              className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              docs/12 — data warehouse design
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
