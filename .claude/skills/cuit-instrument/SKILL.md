---
name: cuit-instrument
description: Wire CUIT into a customer app end-to-end. Auto-detects framework + state lib, mounts window.__cuitDebug, installs the recorder bridge, sets up the GitHub Action, and verifies with a round-trip test session. Use this when starting CUIT against a new codebase.
---

# /cuit-instrument

Companion to `/cuit-loop`. Where `cuit-loop` runs the closed loop
against an already-instrumented app, `cuit-instrument` does the
one-time wiring that makes any subsequent `cuit-loop` invocation
work.

## When to invoke

- Customer engineer typed `/cuit-instrument` explicitly.
- The current repo has no `window.__cuitDebug` mount yet.
- The current repo has no `.github/workflows/cuit.yml`.
- The CUIT MCP server reports zero sessions for this tenant.

If any of those is true and the developer asks "how do I get CUIT
working in this app?", run this skill.

## Prerequisites

- The CUIT MCP server is connected to Claude Code. Verify by
  asking Claude to list MCP tools — `cuit__detect_app_shape`,
  `cuit__propose_instrumentation`, and
  `cuit__verify_session_round_trip` must be present. If not, the
  developer must connect the MCP server first (see
  `https://complex-ui-tester.vercel.app/docs/mcp` — section "Setup").
- The customer's tenant bearer token is set in the MCP server's
  `CUIT_TENANT_TOKEN` env var.
- The customer's working directory is the root of their app
  repository (where `package.json` lives).

## Procedure

### Step 1 — Discover

Call MCP tool `cuit__detect_app_shape` with the current working
directory as the only argument. The tool returns:

```jsonc
{
  "framework": "next.js" | "vite" | "cra" | "remix" | "astro" | "unknown",
  "router": "app-router" | "pages-router" | "react-router" | ...,
  "state_libs": ["zustand"],            // detected libraries
  "ui_libs": ["react"],
  "test_runner": "vitest" | "jest" | ...,
  "pkg_manager": "pnpm" | "npm" | "yarn",
  "selectors_in_use": { "data-testid": 47 },
  "candidate_state_files": ["src/stores/playerStore.ts", ...],
  "candidate_root_files": ["src/app/layout.tsx", ...]
}
```

If `state_libs` is empty AND no candidate state file is detected,
ask the developer: "Which state library are you using? (Redux,
Zustand, Jotai, React Context, custom)". Do NOT proceed without
this answer.

If `framework` is `"unknown"`, ask the developer: "What framework
is this app on? I couldn't auto-detect."

### Step 2 — Propose

Call MCP tool `cuit__propose_instrumentation` with the app shape
from step 1. The tool returns a structured diff:

```jsonc
{
  "operations": [
    { "action": "create", "file": "src/cuit/debug.ts",
      "content": "..." },
    { "action": "create", "file": "src/cuit/recorder-bridge.tsx",
      "content": "..." },
    { "action": "edit", "file": "src/app/layout.tsx",
      "before": "...",
      "after": "..." },
    { "action": "create", "file": ".github/workflows/cuit.yml",
      "content": "..." }
  ],
  "npm_dependencies": ["@cuit/recorder", "@cuit/types"],
  "github_actions_secrets": ["CUIT_TENANT_TOKEN"],
  "estimated_minutes": 8
}
```

Present this to the developer as a summary:
- N files will be created/edited
- Dependencies added: @cuit/recorder, @cuit/types
- GitHub Action workflow: .github/workflows/cuit.yml
- Estimated time: 8 minutes

Ask: "Make these changes? (yes / show diff / edit proposal)".

- If "yes" → proceed to step 3.
- If "show diff" → display each operation in detail and re-ask.
- If "edit proposal" → discuss what to change, then call
  `cuit__propose_instrumentation` again with the developer's
  refinements as additional context.

### Step 3 — Install

For each operation in the proposal:

1. If `action: 'create'`, use the **Write** tool with the file path
   and content.
2. If `action: 'edit'`, use the **Edit** tool with the `before` and
   `after` snippets. (The proposal guarantees `before` is unique
   in the file.)

After all file ops complete:

1. Run `<pkg_manager> install` via **Bash** to install the new
   dependencies.
2. Run `<pkg_manager> typecheck` if a typecheck script exists in
   `package.json`. If it fails, present the error to the developer
   and ask whether to revert the changes.
