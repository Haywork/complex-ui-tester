# Security Policy

The full security posture for `complex-ui-tester` — STRIDE threat model, SOC 2 control mapping, encryption posture, IR plan, sub-processor list — lives in [`docs/05-security-compliance.md`](./docs/05-security-compliance.md). This file is the short, GitHub-recognized disclosure policy.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email: **ryan@speechlab.ai**

Include:

- A description of the vulnerability.
- The product surface affected (OSS package, SaaS endpoint, web property, etc.).
- Reproduction steps. Ideally a minimal proof-of-concept.
- Your assessment of impact and exploitability.
- Whether you've disclosed this to any third party.

A PGP key for encrypted reports will be published before public beta. Until then, plain email is acceptable. If you cannot use email, request a Signal handoff in your initial message.

## Our commitments

| Timeline | Commitment |
|---|---|
| Within 2 business days | Acknowledge receipt of your report. |
| Within 5 business days | Confirm whether we accept the report as a vulnerability, request more information, or explain why we are declining. |
| Within 30 days | Ship a fix for high/critical issues (CVSS ≥ 7.0). |
| Within 90 days | Ship a fix for medium issues (CVSS 4.0–6.9). |
| At fix time | Credit the reporter publicly (unless requested otherwise). |
| At fix time | Issue a CVE for accepted vulnerabilities affecting OSS packages. |

We will not pursue legal action against good-faith security researchers who:

- Make a reasonable effort to avoid privacy violations, destruction of data, and service disruption.
- Report through this channel and give us reasonable time to fix before public disclosure (suggested: 90 days).
- Do not exfiltrate data beyond what's necessary to demonstrate the vulnerability.

## Scope

In scope:

- The OSS npm packages (`@cuit/*`), once published.
- The SaaS web property (any `*.complex-ui-tester.com` or similar).
- The SaaS API (control plane and data plane).
- The Vercel-deployed marketing site.
- The GitHub App.

Out of scope:

- Third-party session-source vendors (report to Jam / LogRocket / Sentry / FullStory / Datadog directly).
- LLM provider security (report to Anthropic / OpenAI directly).
- AWS managed-service vulnerabilities (report to AWS Security directly).
- Social engineering of our staff.
- Physical attacks.

## Bug bounty

Not currently funded. We may launch a bounty program once we cross $1M ARR. In the interim:

- Hall-of-fame credit at the time of fix.
- Swag (when available).
- Reference for résumé / portfolio.

## Sub-processors and supply chain

Our sub-processor list and supply-chain attestation (SBOM, dependency-pin policy, signing chain) is documented in [`docs/05-security-compliance.md`](./docs/05-security-compliance.md) §4–5. Concerns about a specific sub-processor or dependency can be raised via the same email channel.

## SOC 2

We are in active observation for SOC 2 Type II (target report: Q2 2027 per [`docs/09-go-to-market.md`](./docs/09-go-to-market.md) §10). To request the in-progress security packet (gap assessment, control inventory, sub-processor list, DPA template), email ryan@speechlab.ai with your company and use case.

## Disclosure history

No vulnerabilities disclosed yet — the product has not shipped. This section will be updated as items are resolved.
