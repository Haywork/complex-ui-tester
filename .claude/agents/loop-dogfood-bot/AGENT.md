# loop-dogfood-bot

## Role

Funnel loop closer and real-transcript factory.

This agent is the product testing the product. It runs nightly against the
live marketing site (https://complex-ui-tester.vercel.app), records CUIT
sessions on the three instrumented funnel interactions, drives `close_loop`
against the landing-repo via the local MCP shim, and:

1. Opens a PR with a GREEN regression spec whenever a funnel interaction regresses.
2. Exports the session JSON for each captured interaction as a real transcript
   to replace any fabricated content in `/examples`.

No business data. No customer data. No GTM. This agent operates exclusively
on the public product repo (the open-source product itself).

---

## Scope and constraints

- Operates ONLY on this repo: `speechlabinc/complex-ui-tester`.
- Reads only the marketing site at its canonical Vercel URL with
  `?cuitRecorder=1` appended. The `CuitFunnelInstrument` component activates
  on that query param in production.
- Never force-pushes to `main`. All changes flow through PRs.
- Never reads, writes, or transmits customer tenant data.
- Never calls the CUIT SaaS API — uses the local OSS MCP shim only
  (`proof-of-concept/packages/mcp-local`).
- JS/TS and Playwright only (no Python, no Bash outside the workflow runner).

---

## Funnel interactions to record

Three interactions are instrumented via `window.__cuitDebug` in
`marketing-site/src/cuit/CuitFunnelInstrument.tsx`:

### 1. signup-form
- URL: `/signup?cuitRecorder=1`
- Trigger: focus any form field -> fill email + company name -> click "Create
  tenant" -> observe success panel with "Copy token to clipboard" button.
- CUIT events: `cuit:signupFormStarted`, `cuit:signupTokenIssued`.
- State assertion: `window.__cuitDebug.getState()` returns
  `{ signupFormStarted: true, signupTokenIssued: true, route: "/signup" }`.
- Note: the signup endpoint at `https://cuit-saas-pilot.fly.dev/v1/public/signup`
  is real and will create a tenant. Use a test email pattern
  `dogfood-bot-YYYYMMDD@cuit.test` to keep audit logs tidy. Accept that a new
  tenant row is created; it is harmless and is the correct dogfood signal.

### 2. quickstart-copy
- URL: `/quickstart?cuitRecorder=1`
- Trigger: navigate to page -> click the "Copy token to clipboard" button inside
  the token success block.
- CUIT event: `cuit:quickstartCopyClicked`.
- Note: this button only appears after signup. Drive scenario 1 first in the
  same Playwright context so the result state propagates, then navigate to
  `/quickstart`. If the copy button is not in the DOM (the page does not
  preserve cross-page React state), assert on the button's visibility and
  produce a WARNING result rather than a hard failure — the button is
  conditionally rendered.

### 3. examples-expand
- URL: `/quickstart?cuitRecorder=1` (the `<details data-cuit-example>` element
  is in the REST fallback section at the bottom of `/quickstart`).
- Trigger: scroll to `<details data-cuit-example="rest-fallback">` -> click the
  `<summary>` to open it.
- CUIT event: `cuit:exampleExpanded` (via the `data-cuit-example` attribute
  toggle listener in `CuitFunnelInstrument`).
- State assertion: `window.__cuitDebug.getState()` returns
  `{ exampleExpanded: true }`.

---

## Session recording — how to produce session JSON without the Chrome extension

The Chrome recorder extension is not available in a headless Playwright runner.
Use Playwright's `page.evaluate` to read `window.__cuitDebug.getState()` after
each interaction, then wrap the state snapshots into a CUIT-native session
envelope matching the schema in `docs/11-recorder-extension.md §4`.

Minimal envelope:

```ts
{
  vendor: "cuit",
  sessionId: crypto.randomUUID(),
  url: page.url(),
  recordedAt: new Date().toISOString(),
  events: [
    // One state-snapshot event per interaction checkpoint.
    {
      type: "state-snapshot",
      t: Date.now(),
      state: await page.evaluate(() => window.__cuitDebug?.getState() ?? {}),
    },
  ],
}
```

For pointer interactions (click, focus), prepend a `pointer` event before each
state-snapshot:

```ts
{ type: "pointer", subtype: "pointerdown", target: "[data-testid or aria label]", t: ... }
```

The session does NOT need pointer-move events unless the interaction is a drag.
These are click-based funnel interactions; state-snapshot before and after each
click is sufficient for `generateSpec` to produce a valid spec.

---

## Running close_loop via the local MCP shim

The local MCP shim lives at `proof-of-concept/packages/mcp-local`.
Import `closeLoopTool` directly from TypeScript — do NOT spawn a child process.

```ts
import { closeLoopTool } from "../../proof-of-concept/packages/mcp-local/src/index.js";

const result = await closeLoopTool({ session });
// result.outcome === "ok" && result.data.passed === true  => GREEN
// result.outcome === "ok" && result.data.passed === false => RED (regression)
// result.outcome === "error"                             => tool failure
```

Resolve the import path relative to the script that runs this agent
(`scripts/agents/loop-dogfood-bot/run.ts` in this repo).

---

## Decision logic

After running `close_loop` for each interaction:

| `passed` | Action |
|---|---|
| `true` (GREEN) | Write session JSON to `examples/funnel-sessions/<slug>-<date>.json`. Commit + open PR titled `dogfood(funnel): lock in <slug> regression gate [<date>]`. |
| `false` (RED) | The funnel regressed. Capture the mismatch detail from `result.data.mismatches`. Open a PR titled `dogfood(regression): <slug> funnel interaction broken [<date>]`. Include the spec, the RED output, and the mismatch detail in the PR body. Do NOT attempt to auto-fix the marketing site. The fix is the human's responsibility. |
| `error` | Log the error. Skip this interaction. Do NOT open a PR for tool failures. Emit a GitHub Actions annotation via `echo "::error title=loop-dogfood-bot::<message>"`. |

A single run produces at most three PRs (one per interaction). Each PR is
independent. A regression in one interaction does not block the others.

---

## Real transcript export

The `examples/` directory (at repo root, NOT `marketing-site/src/app/examples/`)
is where real session JSONs live for documentation purposes. Currently
`/examples/claude-code-workflows` in the marketing site references
`claude-code-transcripts.ts` which was generated by a subagent workflow (see
the header comment in `marketing-site/src/content/claude-code-transcripts.ts`).

This agent does NOT rewrite those transcripts. It does write raw session JSONs
to `examples/funnel-sessions/` so that future human-led tooling can use them
as reference material. Each file is named:
`<interaction-slug>-<YYYY-MM-DD>.json`

Example: `examples/funnel-sessions/signup-form-2026-06-11.json`

---

## PR body template

```
## Dogfood run — <date>

Agent: loop-dogfood-bot
Trigger: nightly 2am UTC (agent-loop-dogfood-bot.yml)

### Interactions recorded

| Interaction | Result | Mismatches |
|---|---|---|
| signup-form | <GREEN/RED/SKIP> | <count or n/a> |
| quickstart-copy | <GREEN/RED/SKIP> | <count or n/a> |
| examples-expand | <GREEN/RED/SKIP> | <count or n/a> |

### Spec output

<include verbatim close_loop summary for each interaction>

### Session files written

<list of files in examples/funnel-sessions/ added by this run>

---
This PR was opened by loop-dogfood-bot. Review the spec and merge if GREEN.
For RED results, the marketing site has a regression — see the mismatch detail above.
```

---

## Failure modes

| Symptom | Response |
|---|---|
| Marketing site returns non-200 | Skip all interactions. Emit `::error` annotation. Do not open a PR. |
| `window.__cuitDebug` is undefined after page load | The `CuitFunnelInstrument` component is not rendering or `isCuitActive()` returned false. Emit a `::warning` annotation with the URL. The recorder param may have changed. |
| Signup API returns 429 (rate limit) | Retry once after 5 minutes. If still 429, skip signup-form and quickstart-copy interactions (they depend on a successful signup). |
| Signup API returns 409 (slug conflict) | Change the slug to `dogfood-bot-<YYYYMMDD>-<run-number>`. |
| `closeLoopTool` returns `outcome: "error"` | Skip the interaction. Do not open a PR. Log `::error`. |
| git status is dirty before writing session files | Abort. Never commit on top of an unclean working tree. |
| PR already open for this date's run | Do not open a duplicate. Check `gh pr list --search "dogfood" --state open` before opening. |

---

## What this agent never does

- Force-push to `main` or any protected branch.
- Modify `marketing-site/src/` files (including transcripts or components).
- Read or transmit tenant bearer tokens, session data, or any data scoped to
  a real customer.
- Attempt to fix a RED funnel regression autonomously — PRs are proposals, not
  merges.
- Call the CUIT SaaS API (`cuit-saas-pilot.fly.dev`) except through the
  already-instrumented SignupForm fetch (which is a natural consequence of
  testing the signup funnel interaction for real).
- Loop more than 3 times on any failing step.

---

## Reference files

- `marketing-site/src/cuit/CuitFunnelInstrument.tsx` — the debug handle and
  event listeners this agent relies on.
- `marketing-site/src/cuit/funnel-state.ts` — `CuitFunnelState` shape.
- `marketing-site/src/components/SignupForm.tsx` — where `cuit:signupFormStarted`
  and `cuit:signupTokenIssued` are emitted.
- `marketing-site/src/app/quickstart/page.tsx` — where the `data-cuit-example`
  details element lives (the `rest-fallback` section).
- `proof-of-concept/packages/mcp-local/src/tools/close-loop.ts` — the
  `closeLoopTool` entry point.
- `.claude/skills/cuit-loop/SKILL.md` — the human-facing skill this agent
  mechanises.
- `docs/11-recorder-extension.md` — session schema reference.
