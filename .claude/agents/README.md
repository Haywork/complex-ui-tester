# Agent Fleet — complex-ui-tester (public OSS repo)

## Scope of this repo

This repo contains **product-CI and dogfood agents only** — agents whose job is
to build, verify, and self-test the CUIT open-source product.

**Business agents** (marketing, sales, support, GTM, customer onboarding,
billing workflows, etc.) live in the **private `cuit-internal` repo** and are
intentionally absent here. No customer data, pipeline credentials, or
revenue-sensitive automation belongs in this repo.

---

## Public agent fleet (4 agents)

### 1. `eval-gatekeeper`

| Field   | Value |
|---------|-------|
| Role    | Skill eval CI gate — blocks regressions before they merge |
| Trigger | Pull request touching `.claude/skills/**` (path filter); nightly cron `15 3 * * *`; manual `workflow_dispatch` with optional `full_benchmark` and `skill_filter` inputs |
| Workflow | `.github/workflows/agent-eval-gatekeeper.yml` |
| Agent spec | `.claude/agents/eval-gatekeeper/AGENT.md` |

**What it does.** For every PR that touches a skill's `SKILL.md` or `evals/`
directory, the gatekeeper discovers which skills changed, runs each skill's
`evals/evals.json` test cases, grades pass-rate and delta against the
iteration-1 baseline, posts a structured comment on the PR, and fails the check
if any skill regresses. The nightly schedule runs all skills with evals to catch
slow drift between PRs.

---

### 2. `release-captain`

| Field   | Value |
|---------|-------|
| Role    | Changelog generator + maturity-ladder auditor + release PR opener |
| Trigger | Push to `main`; `workflow_dispatch` for manual runs. Concurrency group `release-captain-main` ensures one run at a time — newer commit cancels the in-flight run |
| Workflow | `.github/workflows/agent-release-captain.yml` |
| Agent spec | `.claude/agents/release-captain/AGENT.md` |

**What it does.** On every merge to main the captain parses conventional commits
since the last `v*` tag, generates a changelog entry, audits the maturity ladder
(`marketing-site/src/components/MaturityLadder.tsx` and `README.md`) against
what actually ships in `proof-of-concept/packages/`, then opens a release PR.
It never pushes directly to main; a human must review and merge the release PR.

---

### 3. `readme-truth-sentinel`

| Field   | Value |
|---------|-------|
| Role    | Weekly maturity-diff auditor — catches doc claims that drift ahead of code |
| Trigger | Cron every Monday at 08:00 UTC (`0 8 * * 1`); also triggerable manually via `workflow_dispatch` |
| Workflow | `.github/workflows/agent-readme-truth-sentinel.yml` |
| Agent spec | `.claude/agents/readme-truth-sentinel/AGENT.md` |

**What it does.** Scans three categories of drift every Monday and posts
findings as a GitHub issue (or comments on an existing open one):

1. **Stale status claims** — "Shipping Now" maturity-ladder items with no
   backing package dir; README proof claims; SKILL.md status blocks that say
   "not yet run" when a results dir exists; past-due milestone dates.
2. **Placeholder literals** — `TEST_NAME`, `ASSERT_PATH`, bare `TODO`/`TBD`,
   `<insert`, unfilled token vars in shipped output files.
3. **Unbacked doc claims** — adapter list vs `packages/`; MCP tool refs in
   SKILL.md vs `mcp-local/src`; `CuitFunnelInstrument` custom events with no
   matching `dispatchEvent` caller.

A line annotated `<!-- readme-truth-sentinel: ignore -->` is silently skipped.

---

### 4. `loop-dogfood-bot`

| Field   | Value |
|---------|-------|
| Role    | Nightly funnel-loop closer — CUIT testing itself against the marketing site |
| Trigger | Nightly at 02:00 UTC (`0 2 * * *`); `workflow_dispatch` with optional `interaction` (`signup-form \| quickstart-copy \| examples-expand \| all`) and `dry_run` inputs |
| Workflow | `.github/workflows/agent-loop-dogfood-bot.yml` |
| Agent spec | `.claude/agents/loop-dogfood-bot/AGENT.md` |

**What it does.** The dogfood bot is the product (CUIT) testing the product (the
marketing site that describes CUIT). Each night it:

1. Launches a headless Playwright browser against the live marketing site with
   `?cuitRecorder=1` to activate `window.__cuitDebug`.
2. Drives three instrumented funnel interactions: signup form, quickstart copy
   button, and the examples-expand detail toggle.
3. Wraps captured state snapshots into CUIT-native session envelopes.
4. Runs `close_loop` via the local MCP shim (`proof-of-concept/packages/mcp-local`).
5. For GREEN specs: writes session JSON to `examples/funnel-sessions/` and opens
   a lock-in PR to commit the regression gate.
6. For RED specs: opens a regression PR flagging the broken funnel interaction
   with mismatch detail.

No customer data. No business data. Pure OSS product dogfood.

---

## Agent lifecycle rules

- All agents run as GitHub Actions workflows. No long-running server processes.
- Agents open PRs or issues; they never push directly to `main`.
- Secrets required by each agent are listed in the header comment of its
  workflow YAML file. All secrets live in GitHub repo-level or environment-level
  secrets — never in code.
- To add a new product-CI or dogfood agent: add an `AGENT.md` under
  `.claude/agents/<name>/` and a corresponding workflow under
  `.github/workflows/agent-<name>.yml`, then update this README.
- To add a business, GTM, or customer-facing agent: add it to `cuit-internal`.
  Do not add it here.
