const GITHUB_BLOB =
  "https://github.com/speechlabinc/complex-ui-tester/blob/main";

export interface DocEntry {
  number: string;
  slug: string;
  title: string;
  description: string;
  audience: string;
  href: string;
  status: "shipping" | "draft";
}

export const DOCS: DocEntry[] = [
  {
    number: "01",
    slug: "01-product-spec",
    title: "Product Spec",
    description:
      "The PRD. Problem, evidence, goals, non-goals, competitive posture, pricing surface, year-1 plan.",
    audience: "Customers, design partners, investors",
    href: `${GITHUB_BLOB}/docs/01-product-spec.md`,
    status: "shipping",
  },
  {
    number: "02",
    slug: "02-library-architecture",
    title: "Library Architecture",
    description:
      "How the OSS library is built. Monorepo layout, package boundaries, harness primitives, framework-agnostic core.",
    audience: "OSS contributors, library consumers",
    href: `${GITHUB_BLOB}/docs/02-library-architecture.md`,
    status: "shipping",
  },
  {
    number: "03",
    slug: "03-saas-platform",
    title: "SaaS Platform",
    description:
      "The SaaS architecture on AWS. Control plane, data plane, multi-tenant isolation, GitHub App, billing.",
    audience: "Platform engineers, infra reviewers",
    href: `${GITHUB_BLOB}/docs/03-saas-platform.md`,
    status: "shipping",
  },
  {
    number: "04",
    slug: "04-ai-spec-generation",
    title: "AI / Spec-Generation Pipeline",
    description:
      "The 3-pass LLM pipeline. Model routing, prompt caching, harness-primitive grounding, confidence scoring, eval harness.",
    audience: "ML infra engineers, applied AI leads",
    href: `${GITHUB_BLOB}/docs/04-ai-spec-generation.md`,
    status: "shipping",
  },
  {
    number: "05",
    slug: "05-security-compliance",
    title: "Security & Compliance",
    description:
      "STRIDE threat model, SOC 2 Type II control mapping, customer-cloud runner, encryption, IR plan.",
    audience: "Customer security teams, auditors",
    href: `${GITHUB_BLOB}/docs/05-security-compliance.md`,
    status: "shipping",
  },
  {
    number: "06",
    slug: "06-operations-sre",
    title: "Operations & SRE",
    description:
      "SLOs, on-call rotation, deployment pipeline, capacity planning, runbooks, backup/DR, GA milestones.",
    audience: "SRE, on-call engineers",
    href: `${GITHUB_BLOB}/docs/06-operations-sre.md`,
    status: "shipping",
  },
  {
    number: "07",
    slug: "07-data-platform-and-feedback-loops",
    title: "Data Platform & Feedback Loops",
    description:
      "The moat doc. Per-tenant data assets, RAG retrieval, weekly tuning cycle, cross-tenant insights. Why customers pay.",
    audience: "Platform engineers, prospective customers",
    href: `${GITHUB_BLOB}/docs/07-data-platform-and-feedback-loops.md`,
    status: "shipping",
  },
  {
    number: "08",
    slug: "08-customer-experience",
    title: "Customer Experience & Product Surface",
    description:
      "Personas, end-to-end journey, dashboard wireframes, CLI, GitHub App, notifications, onboarding, RBAC, accessibility.",
    audience: "PM, design, customer success",
    href: `${GITHUB_BLOB}/docs/08-customer-experience.md`,
    status: "shipping",
  },
  {
    number: "09",
    slug: "09-go-to-market",
    title: "Go-to-Market",
    description:
      "Positioning, ICP, pricing tiers, design-partner motion, marketing channels, funnel, competitive landscape, hiring.",
    audience: "Founders, GTM hires",
    href: `${GITHUB_BLOB}/docs/09-go-to-market.md`,
    status: "shipping",
  },
  {
    number: "10",
    slug: "10-adapter-spec",
    title: "Adapter / Connector Spec",
    description:
      "Per-vendor integration spec for Jam, LogRocket, Sentry Replay, FullStory, Datadog RUM. Endpoints, payloads, normalization, quirks.",
    audience: "Adapter implementers, vendor partners",
    href: `${GITHUB_BLOB}/docs/10-adapter-spec.md`,
    status: "shipping",
  },
  {
    number: "11",
    slug: "11-recorder-extension",
    title: "First-Party Recorder & Chrome Extension",
    description:
      "The closed-loop input edge. Why first-party beats third-party for the agent loop, MV3 architecture, captured event surface, programmatic API, three integration patterns including local-agent endpoint and MCP server roadmap.",
    audience: "Engineers integrating the recorder, agentic-coding integrators",
    href: `${GITHUB_BLOB}/docs/11-recorder-extension.md`,
    status: "shipping",
  },
  {
    number: "12",
    slug: "12-qa-data-warehouse",
    title: "QA Data Warehouse",
    description:
      "What the SaaS centralizes — the org-wide queryable corpus of sessions, specs, runs, bug-classes, and signals. Six entity classes, REST API, eight-tool MCP server for Claude Code / Cursor / Aider mid-task investigation. The OSS-vs-SaaS buy-vs-build line.",
    audience: "Engineering leaders evaluating the SaaS, integration engineers",
    href: `${GITHUB_BLOB}/docs/12-qa-data-warehouse.md`,
    status: "shipping",
  },
];

export const TOP_LEVEL_DOCS = [
  {
    name: "README",
    description: "Project front door — start here.",
    href: `${GITHUB_BLOB}/README.md`,
  },
  {
    name: "ARCHITECTURE",
    description: "Top-level architecture summary.",
    href: `${GITHUB_BLOB}/ARCHITECTURE.md`,
  },
  {
    name: "SYSTEM_DESIGN",
    description: "Cross-doc map and decision log.",
    href: `${GITHUB_BLOB}/SYSTEM_DESIGN.md`,
  },
  {
    name: "ROADMAP",
    description: "Consolidated Y1/Y2/Y3 milestones.",
    href: `${GITHUB_BLOB}/ROADMAP.md`,
  },
  {
    name: "SECURITY",
    description: "Vulnerability disclosure policy.",
    href: `${GITHUB_BLOB}/SECURITY.md`,
  },
  {
    name: "CONTRIBUTING",
    description: "How to propose changes.",
    href: `${GITHUB_BLOB}/CONTRIBUTING.md`,
  },
  {
    name: "CODE_OF_CONDUCT",
    description: "Contributor Covenant.",
    href: `${GITHUB_BLOB}/CODE_OF_CONDUCT.md`,
  },
];
