"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { isCuitActive } from "@/cuit/funnel-state";

/** Fire a named CUIT custom event on window when the recorder is active. */
function emitCuit(name: string): void {
  if (typeof window !== "undefined" && isCuitActive()) {
    window.dispatchEvent(new CustomEvent(name));
  }
}

const API_URL = "https://cuit-saas-pilot.fly.dev";

interface SignupSuccess {
  tenant: {
    id: string;
    slug: string;
    display_name: string;
    tier: string;
    created_at: string;
  };
  initial_token: {
    token: string;
    token_prefix: string;
    label: string;
    created_at: string;
    expires_at: string | null;
  };
  getting_started_url: string;
}

interface SignupError {
  error: string;
  message?: string;
  retry_after_seconds?: number;
  issues?: unknown[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 60) || "team";
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignupSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /** Fires cuit:signupFormStarted exactly once per form mount. */
  const formStartedFired = useRef(false);

  function handleFormFocus() {
    if (!formStartedFired.current) {
      formStartedFired.current = true;
      emitCuit("cuit:signupFormStarted");
    }
  }

  // Auto-derive slug from company name unless user has typed in the slug field
  const effectiveSlug = slugTouched ? slug : slugify(companyName);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/public/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company_name: companyName,
          requested_slug: effectiveSlug,
        }),
      });
      const body = (await res.json()) as SignupSuccess | SignupError;
      if (!res.ok) {
        const err = body as SignupError;
        if (res.status === 429) {
          const mins = Math.ceil((err.retry_after_seconds ?? 3600) / 60);
          setError(`Rate limited — try again in ${mins} minutes. (3 signups per IP per hour.)`);
        } else if (res.status === 409) {
          setError(`The slug "${effectiveSlug}" is taken. Try a different one.`);
        } else if (res.status === 400 && err.issues?.length) {
          setError(`Validation: ${JSON.stringify(err.issues[0])}`);
        } else {
          setError(err.error || `HTTP ${res.status}`);
        }
        setSubmitting(false);
        return;
      }
      const success = body as SignupSuccess;
      setResult(success);
      emitCuit("cuit:signupTokenIssued");
    } catch (e) {
      setError(`Network error: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToken() {
    if (!result) return;
    await navigator.clipboard.writeText(result.initial_token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    emitCuit("cuit:quickstartCopyClicked");
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="border border-emerald-500/40 bg-emerald-500/5 rounded-lg p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-lg font-semibold text-emerald-300">
              Tenant created: {result.tenant.slug}
            </h3>
            <span className="font-mono text-xs text-[var(--text-tertiary)]">tier: {result.tenant.tier}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
            <strong className="text-amber-300">Save this token now.</strong> We
            never store it in plaintext — if you lose it, you&apos;ll have to
            rotate via the admin token endpoint (or sign up again).
          </p>
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md p-4 font-mono text-xs text-[var(--text-primary)] break-all mb-3">
            {result.initial_token.token}
          </div>
          <button
            type="button"
            onClick={copyToken}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-md hover:opacity-90 transition"
          >
            {copied ? "✓ Copied" : "Copy token to clipboard"}
          </button>
        </div>

        <div className="border border-[var(--border-color)] rounded-lg p-6">
          <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
            First request
          </h4>
          <pre className="text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-3 overflow-x-auto leading-relaxed">{`export TOKEN='${result.initial_token.token_prefix}...<paste-full-token-here>'
curl -s ${API_URL}/v1/me \\
  -H "Authorization: Bearer $TOKEN" | jq`}</pre>
          <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed">
            That returns your tenant info — proves the token works. Then follow{" "}
            <Link href="/quickstart" className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              /quickstart
            </Link>{" "}
            for the full 5-minute walkthrough.
          </p>
        </div>
      </div>
    );
  }

  return (
    // onFocus bubbles from all child inputs — fires signupFormStarted once.
    <form onSubmit={onSubmit} onFocus={handleFormFocus} className="space-y-5">
      <label className="block">
        <span className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition"
        />
        <span className="text-xs text-[var(--text-tertiary)] mt-1 block">
          Stored in your tenant settings. We won&apos;t email you (no magic-link yet) — this is for our audit log.
        </span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Company / team name
        </span>
        <input
          type="text"
          required
          maxLength={256}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Corp"
          className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Slug
        </span>
        <input
          type="text"
          required
          pattern="[a-z][a-z0-9-]{1,62}"
          minLength={2}
          maxLength={63}
          value={effectiveSlug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          placeholder="acme-corp"
          className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition"
        />
        <span className="text-xs text-[var(--text-tertiary)] mt-1 block">
          Lowercase letters, numbers, hyphens. Must start with a letter. If taken, we&apos;ll suffix with -2, -3, etc.
        </span>
      </label>

      {error && (
        <div className="border border-rose-500/40 bg-rose-500/5 rounded-md p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !email || !companyName}
        className="w-full px-4 py-3 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-md font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {submitting ? "Creating tenant…" : "Create tenant"}
      </button>

      <p className="text-xs text-[var(--text-tertiary)] text-center leading-relaxed">
        By signing up you accept the OSS{" "}
        <a
          href="https://github.com/speechlabinc/complex-ui-tester/blob/main/LICENSE"
          className="underline"
        >
          MIT license
        </a>{" "}
        and the Team-tier{" "}
        <Link href="/pricing" className="underline">
          pricing terms
        </Link>
        . No credit card; pilot week is free.
      </p>
    </form>
  );
}
