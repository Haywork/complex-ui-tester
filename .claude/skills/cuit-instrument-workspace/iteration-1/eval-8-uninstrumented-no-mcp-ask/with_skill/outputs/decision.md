# Decision

- **DECISION:** NO (blocked until MCP is connected) — but unblockable in minutes.
- **CONFIDENCE:** 5
- **REASONING:** The `/cuit-instrument` skill lists the CUIT MCP server as a hard prerequisite — it relies on `cuit__detect_app_shape`, `cuit__propose_instrumentation`, and `cuit__verify_session_round_trip` to discover the app, generate the diff, and verify the round-trip. Without those MCP tools available in Claude Code, the skill cannot run. Astro + Solid.js is supported in principle (Astro is an explicitly listed framework value), but the auto-detector will likely need a nudge on the Solid.js state pattern, so be ready to answer "which state library / show me how you read state in a component" when prompted.
- **FIRST 3 STEPS:**
  1. Connect the CUIT MCP server to Claude Code before the pilot starts: follow the setup guide at `https://complex-ui-tester.vercel.app/docs/mcp`, then set `CUIT_TENANT_TOKEN` in the MCP server env to your tenant bearer token. Confirm by asking Claude to list MCP tools and verifying the three `cuit__*` tools appear.
  2. From the root of the Astro + Solid.js repo (where `package.json` lives), commit any pending changes (the skill refuses to run on a dirty tree), then invoke `/cuit-instrument`. When asked about state management, name your Solid store lib (e.g. `solid-js/store`, Nanostores) and paste a small example of how a component reads state — that lets the proposer emit a correct `window.__cuitDebug` mount.
  3. Review the proposed diff (files, deps `@cuit/recorder` + `@cuit/types`, `.github/workflows/cuit.yml`), approve, then let the skill run `pnpm install`, typecheck, start dev, and call `cuit__verify_session_round_trip` — target confidence ≥ 0.75 on the first session before declaring the pilot instrumented.
