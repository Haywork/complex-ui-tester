export interface FAQItem {
  question: string;
  answer: string;
  docRef?: string;
  docHref?: string;
}

const GITHUB_DOCS_BASE =
  "https://github.com/speechlabinc/complex-ui-tester/blob/main/docs";

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Is the library actually MIT-licensed, or is it open core?",
    answer:
      "The harness library — every primitive in Layers 1–6, the React and Vue adapters, the Playwright runner integration — is MIT-licensed with no usage gating. You can audit the code, fork it, and ship it without ever touching our SaaS. The SaaS sits on top: it provides LLM inference, session connectors, multi-tenant cost accounting, and SOC 2 audit logging. Those are the parts you pay for, not the library.",
    docRef: "doc 01",
    docHref: `${GITHUB_DOCS_BASE}/01-product-spec.md`,
  },
  {
    question: "Do you train your models on my session data?",
    answer:
      "No. Session data is used only to generate the spec for your account, then discarded after 30 days per the retention policy. We do not use customer sessions, selectors, or spec outputs to train any model — third-party or first-party. This is a contractual commitment in every tier, not a policy-subject-to-change.",
    docRef: "doc 05",
    docHref: `${GITHUB_DOCS_BASE}/05-security-compliance.md`,
  },
  {
    question: "Can I self-host the runner?",
    answer:
      "Yes, on the Enterprise tier. The runner is a Docker container that runs LLM inference inside your VPC using your own Anthropic or Bedrock API key. No session data leaves your network. The SaaS control plane still handles metering, billing, and the GitHub App, but all inference happens on your infrastructure.",
    docRef: "doc 05",
    docHref: `${GITHUB_DOCS_BASE}/05-security-compliance.md`,
  },
  {
    question: "Does this replace Playwright or Cypress?",
    answer:
      "No — it augments your existing test runner. The output is a standard `.spec.ts` file that runs in your existing Playwright setup with no special CLI needed. The harness primitives sit alongside your existing helpers. If you already have hand-written Playwright tests, the generated specs drop in next to them in `tests/`.",
    docRef: "doc 01",
    docHref: `${GITHUB_DOCS_BASE}/01-product-spec.md`,
  },
  {
    question:
      "What if I don't use Jam or LogRocket — can I connect another tool?",
    answer:
      "We currently support Jam, LogRocket, Sentry Replay, FullStory, and Datadog RUM. FullStory and Datadog are Business-tier and above. All five normalize to the same `SessionEvent[]` schema, so swapping vendors doesn't change the spec-generation behavior. If you use a different tool, contact us — the adapter contract is public and straightforward to implement.",
    docRef: "doc 08 (planned)",
    docHref: `${GITHUB_DOCS_BASE}/README.md`,
  },
  {
    question: "How accurate are the generated specs?",
    answer:
      "Every spec ships with a confidence score. At 0.91 (the Branch B average), the spec correctly identifies the bug, grounds all selectors in your harness primitives, and produces a RED dry-run on unfixed code. Below 0.75, we don't auto-open a PR — we flag it for manual review. You should treat auto-PR'd specs the same way you'd treat a team member's first pass: review before merging.",
    docRef: "doc 04",
    docHref: `${GITHUB_DOCS_BASE}/04-ai-spec-generation.md`,
  },
  {
    question: "How much does a spec cost to generate?",
    answer:
      "Under $0.50 all-in on the 3-pass pipeline (Haiku → Sonnet → Opus), assuming ~78% prompt-cache hit rate on the tenant's selector dictionary. Prices vary with session length and selector dictionary size. This cost is bundled into your monthly plan up to your allotment; overage is charged per-spec at the rate on your tier.",
    docRef: "doc 04 §9",
    docHref: `${GITHUB_DOCS_BASE}/04-ai-spec-generation.md`,
  },
  {
    question: "What's the security posture?",
    answer:
      "We publish our full STRIDE threat model. SOC 2 Type II observation started 2026-01. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Session data is tenant-isolated at the storage and inference layers. The self-hosted Enterprise runner eliminates the cloud-inference trust surface entirely. Request the full security packet via email.",
    docRef: "doc 05",
    docHref: `${GITHUB_DOCS_BASE}/05-security-compliance.md`,
  },
  {
    question: "What's the flake rate on generated specs?",
    answer:
      "The 9 specs generated in Branch B have a 0% flake rate on Chromium, Firefox, and WebKit over the validation window. That's because generated specs call harness primitives (dispatchDrag, setClock, getStateSnapshot) rather than pixel coordinates or fragile DOM traversals. The harness layer absorbs layout changes; the test logic doesn't.",
    docRef: "doc 02",
    docHref: `${GITHUB_DOCS_BASE}/02-library-architecture.md`,
  },
  {
    question: "How long does the end-to-end pipeline take?",
    answer:
      "Under 8 minutes from session URL to open PR on median sessions (4–8 minutes long, ~200 events). Normalize + Ground passes typically complete in under 2 minutes; the Materialize pass (Opus) is the long tail at 3–5 minutes depending on spec complexity. You get a Slack/GitHub notification when the PR is ready.",
    docRef: "doc 04",
    docHref: `${GITHUB_DOCS_BASE}/04-ai-spec-generation.md`,
  },
];
