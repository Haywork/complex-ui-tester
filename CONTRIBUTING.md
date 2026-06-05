# Contributing

This repository is currently **documentation-only and in active design**. Implementation has not started; the OSS library and SaaS platform are described in the docs but not yet built.

Until v0.1 of `@cuit/core` ships, contribution means **improving the design docs**: catching errors, sharpening rationale, proposing alternatives, filling open questions.

By contributing you agree to:

- License your contributions under the same terms as the repository (MIT — see [LICENSE](./LICENSE)).
- Abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## What kinds of contributions are useful right now

| Useful | Less useful right now |
|---|---|
| Concrete bugs in the docs (wrong claim, broken link, contradicted decision) | Stylistic rewrites |
| Counter-proposals to a design decision, with rationale | "I disagree" without alternatives |
| Filling an "Open question" with evidence | Adding new open questions without context |
| Identifying gaps between docs (e.g., 03 says X, 05 says Y) | Reorganizing doc structure |
| Real-world examples from your own UI-bug-fix loop | Hypothetical scenarios with no data |
| Adapter spec contributions for vendors you use in production | Speculation about vendors no one is integrating |

---

## How to propose a change

### Small change (typo, broken link, factual fix)

Open a PR directly. Reference the doc in the title: `docs/03: fix Aurora multi-AZ claim`. Keep the diff minimal.

### Substantive change (design decision, new section, new doc)

1. **Open an issue first.** Title: `docs/NN: <short summary>`. Body should include:
   - The current claim or decision (quote it).
   - The proposed change.
   - Why — what evidence, constraint, or use case motivates it.
   - What other docs / decisions would need to update if accepted.
2. Wait for maintainer acknowledgement before opening a PR. The doc set is internally cross-linked; uncoordinated changes create contradictions.
3. Once the issue is acknowledged, open a PR that:
   - Updates the relevant doc(s).
   - Updates `last-reviewed` in the front matter to today's date.
   - Updates the decision log in [`SYSTEM_DESIGN.md §3`](./SYSTEM_DESIGN.md) if the change overrides a previous decision.
   - Adds an entry to the doc's own changelog section if the doc has one.

### New numbered doc

See [`docs/README.md` § "When to add a new doc"](./docs/README.md). Don't add a new doc without first checking that the content cannot live as a section in an existing doc.

---

## PR conventions

- **Title format:** `<doc>: <imperative summary>` — e.g., `docs/04: replace LangGraph with LangChain Expression Language`.
- **Description must answer:** What did you change? Why? What did you consider and reject?
- **One concern per PR.** Don't bundle a typo fix with a design change.
- **Cross-references:** if your change invalidates a claim in another doc, update that doc in the same PR.
- **No new dependencies** (this is a docs repo; no build system yet).

---

## Style guide

- Voice: staff-engineer. Opinionated. Evidence-backed. No marketing copy in design docs.
- Tense: present tense for current design, past tense for evidence (e.g., "Branch B locked in 8 bugs").
- Quantities: prefer concrete numbers over hedges. "p95 < 250ms" beats "fast response times".
- Diagrams: mermaid where possible; ASCII for small reference diagrams in the README.
- Markdown: GitHub-flavored. Tables liberally. Avoid deeply nested bullet lists.
- Cross-references: link by filename, e.g., `02-library-architecture.md §3.2`. Don't paraphrase what another doc says — link.
- Front matter: every numbered doc has YAML front matter with `title`, `owner`, `last-reviewed`, `status`, `related`.

---

## Review SLA

- Typos and broken links: 1 business day.
- Substantive doc changes: 5 business days from issue triage.
- New numbered docs: case-by-case; expect 2–4 weeks.

Reviewers: ryan@speechlab.ai (until additional maintainers are added).

---

## When implementation starts

Once code lands in this repo (or a successor monorepo per [`docs/02 §2`](./docs/02-library-architecture.md)), this file will be replaced by a per-package contribution guide. The expected stack:

- pnpm workspaces + Turborepo
- tsup for builds, Vitest for unit tests, Playwright for E2E
- Changesets for versioning
- TypeScript strict mode, ESLint, Prettier

Until then: docs only. No code, no test fixtures, no build config.

---

## Reporting security issues

Do **not** open public issues for security vulnerabilities. Email ryan@speechlab.ai. A PGP key will be published before public beta. See [`docs/05-security-compliance.md`](./docs/05-security-compliance.md) for the disclosure policy.
