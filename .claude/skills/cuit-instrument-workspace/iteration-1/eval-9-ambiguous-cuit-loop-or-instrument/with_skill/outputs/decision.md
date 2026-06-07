# Decision

- **DECISION:** YES
- **CONFIDENCE:** 5
- **REASONING:** The user said "set up cuit on this repo" — that is the one-time wiring task, not the closed-loop bug-reproduction task. The skill's "When to invoke" criteria match: no `window.__cuitDebug` mount, no `.github/workflows/cuit.yml` (git status shows `.github/` is brand new and untracked), and the phrase "set up" maps directly to `/cuit-instrument`. `/cuit-loop` only applies once instrumentation already exists and a session JSON is provided — neither is true here.

## First 3 Steps

1. **Precheck repo state.** Run `git status` to confirm there are no uncommitted changes (skill refuses to run on a dirty tree). The current snapshot shows modified `README.md` and many untracked files — ask the developer to commit or stash before proceeding.
2. **Verify MCP tools are available.** Confirm `cuit__detect_app_shape`, `cuit__propose_instrumentation`, and `cuit__verify_session_round_trip` are loaded. If not, stop and point to https://complex-ui-tester.vercel.app/docs/mcp.
3. **Run Step 1 — Discover.** Invoke `cuit__detect_app_shape` with cwd `/Users/ryanmedlin/speechlab/complex-ui-tester`. If `state_libs` is empty or `framework` is `"unknown"`, ask the developer the targeted follow-up questions from the skill before calling `cuit__propose_instrumentation`.