3. Run `<pkg_manager> test --run` if a test script exists. If it
   fails, present errors. Most likely cause: a test file that
   imports something we changed; the fix is usually a small
   import update.

For the GitHub Action: if the user has the `gh` CLI installed,
offer to set the `CUIT_TENANT_TOKEN` secret via
`gh secret set CUIT_TENANT_TOKEN`. Otherwise present the exact
command and ask the developer to run it themselves.

### Step 4 — Verify

The goal: confirm the recorder bridge actually fires and the
warehouse receives a session.

1. Start the customer's dev server via **Bash** with
   `run_in_background: true`. The command is `<pkg_manager> dev`.
2. Wait until the server is reachable (poll
   `http://localhost:<port>/`). Most React frameworks default
   to port 3000 or 5173.
3. Call MCP tool `cuit__verify_session_round_trip` with:
   ```jsonc
   {
     "tenant_id": "...",  // from the MCP env
     "target_url": "http://localhost:3000/?cuitRecorder=1",
     "interaction": "click the first button or interactive element on the page"
   }
   ```
4. The tool returns:
   ```jsonc
   {
     "ok": true,
     "session_id": "uuid",
     "events_captured": 17,
     "spec_id": "uuid",
     "confidence": 0.92,
     "dashboard_url": "https://app.cuit.dev/sessions/uuid"
   }
   ```

If `ok: false`, the tool returns a `reason` and a suggested fix.
Common reasons:

- "no events captured" → the recorder bridge mount didn't fire.
  Check that `?cuitRecorder=1` was actually in the URL.
- "tenant token rejected" → the bearer token is invalid; check
  the MCP env.
- "could not reach localhost" → the dev server didn't start;
  check the customer's own dev logs.

### Step 5 — Confirm

Summarize what was done with these specifics:

- **Files changed**: list each with line counts.
- **Dependencies added**: `@cuit/recorder`, `@cuit/types`.
- **Tenant**: name + dashboard URL.
- **First generated spec**: spec_id + confidence + dashboard
  link.
- **GitHub Action**: workflow file location + the secret that
  needs to be set.

Suggest 3 next steps:

1. "Run `<pkg_manager> dev` and use the app normally with
   `?cuitRecorder=1` in the URL. Every interaction is captured."
2. "Open the dashboard at <url> to see your sessions and
   generated specs."
3. "Push a PR — the GitHub Action will gate it with a
   CUIT-generated regression spec."

End with: "Type `/cuit-loop` when you have a specific bug you
want to lock in as a regression test."

## Failure modes

| Symptom | What to do |
|---|---|
| MCP tools not available | Stop. Point the developer to https://complex-ui-tester.vercel.app/docs/mcp for setup. |
| App shape returns "unknown" | Ask the developer for framework + state lib; pass as overrides into `cuit__propose_instrumentation`. |
| Typecheck fails after edits | Revert the offending file; re-run `cuit__propose_instrumentation` with the typecheck error as additional context. |
| Round-trip session never lands | Check tenant token, dashboard URL, and network. If all look right, suggest manual recorder install. |
| Customer's dev server fails to start | Don't try to fix it. Surface the customer's error logs. Ask the developer to fix their dev server first. |
| Customer has a custom state management lib (Effector, Zustand-like) | Ask the developer for an example of how they read state in a component. Use that pattern in the `__cuitDebug` setup. |

## What this skill never does

- Modify production-bundle code without a NODE_ENV gate.
- Push to remote git without explicit developer approval.
- Run on a repo that isn't a CUIT customer's tenant (the MCP
  token gates this).
- Run if the codebase has uncommitted changes — instead,
  warn the developer and ask them to commit first.
- Try to "fix" the customer's existing test suite. Their tests
  are theirs; we add to them, not replace them.

## Calibration

A successful instrumentation:

- Took < 15 min wall-clock on a typical Next.js + Zustand app.
- Added < 200 LOC of new code.
- Added 0 LOC to production bundle (NODE_ENV gate is hard).
- Round-trip verified with confidence ≥ 0.75.
- Customer engineer agreed the diff was reasonable on
  first review (no second proposal cycle needed).

## See also

- `/cuit-loop` — the closed-loop skill that runs against an
  already-instrumented app.
- `cuit-saas/sprints/instrumentation-runbook.md` — the
  engineering design notes for this skill and its MCP tools.
- `proof-of-concept/packages/recorder/src/translate-ui-react-bridge.ts`
  — the hand-written equivalent of what auto-instrumentation
  produces.
