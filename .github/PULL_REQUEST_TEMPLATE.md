<!--
Title format: `<scope>: <imperative summary>`
Scopes: docs/NN, docs/architecture, docs/system-design, site, ci, repo
Examples:
  docs/04: tighten model-routing rationale
  site: fix demo walkthrough scene 5 layout on mobile
  ci: add typecheck gate
-->

## What

<!-- One paragraph: what does this PR change? -->

## Why

<!-- One paragraph: why is this change necessary? Link issues if relevant. -->

## How

<!-- Bullet points: the approach. What did you consider and reject? -->

## Cross-doc impact

<!--
If this PR changes a numbered doc, list other docs that needed updating (or that you confirmed don't need updating). The docs cross-reference each other heavily.
Example:
  - docs/03 §5 references docs/04's 3-pass pipeline; no change needed.
  - docs/SYSTEM_DESIGN.md decision-log row 8 updated to reflect new model choice.
-->

## Verification

<!--
For code changes (marketing-site):
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test` (Playwright smoke) passes
- [ ] Manually opened the page; no console errors
- [ ] Deploys cleanly to Vercel preview

For doc changes:
- [ ] Front-matter `last-reviewed` bumped to today
- [ ] No broken cross-references (grep for old refs)
- [ ] If a decision changed, SYSTEM_DESIGN.md decision log updated
-->

## Checklist

- [ ] PR title follows `<scope>: <imperative summary>` format
- [ ] Only one concern per PR (typo + design change should be split)
- [ ] No emojis added to docs (per repo style)
- [ ] No new dependencies (unless absolutely required and called out below)

<!-- Mention @ryan if this needs urgent review. -->
