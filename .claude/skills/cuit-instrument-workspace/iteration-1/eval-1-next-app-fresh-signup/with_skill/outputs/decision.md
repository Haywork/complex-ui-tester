# Decision

- DECISION: YES
- CONFIDENCE: 5
- REASONING: The query matches the skill's "When to invoke" criteria almost exactly — a freshly signed-up CUIT tenant with an un-instrumented Next.js + Zustand + React app, the developer is explicitly asking how to "get it wired up so sessions start flowing into the warehouse," and they confirm the CUIT MCP server is connected. This is the canonical one-time wiring case that `/cuit-instrument` exists for (distinct from `/cuit-loop`, which assumes the app is already instrumented).
- FIRST 3 STEPS:
  - Verify prerequisites: confirm the CUIT MCP tools (`cuit__detect_app_shape`, `cuit__propose_instrumentation`, `cuit__verify_session_round_trip`) are listed, and confirm the `cuit-pilot-token` from 1Password has been set as `CUIT_TENANT_TOKEN` in the MCP server env (ask the developer to paste it in if not). Also check `/Users/ryanmedlin/speechlab/translate-ui-react` has no uncommitted changes before touching files.
  - Step 1 (Discover): call `cuit__detect_app_shape` with `cwd=/Users/ryanmedlin/speechlab/translate-ui-react`. Expect `framework: next.js`, `state_libs: ["zustand"]`, candidate root file under `src/app/layout.tsx` (Next 16 app-router). If anything comes back `unknown`, override with the developer-supplied stack (Next 16 / app-router / Zustand / React 19).
  - Step 2 (Propose): call `cuit__propose_instrumentation` with that shape, summarize the diff (files created/edited, `@cuit/recorder` + `@cuit/types` deps, `.github/workflows/cuit.yml`, est. ~8 min), and ask "yes / show diff / edit proposal" before writing anything. Then continue into Steps 3-5 (Install, Verify via `cuit__verify_session_round_trip` against `http://localhost:3000/?cuitRecorder=1`, Confirm).
