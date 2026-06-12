# 13 — Claude Code workflows (the agentic-native primary surface)

last-reviewed 2026-06-09 · ryan@speechlab.ai

How engineers actually use CUIT. The MCP server is the primary surface;
the two Claude Code skills (`/cuit-instrument` and `/cuit-loop`) are the
primary entry points. REST exists for CI integrations and as a
fallback — it is not the headline.

This doc is the canonical OSS reference. If your prospect is asking
"how does my team use this," send them here.

## 0. The thesis

Per ADR-008 (agentic-native onboarding) and ADR-010 (the loop is the
product), CUIT is shaped to be consumed by agentic coding tools:
Claude Code, Cursor, Codex, Aider, and whatever replaces them in 18
months. The substrate that survives model churn is **the feedback
loop itself** (Lance Martin, LangChain Interrupt 2026; see
[wiki/19](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/19-feedback-loops-as-the-game.md)).

What that means in practice:

1. The MCP server is how Claude *feels* CUIT during a conversation.
2. The two skills are how engineers *invoke* CUIT against their repo.
3. REST is how CI *integrates* CUIT into PR gates and dashboards.

This document covers (1) and (2). For (3) see
[docs/api](https://complex-ui-tester.vercel.app/docs/api).

## 1. The MCP server

`@cuit-saas/mcp` is a small Node binary that bridges Claude Code's
tool-use protocol to the CUIT data plane at
`https://cuit-saas-pilot.fly.dev`. One config block in your Claude
Code settings; 12 tools become available to Claude mid-conversation.

### 1.1 Install

Edit (or create) `~/.claude/mcp_servers.json`:

```jsonc
{
  "mcpServers": {
    "cuit": {
      "command": "npx",
      "args": ["-y", "@cuit-saas/mcp"],
      "env": {
        "CUIT_API_URL": "https://cuit-saas-pilot.fly.dev",
        "CUIT_TENANT_TOKEN": "<paste-your-token-here>"
      }
    }
  }
}
```

Get a token in 10 seconds at
[complex-ui-tester.vercel.app/signup](https://complex-ui-tester.vercel.app/signup).

Restart Claude Code. Type `/mcp list` — you should see `cuit` with 12
tools registered.

### 1.2 The 12 tools

| Tool | What it does | Primary skill |
|---|---|---|
| `cuit__query_sessions` | List sessions matching a predicate | both |
| `cuit__find_similar_sessions` | pgvector cosine similarity over the corpus | `/cuit-loop` |
| `cuit__flake_rate` | Per-spec 28-day flake rate | flake investigation |
| `cuit__bug_class_distribution` | Aggregate stats by bug class + component | release planning |
| `cuit__detect_app_shape` | Read customer repo, return framework + state libs | `/cuit-instrument` |
| `cuit__propose_instrumentation` | Emit structured diff for the bridge install | `/cuit-instrument` |
| `cuit__generate_spec_from_session` | Run the 3-pass LLM pipeline on a session | `/cuit-loop` |
| `cuit__run_spec` | Execute a spec against a target URL | `/cuit-loop` |
| `cuit__regression_test_for_pr` | Given a PR diff, identify sessions that gate the change | `/cuit-loop` |
| `cuit__audit_export` | Stream audit log as CSV/JSON/NDJSON | compliance |
| `cuit__verify_session_round_trip` | Confirm a fresh recorder install actually reaches the warehouse | `/cuit-instrument` |
| `cuit__list_instrumentations` | Track which apps have been instrumented and when | operator visibility |

### 1.3 What Claude sees

The MCP protocol surfaces each tool with its name, description, and
JSON schema. Claude reads this list at conversation start, then
chooses which tool to call based on your message. You don't pre-
declare "I'm going to ask about flake rates" — you say *"this spec
keeps flaking; what's our pattern?"* and Claude routes to
`cuit__flake_rate` because the description matches.

This is exactly the agentic-native surface Anthropic describes when
they talk about MCP as the convergent tool-use frontier.

## 2. The skills

Two skills ship in the OSS repo at `.claude/skills/`. They're
markdown files Claude Code reads when invoked. Each encodes a
multi-step procedure that uses the MCP tools in a specific sequence.

**A note on what is and isn't cross-tool.** The skills are
*Claude-Code-native*: a `SKILL.md` (YAML frontmatter + procedure) plus
a bundled `evals/` set, in the format Claude Code loads. The
**MCP server** — the `cuit__` tools — is the *cross-tool* surface:
because MCP is a protocol, those tools work from Claude Code, Codex,
Cursor, or any MCP client. So "works in Claude Code & Codex" is a
statement about the MCP server; the skills are the Claude Code
ergonomic layer on top of it. There is no separate "Codex skill" — a
Codex user drives the same MCP tools directly.

**How the skills are authored.** Both skills are built and iterated
with the [skill-creator](https://docs.claude.com/en/docs/claude-code/skills)
workflow: a precise, trigger-optimized `description` (the field that
decides when Claude invokes the skill), a procedure body under ~500
lines, and an `evals/` directory (`evals.json` + `assertions.md` +
`results/`) so triggering accuracy and behavior are measured, not
assumed. When we change a skill we re-run its evals rather than eyeball
it — the same closed-loop discipline the product itself sells.

### 2.1 `/cuit-instrument` — wire CUIT into a fresh app

For first-time setup on a new customer repo. Five phases:

```
Phase 1 — Detect      cuit__detect_app_shape on cwd
Phase 2 — Propose     cuit__propose_instrumentation with the shape
Phase 3 — Apply       Claude's Edit/Write tools apply the diff
Phase 4 — Verify      pnpm install + pnpm typecheck +
                      cuit__verify_session_round_trip
Phase 5 — Confirm     summary + first generated spec + dashboard URL
```

Wall-clock: 10–15 min on a typical Next.js + Zustand app. The
SpeechLab waveform editor (translate-ui-react) was instrumented in
8 minutes; the bridge code at
[`@cuit/recorder/translate-ui-react-bridge`](../proof-of-concept/packages/recorder/src/translate-ui-react-bridge.ts)
is the reference pattern.

See the full skill source at
[`.claude/skills/cuit-instrument/SKILL.md`](../.claude/skills/cuit-instrument/SKILL.md).

Public example with the actual generated diff:
[`/examples/speechlab-waveform`](https://complex-ui-tester.vercel.app/examples/speechlab-waveform).

### 2.2 `/cuit-loop` — close the loop on a captured session

For every-day work after instrumentation lands. Triggered when you
have a session JSON (from the Chrome extension or the in-app bridge)
and want CUIT to:

1. Generate a Playwright/Vitest spec via the 3-pass LLM pipeline
2. Run the spec against your app
3. Auto-detect which flow you're in:
   - **Flow A — bug reproduction**: spec fails first run (RED). Claude
     walks diagnose → fix → re-run until GREEN.
   - **Flow B — baseline lock-in**: spec passes first run (GREEN).
     Claude commits it as a permanent regression gate.

You don't choose the flow. The skill detects from the first run
outcome. This is the [ADR-003 two-flows](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/22-adr-003-two-flows.md)
decision in action.

See the full skill source at
[`.claude/skills/cuit-loop/SKILL.md`](../.claude/skills/cuit-loop/SKILL.md).

## 3. Five real conversation patterns

Concrete examples of what Claude Code sessions look like with CUIT
loaded. These are real workflow shapes drawn from production usage
at SpeechLab and design partners.

### 3.1 Segment-drag regression (Flow A)

> *User reports the segment-drag bug is back in production. Pull a
> matching session from the corpus, generate the regression spec,
> reproduce the bug, propose the fix, gate the regression.*

Tools called in sequence: `cuit__find_similar_sessions` →
`cuit__generate_spec_from_session` → `cuit__run_spec` (RED) → Claude
proposes a code change → `cuit__run_spec` (GREEN) → PR opened
with the spec attached.

Full transcript:
[`/examples/claude-code-workflows#segment-drag-regression`](https://complex-ui-tester.vercel.app/examples/claude-code-workflows#segment-drag-regression).

### 3.2 Fresh Next.js instrumentation

> *Tech lead at a fintech, fresh Next.js 16 + Zustand dashboard,
> never touched CUIT before. Runs `/cuit-instrument` and watches the
> 5 phases execute.*

Tools: `cuit__detect_app_shape` → `cuit__propose_instrumentation` →
(Edit/Write/Bash) → `cuit__verify_session_round_trip`.

Full transcript:
[`/examples/claude-code-workflows#instrument-fresh-nextjs-app`](https://complex-ui-tester.vercel.app/examples/claude-code-workflows#instrument-fresh-nextjs-app).

### 3.3 Flake investigation

> *Spec is 30% flaky in CI. Engineer asks Claude to correlate against
> the corpus and propose root cause.*

Tools: `cuit__flake_rate` → `cuit__find_similar_sessions` →
`cuit__bug_class_distribution` → Claude proposes a hypothesis from the
correlated pattern (viewport mismatch, animation timing, etc) and a
targeted fix.

Full transcript:
[`/examples/claude-code-workflows#flake-investigation`](https://complex-ui-tester.vercel.app/examples/claude-code-workflows#flake-investigation).

### 3.4 Gate this PR

> *Eng manager reviewing a teammate PR. Asks "are there sessions in
> our corpus this PR could break?"*

Tools: `cuit__regression_test_for_pr` (parses the diff, finds
sessions touching changed components) → `cuit__find_similar_sessions`
→ `cuit__run_spec` against the PR branch.

Full transcript:
[`/examples/claude-code-workflows#gate-this-pr`](https://complex-ui-tester.vercel.app/examples/claude-code-workflows#gate-this-pr).

### 3.5 SOC 2 audit export

> *Compliance lead pulling Q1 audit evidence. Asks Claude to export
> the audit log as CSV grouped by action.*

Tools: `cuit__audit_export` with date range + format. Claude formats
the result, suggests follow-up queries (e.g., "show me all
spec.merged actions by reviewer in Q1").

Full transcript:
[`/examples/claude-code-workflows#audit-export-for-soc2`](https://complex-ui-tester.vercel.app/examples/claude-code-workflows#audit-export-for-soc2).

## 4. When to use the REST API instead

Three cases where REST beats MCP:

1. **CI integrations.** Your GitHub Actions workflow calls
   `POST /v1/sessions` directly when a contributor runs the recorder
   in dev mode. No Claude Code in CI; the REST surface is the only
   option.
2. **Restricted networks.** Some enterprise environments block
   Claude Code's outbound MCP connection but allow scoped HTTPS to
   `cuit-saas-pilot.fly.dev`. REST still works.
3. **Custom integrations.** Building a Slack bot, a Datadog
   dashboard, or a Backstage plugin? REST is the right surface for
   non-agentic toolchains.

For all three cases see [docs/api](https://complex-ui-tester.vercel.app/docs/api).
21 endpoints, OpenAPI 3.0 spec, codegen-ready.

## 5. Coming next

| Surface | Status | Notes |
|---|---|---|
| `npx @cuit/init` CLI | planned | Compress the 8-step manual bridge install into a 60-second command. Browser device-code auth (`gh auth login` pattern). |
| CDN-bundled `recorder.js` IIFE | planned | Two script tags for legacy/WP/Rails. Tier 2 install path. |
| Cursor + Codex MCP support | shipping | The MCP server is protocol-pure; should work today. Tested with Cursor 0.50+; Codex testing in progress. |
| Voyage-3-lite embedding upgrade | shipping | Already runs in production; backfill against the SpeechLab corpus next week. |
| Self-healing selectors | sprint week 9 | Reflect/Mabl-borrow per [wiki/39](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/39-competitor-features-to-borrow.md). |

## 6. Three positioning pillars (always)

Every page, every doc, every demo, every customer call leads with
these three. The MCP + skills surface is how they manifest in code.

1. **The feedback loop is the durable substrate.** Lance Martin's
   thesis. Verifier's Law. Model-invariant infrastructure beats
   model-specific apps. CUIT is the loop substrate for UI; see
   [wiki/19](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/19-feedback-loops-as-the-game.md)
   and [wiki/27](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/27-adr-010-loop-is-the-product.md).
2. **Ease of integration is the moat.** Y Combinator framing for AI
   infra. Companies that compress integration time from days to
   minutes win distribution. CUIT's MCP-first design is a literal
   instantiation; see
   [wiki/26](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/26-adr-009-ease-of-integration-as-moat.md).
3. **Claude Code is the primary surface.** MCP + skills ship before
   REST. Customers reach for us because they live in Claude Code
   already; see
   [wiki/25](https://github.com/speechlabinc/cuit-internal/blob/main/wiki/25-adr-008-agentic-native-onboarding.md).

## 7. Sources

[1] Lance Martin, "Context Engineering for Agents," 2025 —
    [rlancemartin.github.io/2025/06/23/context_engineering](https://rlancemartin.github.io/2025/06/23/context_engineering/)
[2] LangChain Interrupt 2026: LangSmith Engine announcement
[3] Anthropic Model Context Protocol — [anthropic.com/news/model-context-protocol](https://anthropic.com/news/model-context-protocol)
[4] CUIT MCP server source — `cuit-saas/packages/mcp/src/index.ts`
[5] `/cuit-instrument` skill — `.claude/skills/cuit-instrument/SKILL.md`
[6] `/cuit-loop` skill — `.claude/skills/cuit-loop/SKILL.md`
[7] Five conversation transcripts — `/examples/claude-code-workflows`
