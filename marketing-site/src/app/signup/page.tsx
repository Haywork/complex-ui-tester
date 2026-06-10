import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up — Get Your CUIT Token in 10 Seconds",
  description:
    "Self-service CUIT tenant provisioning for Claude Code UI testing. Email + company name gets you a bearer token instantly. No sales call, no credit card.",
  keywords: [
    "CUIT sign up",
    "claude code ui testing",
    "agentic ui test generation",
    "mcp server ui regression",
    "UI feedback loop",
    "closed loop verification for agents",
    "free tier",
  ],
  openGraph: {
    title: "Sign Up — Get Your CUIT Token in 10 Seconds | CUIT",
    description:
      "Self-service CUIT tenant provisioning for Claude Code UI testing. Email + company name gets you a bearer token instantly. No sales call, no credit card.",
  },
};

export default function SignupPage() {
  return (
    <SiteShell>
      <section className="pt-12 pb-10 md:pt-20 md:pb-14 border-b border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Sign up
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
            Get your tenant token. 10 seconds.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-3">
            No magic-link email. No credit card. No sales call. Fill the form, copy
            the token, hit the API.
          </p>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            You&apos;re creating a Team-tier tenant. Upgrade paths and SSO live
            in the operator console (sales-led for now). The Team tier covers
            unlimited specs + the data warehouse for the SpeechLab pilot week.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <SignupForm />
        </div>
      </section>

      <section className="py-10 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-base font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            What happens when you click Create
          </h2>
          <ol className="text-sm text-[var(--text-secondary)] space-y-2 leading-relaxed list-decimal pl-5">
            <li>Browser POSTs to <code className="font-mono text-xs">https://cuit-saas-pilot.fly.dev/v1/public/signup</code></li>
            <li>API creates a row in <code className="font-mono text-xs">tenants</code> table with your slug + tier=team</li>
            <li>API generates a 32-byte hex bearer token (<code className="font-mono text-xs">cuit_tk_...</code>)</li>
            <li>API writes an audit_log entry recording the self-signup</li>
            <li>API returns the token to your browser — once. We never store it in plaintext.</li>
            <li>You see the token below with a copy button. Save it now.</li>
          </ol>
          <p className="text-xs text-[var(--text-tertiary)] mt-6 leading-relaxed">
            Rate limited to 3 signups per IP per hour to keep things tidy. If
            you need more, ping{" "}
            <a href="mailto:ryan@speechlab.ai" className="underline">
              ryan@speechlab.ai
            </a>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
