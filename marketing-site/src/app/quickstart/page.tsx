import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Quickstart — 5 minutes from zero to live spec",
  description:
    "QA-team-ready walkthrough. Hit the live CUIT SaaS API, upload a session, get an auto-generated regression spec, run it, query the corpus. Every command is copy-paste against cuit-saas-pilot.fly.dev.",
};

const PILOT_URL = "https://cuit-saas-pilot.fly.dev";
const DOCS_API = "https://complex-ui-tester.vercel.app/docs/api";
const REPO = "https://github.com/speechlabinc/complex-ui-tester";

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="text-xs sm:text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md p-4 overflow-x-auto leading-relaxed text-[var(--text-primary)] whitespace-pre">
      {children}
    </pre>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-l-2 border-[var(--border-color)] pl-6 py-2 mb-10 relative">
      <div className="absolute -left-[14px] top-2 w-6 h-6 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] flex items-center justify-center font-mono text-xs font-bold text-[var(--accent-primary)]">
        {n}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
        {title}
      </h3>
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        {children}
      </div>
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
            Hit the live API in 5 minutes.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-6">
            For QA teams evaluating CUIT. Every command on this page is copy-paste against{" "}
            <code className="font-mono text-sm text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
              {PILOT_URL}
            </code>
            . You&apos;ll upload a real session, watch the warehouse auto-generate a
            Playwright/Vitest regression spec, run it, and read it back — all
            through the production API.
          </p>
          <p className="text-base text-[var(--text-tertiary)] max-w-3xl leading-relaxed">
            No clones, no builds. Just <code className="font-mono text-xs">curl</code>{" "}
            and <code className="font-mono text-xs">jq</code>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge>~5 min</Badge>
            <Badge>copy-paste only</Badge>
            <Badge>real production data</Badge>
          </div>
        </div>
      </section>

      {/* PRE-REQS */}
      <section className="py-10 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            What you need before starting
          </h2>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2 leading-relaxed">
            <li>
              <strong className="text-[var(--text-primary)]">A tenant bearer token.</strong>{" "}
              Get one in 10 seconds at{" "}
              <Link href="/signup" className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                /signup
              </Link>
              {" "}— self-service, no human in the loop. Email + company name → token.
              Rate-limited to 3 signups per IP per hour.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">A terminal with{" "}
              <code className="font-mono text-xs">curl</code> and{" "}
              <code className="font-mono text-xs">jq</code>.</strong> Both ship on macOS by default; install jq via <code className="font-mono text-xs">brew install jq</code> if missing.
            </li>
          </ul>
        </div>
      </section>

      {/* THE 6 STEPS */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            The walkthrough
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-10 max-w-3xl leading-relaxed">
            Set your token once, then steps 2-6 build on each other. Stop at any
            point — each command is independent.
          </p>

          {/* Step 1 — Set up env */}
          <Step n={1} title="Set environment variables">
            <p>
              Paste your tenant token below, then keep this terminal open for
              the rest of the walkthrough.
            </p>
            <CodeBlock>{`export TOKEN='paste-your-tenant-token-here'
export B=${PILOT_URL}

# Sanity check — should return {"ok":true,"ts":"..."}
curl -s $B/healthz | jq`}</CodeBlock>
            <p className="text-[var(--text-tertiary)] text-xs">
              If the health check fails, the API is down or your network blocks
              outbound HTTPS. Ping us before going further.
            </p>
          </Step>

          {/* Step 2 — Upload session */}
          <Step n={2} title="Upload a session — get an auto-generated spec back">
            <p>
              This payload is a real SpeechLab waveform-editor session reproducing
              the segment-drag-after-resize regression (Branch B bug #1833). 17
              events, including a drag-down/move/up pointer sequence and the
              before/after state snapshots.
            </p>
            <CodeBlock>{`# Fetch the fixture from GitHub (or substitute your own session JSON)
curl -s '${REPO}/raw/main/proof-of-concept/fixtures/translate-ui-react-drag-after-resize.json' \\
  -o /tmp/session.json

# Upload it — the warehouse auto-generates a spec from this session
curl -s -X POST $B/v1/sessions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d @/tmp/session.json | jq`}</CodeBlock>
            <p>
              <strong className="text-[var(--text-primary)]">Expected:</strong> a JSON
              response with{" "}
              <code className="font-mono text-xs">spec_id</code> and{" "}
              <code className="font-mono text-xs">confidence: 0.95</code>. The
              generated spec is now persisted in the warehouse. Note both ids.
            </p>
          </Step>

          {/* Step 3 — Read the spec */}
          <Step n={3} title="Pull the generated spec source">
            <p>
              The warehouse stored the rendered <code className="font-mono text-xs">.spec.ts</code>{" "}
              source. Read it back — every harness primitive
              (<code className="font-mono text-xs">dispatchDrag</code>,{" "}
              <code className="font-mono text-xs">setClock</code>,{" "}
              <code className="font-mono text-xs">getStateSnapshot</code>,{" "}
              <code className="font-mono text-xs">assertStateEquals</code>) is
              part of the OSS{" "}
              <code className="font-mono text-xs">@cuit/harness</code> package.
            </p>
            <CodeBlock>{`# Grab the most recent spec id
SPEC_ID=$(curl -s -H "Authorization: Bearer $TOKEN" $B/v1/specs | jq -r '.specs[0].id')
echo "spec id: $SPEC_ID"

# Read the full spec including the generated source
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/specs/$SPEC_ID" \\
  | jq '{model_version, confidence, primitive_count: (.primitives|length)}'

# Print just the .spec.ts source
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/specs/$SPEC_ID" | jq -r '.serialized'`}</CodeBlock>
            <p>
              <strong className="text-[var(--text-primary)]">Expected:</strong> a real
              vitest spec with an assertion on{" "}
              <code className="font-mono text-xs">segments[1].x</code> matching
              what the session actually moved.
            </p>
          </Step>

          {/* Step 4 — Run the spec */}
          <Step n={4} title="Run the spec — RED or GREEN with step-level annotations">
            <p>
              The runner executes the spec against a target URL and persists the
              outcome. v0.1 simulates execution; v0.2 (sprint week 9) will spin
              up real Playwright workers.
            </p>
            <CodeBlock>{`curl -s -X POST "$B/v1/specs/$SPEC_ID/run" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"target_url":"http://localhost:3000","browser":"jsdom"}' \\
  | jq '{outcome, duration_ms, steps_count: (.steps|length), failed_at_primitive}'`}</CodeBlock>
            <p>
              <strong className="text-[var(--text-primary)]">Expected:</strong>{" "}
              <code className="font-mono text-xs">{"{outcome:'green', steps_count:6, ...}"}</code>{" "}
              for the fixture session against a healthy app.
            </p>
          </Step>

          {/* Step 5 — Query the corpus */}
          <Step n={5} title="Query the corpus — similar sessions, bug class, flake rate">
            <p>
              The warehouse exposes per-tenant analytics. These are what
              Claude Code consumes via MCP when investigating a bug.
            </p>
            <CodeBlock>{`# Sessions vector-similar to ours (pgvector cosine)
SESSION_ID=$(curl -s -H "Authorization: Bearer $TOKEN" $B/v1/sessions | jq -r '.sessions[0].id')
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/sessions/$SESSION_ID/similar?threshold=0.0" | jq

# Bug-class distribution
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/insights/bug-class-distribution?window=28d" | jq

# Per-spec flake rate
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/insights/flake-rate" | jq

# List recent runs
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/runs?limit=5" | jq '.runs[] | {outcome, duration_ms, created_at}'`}</CodeBlock>
          </Step>

          {/* Step 6 — Audit + billing */}
          <Step n={6} title="Audit log + billing — what compliance sees">
            <p>
              Every state mutation lands in the audit log. Stream it as
              CSV/JSON/NDJSON for SOC 2 evidence collection.
            </p>
            <CodeBlock>{`# Full audit log for the year
curl -s -H "Authorization: Bearer $TOKEN" \\
  "$B/v1/audit?since=2026-01-01T00:00:00Z&until=2026-12-31T23:59:59Z&format=ndjson" \\
  | head -10

# Current-period usage (for billing)
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/billing/usage" | jq

# Subscription details
curl -s -H "Authorization: Bearer $TOKEN" "$B/v1/billing/subscription" | jq`}</CodeBlock>
          </Step>
        </div>
      </section>

      {/* WHAT YOU PROVED */}
      <section className="py-10 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            What passing this walkthrough proves
          </h2>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2 leading-relaxed mb-6">
            <li>✓ The production API is reachable and bearer auth works end-to-end</li>
            <li>✓ Sessions persist to a Postgres warehouse with tenant isolation via RLS</li>
            <li>✓ Spec generation runs automatically on session upload</li>
            <li>✓ Generated specs are retrievable as real <code className="font-mono text-xs">.spec.ts</code> source — yours forever</li>
            <li>✓ The spec runner persists structured outcomes (RED/GREEN + step annotations)</li>
            <li>✓ pgvector similarity, bug-class aggregation, and flake-rate queries all work</li>
            <li>✓ The audit log captures every mutation in NDJSON/CSV/JSON for compliance</li>
            <li>✓ Billing usage aggregation runs in real time</li>
          </ul>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            If anything fails, paste the broken command + response into{" "}
            <a href="mailto:ryan@speechlab.ai" className="underline">
              ryan@speechlab.ai
            </a>{" "}
            and we&apos;ll debug live. Expected wall-clock for the full walkthrough:
            5-7 minutes if the network behaves.
          </p>
        </div>
      </section>

      {/* NEXT STEPS */}
      <section className="py-12 border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
            Deeper integration paths
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-[var(--border-color)] rounded-lg p-5">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Browser
              </h3>
              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Install the Chrome extension
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Record real interactions on any web app — no code changes. The
                JSON output drops into{" "}
                <code className="font-mono text-xs">POST /v1/sessions</code>{" "}
                exactly like the fixture above.
              </p>
              <Link
                href="/#recorder-alpha"
                className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Get the extension →
              </Link>
            </div>
            <div className="border border-[var(--border-color)] rounded-lg p-5">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Agent
              </h3>
              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Connect Claude Code via MCP
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Drop our MCP server into Claude Code&apos;s settings. The agent
                consumes 7 wired tools — query sessions, find similar, propose
                instrumentation — without leaving the editor.
              </p>
              <Link
                href="/docs/api"
                className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                MCP setup →
              </Link>
            </div>
            <div className="border border-[var(--border-color)] rounded-lg p-5">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                App
              </h3>
              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Wire the bridge into your app
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Drop a 30-line useEffect into your root component. Sessions
                stream live as your team uses the app in dev mode (gated by{" "}
                <code className="font-mono text-xs">?cuitRecorder=1</code>).
                One-command CLI is coming next.
              </p>
              <Link
                href="https://github.com/speechlabinc/complex-ui-tester/blob/main/.claude/skills/cuit-instrument/SKILL.md"
                className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Bridge guide →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LINKS */}
      <section className="py-10 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-base font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            References
          </h2>
          <ul className="text-sm space-y-2">
            <li>
              <Link href={DOCS_API} className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                /docs/api
              </Link>
              <span className="text-[var(--text-tertiary)]"> — all 21 endpoints with schemas + curl examples</span>
            </li>
            <li>
              <Link href={`${PILOT_URL}/openapi.json`} className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                openapi.json
              </Link>
              <span className="text-[var(--text-tertiary)]"> — machine-readable spec (codegen-ready)</span>
            </li>
            <li>
              <Link href={REPO} className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                speechlabinc/complex-ui-tester
              </Link>
              <span className="text-[var(--text-tertiary)]"> — public OSS repo (recorder, harness, spec-gen)</span>
            </li>
            <li>
              <Link href="/proof" className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                /proof
              </Link>
              <span className="text-[var(--text-tertiary)]"> — the 0.18s end-to-end loop demonstration</span>
            </li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
