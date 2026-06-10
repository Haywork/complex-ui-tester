export interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  /** One-line, problem-led summary. */
  description: string;
  /** The pain this tier removes — written in the buyer's own words. */
  problem: string;
  /** Two-line "what you stop having to do." */
  stopDoing: string[];
  /** Two-line "what becomes possible." */
  startDoing: string[];
  /** Who this tier is actually for. */
  whoFor: string;
  /** Plain-language deliverables — no jargon. Used in card body. */
  outcomes: string[];
  /** Backwards-compat: still listed in the detailed matrix. */
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  overageRate: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "oss",
    name: "OSS",
    price: "$0",
    priceNote: "Free forever — MIT licensed",
    description:
      "Use the harness in your own repo. No SaaS, no account, no telemetry.",
    problem:
      "You write your own Playwright tests for a complex UI — but your tests flake, depend on pixel coordinates, and break every time CSS changes. You want better primitives. You don't want to pay a SaaS to get them.",
    stopDoing: [
      "Writing page.mouse.click(412, 89) and hoping it doesn't move",
      "Sprinkling waitForTimeout(500) because rAF timing is unreliable",
    ],
    startDoing: [
      "Calling dispatchDrag('seg-0', 100, 0) — semantic, no pixels",
      "Calling setClock(0) — deterministic, no sleeps",
    ],
    whoFor:
      "Individual developers and small teams who want stable primitives for their own test suite. The library is yours forever; fork it if you want.",
    outcomes: [
      "Deterministic Playwright/Vitest specs for your complex UI",
      "First-party Chrome recorder you can install today",
      "Zero CI flake on specs that use the harness primitives",
      "MIT licensed — your code, your repo, your control",
    ],
    features: [
      "@cuit/harness — all 6 layers",
      "dispatchDrag, dispatchResize, seekTo",
      "State snapshot via getStateSnapshot()",
      "Deterministic clock (setClock / tick)",
      "DOM mutation + CSS observer invariants",
      "Vitest + Playwright adapter",
      "Community support (GitHub Issues)",
    ],
    cta: "Start free — unlimited specs",
    ctaHref: "/signup",
    highlighted: false,
    overageRate: "—",
  },
  {
    id: "team",
    name: "Team",
    price: "$499",
    priceNote: "/ month — unlimited specs, UI Intelligence Chat included",
    description:
      "Close the loop for your AI coding tools. Unlimited recorded sessions → unlimited generated specs → unlimited regression gates. Plus a natural-language chat over the whole QA corpus.",
    problem:
      "Your team uses Claude Code, Codex, or Cursor every day. They write UI code that compiles and type-checks, but you have no way to verify the UI actually behaves correctly. The same bugs keep reopening because no one writes regression tests by hand anymore.",
    stopDoing: [
      "Hand-translating session replays into Playwright specs (2-6 hours each)",
      "Watching the same bug reopen six weeks later because no regression net",
      "Counting specs and engineering around a monthly cap",
    ],
    startDoing: [
      "Capture a bug in the Chrome recorder → paste JSON into Claude Code → get a PR with a working spec",
      "Generate as many regression specs as your team can record — no cap, no overage",
      "Ask the UI Intelligence Chat: 'Show me every session where drag failed this month' — in plain English",
    ],
    whoFor:
      "Engineering teams of 5-30 shipping complex UI surfaces (editors, design tools, dashboards) where AI coding tools write a meaningful fraction of the UI code.",
    outcomes: [
      "Unlimited generated specs — every recorded session can become a CI gate",
      "UI Intelligence Chat — natural-language queries over your tenant's session, spec, run, and bug-class corpus",
      "Claude Code and Codex get a deterministic feedback signal on UI work",
      "Auto-PR'd specs at confidence ≥ 0.75, manual review below",
      "GitHub App + Slack notifications + per-tenant prompt context",
    ],
    features: [
      "Everything in OSS",
      "Unlimited spec generation — no cap, no overage",
      "UI Intelligence Chat — query the QA corpus in plain English",
      "First-party Chrome recorder (no vendor lock-in)",
      "Selector dictionary (unlimited entries on Team and above)",
      "Confidence scoring + auto-PR at 0.75+",
      "GitHub App integration",
      "Up to 5 seats",
      "Fair-use only — no per-spec billing",
    ],
    cta: "Get your free token",
    ctaHref: "/signup",
    highlighted: true,
    overageRate: "—",
  },
  {
    id: "business",
    name: "Business",
    price: "$2,500",
    priceNote: "/ month — unlimited specs, full connector coverage, SOC 2",
    description:
      "Everything in Team, plus all five session sources, the SOC 2 report procurement wants, and the audit log your SIEM expects.",
    problem:
      "You're a Series B/C company with 30+ engineers. Your CI flake rate is destroying confidence. Procurement is asking for SOC 2 before they'll sign. You've decided you need a real regression net, and you need it before the next release.",
    stopDoing: [
      "Quarantining flaky tests instead of fixing them",
      "Answering security questionnaires by hand — every customer asks the same things",
    ],
    startDoing: [
      "Capture sessions from any of five vendors (Jam, LogRocket, Sentry, FullStory, Datadog RUM) plus the first-party recorder",
      "Hand procurement the SOC 2 report and move on with your day",
      "Stream audit events into your existing SIEM with the same retention you use elsewhere",
    ],
    whoFor:
      "Engineering organizations at 30-150 headcount where flake and reopen rates have become a real business cost, and where customer security teams expect a SOC 2 report on request.",
    outcomes: [
      "Unlimited specs, unlimited UI Intelligence Chat queries, all five session sources supported",
      "SOC 2 Type II report — same packet you give your auditors",
      "Audit log exportable to your SIEM (S3 / BigQuery / Datadog)",
      "99.5% uptime SLA with credits",
      "Bug-class corpus training tuned to your UI's patterns",
    ],
    features: [
      "Everything in Team",
      "All 5 connectors (+ FullStory, Datadog RUM)",
      "Bug-class corpus training (custom to your UI)",
      "SOC 2 report on request",
      "Audit log export (S3 / BigQuery)",
      "Up to 25 seats",
      "99.5% uptime SLA",
      "Fair-use only — no per-spec billing",
    ],
    cta: "Talk to us",
    ctaHref:
      "mailto:ryan@speechlab.ai?subject=complex-ui-tester%20Business",
    highlighted: false,
    overageRate: "—",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceNote: "Starts at $40k / year — talk to us",
    description:
      "Your user session data never leaves your VPC. Bring your own LLM keys. Sign a custom MSA.",
    problem:
      "You ship a product that handles PHI, PII, or financial data. Your security team will not allow user-session data to be processed in someone else's cloud. You need a single-tenant deployment, your own Anthropic/Bedrock keys, and a procurement-class contract.",
    stopDoing: [
      "Telling your security team why a third-party processor is fine (it isn't)",
      "Forcing your developers to skip session replay entirely on regulated surfaces",
    ],
    startDoing: [
      "Run the runner inside your VPC with your own Anthropic / Bedrock keys",
      "Sign a custom MSA + DPA + BAA before any data is processed",
    ],
    whoFor:
      "Companies in regulated industries — healthcare, finance, government, defense — where user-session data is subject to compliance constraints that rule out third-party SaaS by default.",
    outcomes: [
      "Self-hosted runner — session data never leaves your VPC",
      "Your own Anthropic / Bedrock keys, your own billing relationship",
      "SAML SSO, SCIM, custom retention, custom DPA / MSA / BAA",
      "Up to 99.9% SLA with custom credit terms",
      "Dedicated success engineer + private Slack",
    ],
    features: [
      "Everything in Business",
      "Self-hosted runner option (VPC-isolated)",
      "Unlimited connectors + custom adapter SDK",
      "SAML SSO + SCIM provisioning",
      "Custom data retention policy",
      "Dedicated Slack / Zoom support",
      "Unlimited specs — uses your own Anthropic / Bedrock keys",
      "Custom SLA up to 99.9%",
    ],
    cta: "Talk to procurement",
    ctaHref:
      "mailto:ryan@speechlab.ai?subject=complex-ui-tester%20Enterprise%20procurement",
    highlighted: false,
    overageRate: "—",
  },
];

