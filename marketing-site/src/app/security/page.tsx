import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description:
    "STRIDE threat model, SOC 2 Type II in observation, customer-cloud runner option, tenant isolation, data classification. Request the full security packet.",
};

const COMMITMENTS = [
  {
    title: "Zero customer data in model training",
    detail:
      "Session data is used only to generate the spec for your account, then discarded per the retention policy. We do not use customer sessions, selectors, or spec outputs to train any model — first-party or third-party.",
    ref: "doc 05 §4",
  },
  {
    title: "Encryption at rest and in transit",
    detail:
      "AES-256 at rest with per-tenant KMS CMKs (Enterprise). TLS 1.3 in transit. Connector tokens stored in AWS Secrets Manager with 90-day rotation.",
    ref: "doc 05 §2",
  },
  {
    title: "Tenant isolation at the storage and inference layers",
    detail:
      "Aurora row-level security with per-request `app.current_tenant_id` GUC. S3 per-tenant prefix with separate KMS keys. SQS FIFO queue per tenant for the runner. LLM prompts include tenant-scoped context only.",
    ref: "doc 05 §1, doc 03 §3",
  },
  {
    title: "Customer-cloud runner for Enterprise",
    detail:
      "Self-hosted Docker runner in your VPC, using your own Anthropic or Bedrock API keys. Session data never leaves your network. The SaaS control plane handles metering and billing only.",
    ref: "doc 05 §6",
  },
  {
    title: "Prompt-injection defense",
    detail:
      "Session DOM content is treated as untrusted. AST validation rejects generated specs that call non-primitive APIs. Prompt context is structurally separated from session content.",
    ref: "doc 04 §6, doc 05 §1",
  },
  {
    title: "Append-only audit log per tenant",
    detail:
      "Every action against your data is logged immutably and exportable. Available via dashboard and API. Retention configurable per tier.",
    ref: "doc 05 §3",
  },
];

const STRIDE = [
  { actor: "Malicious tenant", attack: "Cross-tenant session read", mitigation: "RLS + tenant_id GUC, IDOR fuzz in CI" },
  { actor: "Malicious tenant", attack: "Spec tampering via API", mitigation: "Object-level authz middleware, integration tests" },
  { actor: "Malicious insider", attack: "Token exfiltration", mitigation: "Break-glass via 1Password + AWS SSO, audit-logged" },
  { actor: "Compromised connector token", attack: "Read customer sessions", mitigation: "90-day rotation, anomaly detection, soft revoke" },
  { actor: "Supply-chain attacker", attack: "Backdoored dependency", mitigation: "SBOM, exact-pinned deps, signed releases via Sigstore" },
  { actor: "Prompt-injection in session", attack: "Coerce model to emit malicious spec", mitigation: "AST validation against primitive registry, isolated prompt context" },
];

export default function SecurityPage() {
  return (
    <SiteShell>
      <section className="pt-12 pb-12 md:pt-20 md:pb-16 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Security &amp; compliance
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 max-w-3xl">
            The security posture is the product.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-6">
            You pay us in part to hold a SOC 2 Type II report so you don&apos;t
            have to. The full posture lives in doc 05 — this page is the
            one-pager that gets it into your procurement workflow.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="mailto:ryan@speechlab.ai?subject=complex-ui-tester%20security%20packet"
              className="inline-flex items-center"
            >
              <Button variant="primary" size="md">
                Request the security packet
              </Button>
            </Link>
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/05-security-compliance.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-md)] border border-[var(--border-color)] hover:border-[var(--color-mute-4)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
            >
              Read doc 05 ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Status row */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["SOC 2 Type II", "In observation", "warning"],
              ["GDPR / DPA", "Available", "success"],
              ["HIPAA", "Roadmap Q3 2027", "default"],
              ["Pen test", "Annual + on-release", "success"],
            ].map(([title, status, variant]) => (
              <div
                key={title}
                className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                  {title}
                </div>
                <Badge
                  variant={variant as "success" | "warning" | "default"}
                >
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Our commitments
            </h2>
            <p className="text-[var(--text-secondary)]">
              Contractual, not aspirational. Each ties to a section of doc 05.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMITMENTS.map((c) => (
              <div
                key={c.title}
                className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="text-green-400 mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {c.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                  {c.detail}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {c.ref}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STRIDE summary */}
      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
              STRIDE summary
            </h2>
            <p className="text-[var(--text-secondary)]">
              The threat model we hold ourselves to. Full STRIDE matrix is
              in doc 05 §1.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                    Actor
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                    Attack path
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                    Mitigation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {STRIDE.map((row) => (
                  <tr key={`${row.actor}-${row.attack}`}>
                    <td className="py-3 px-4 font-mono text-xs text-[var(--text-primary)] align-top">
                      {row.actor}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] align-top">
                      {row.attack}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] align-top">
                      {row.mitigation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
            Reporting a vulnerability
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            Do not file a public GitHub issue for security vulnerabilities.
            Email{" "}
            <Link
              href="mailto:ryan@speechlab.ai"
              className="text-[var(--color-accent)] hover:underline"
            >
              ryan@speechlab.ai
            </Link>{" "}
            with reproduction steps and impact assessment. We acknowledge within
            2 business days and ship fixes for critical issues within 30 days.
            See{" "}
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              SECURITY.md
            </Link>{" "}
            for the full disclosure policy.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