export interface PricingFeatureRow {
  feature: string;
  oss: string | boolean;
  team: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
  category: string;
}

export const PRICING_FEATURE_MATRIX: PricingFeatureRow[] = [
  // Harness
  {
    feature: "OSS harness library (@cuit/harness)",
    oss: true,
    team: true,
    business: true,
    enterprise: true,
    category: "Harness",
  },
  {
    feature: "Harness primitives (Layers 1–6)",
    oss: true,
    team: true,
    business: true,
    enterprise: true,
    category: "Harness",
  },
  {
    feature: "React + Vue adapters",
    oss: true,
    team: true,
    business: true,
    enterprise: true,
    category: "Harness",
  },
  // Spec generation
  {
    feature: "LLM spec generation (3-pass pipeline)",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Spec Generation",
  },
  {
    feature: "Confidence scoring",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Spec Generation",
  },
  {
    feature: "Auto-PR on confidence ≥ 0.75",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Spec Generation",
  },
  {
    feature: "AST validation (no hallucinated selectors)",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Spec Generation",
  },
  {
    feature: "Spec generation volume",
    oss: "—",
    team: "Unlimited",
    business: "Unlimited",
    enterprise: "Unlimited",
    category: "Spec Generation",
  },
  {
    feature: "UI Intelligence Chat (NL queries over the corpus)",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Spec Generation",
  },
  // Connectors
  {
    feature: "Jam connector",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Connectors",
  },
  {
    feature: "LogRocket connector",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Connectors",
  },
  {
    feature: "Sentry Replay connector",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Connectors",
  },
  {
    feature: "FullStory connector",
    oss: false,
    team: false,
    business: true,
    enterprise: true,
    category: "Connectors",
  },
  {
    feature: "Datadog RUM connector",
    oss: false,
    team: false,
    business: true,
    enterprise: true,
    category: "Connectors",
  },
  // Infrastructure
  {
    feature: "Selector dictionary",
    oss: false,
    team: "Unlimited",
    business: "Unlimited",
    enterprise: "Unlimited",
    category: "Infrastructure",
  },
  {
    feature: "Bug-class corpus (custom)",
    oss: false,
    team: false,
    business: true,
    enterprise: true,
    category: "Infrastructure",
  },
  {
    feature: "Self-hosted runner",
    oss: false,
    team: false,
    business: false,
    enterprise: true,
    category: "Infrastructure",
  },
  // Compliance
  {
    feature: "SOC 2 Type II report",
    oss: false,
    team: false,
    business: "On request",
    enterprise: true,
    category: "Compliance",
  },
  {
    feature: "Audit log export",
    oss: false,
    team: false,
    business: "S3 / BigQuery",
    enterprise: true,
    category: "Compliance",
  },
  {
    feature: "SAML SSO + SCIM",
    oss: false,
    team: false,
    business: false,
    enterprise: true,
    category: "Compliance",
  },
  // Support
  {
    feature: "Community support",
    oss: true,
    team: true,
    business: true,
    enterprise: true,
    category: "Support",
  },
  {
    feature: "Email support",
    oss: false,
    team: true,
    business: true,
    enterprise: true,
    category: "Support",
  },
  {
    feature: "Uptime SLA",
    oss: "—",
    team: "—",
    business: "99.5%",
    enterprise: "Up to 99.9%",
    category: "Support",
  },
  {
    feature: "Dedicated Slack / Zoom",
    oss: false,
    team: false,
    business: false,
    enterprise: true,
    category: "Support",
  },
];
