# Decision

- **DECISION**: YES
- **CONFIDENCE**: 4
- **REASONING**: The skill explicitly handles Remix (listed as a supported framework in `cuit__detect_app_shape`) and the no-state-lib case — Step 1 says if `state_libs` is empty, ask the developer which state approach they use, with "React Context" called out as a valid answer. The failure-modes table also covers custom state patterns by asking for an example of how state is read in a component, then using that pattern in the `__cuitDebug` mount. Prop-drilling + Context is a first-class supported shape, not an edge case.

## First 3 Steps

1. **Verify prerequisites**: Confirm the CUIT MCP server is connected (tools `cuit__detect_app_shape`, `cuit__propose_instrumentation`, `cuit__verify_session_round_trip` must be visible) and `CUIT_TENANT_TOKEN` is set. Also confirm the working directory is `apps/portal` (where Remix's `package.json` lives, not the monorepo root) and the working tree is clean — the skill refuses to run on a dirty repo.

2. **Run discovery**: Call `cuit__detect_app_shape` with `apps/portal` as the cwd. Expect `framework: "remix"`, empty `state_libs`, and likely a `candidate_root_files` entry like `app/root.tsx`. When it asks about state lib, answer **"React Context + prop-drilling"** and point it at the one or two Context files you use so `__cuitDebug` can read from them.

3. **Review the proposal**: Call `cuit__propose_instrumentation` with that shape. Expect edits to `app/root.tsx` (mount the recorder bridge behind a `?cuitRecorder=1` gate), new files under `app/cuit/`, and `.github/workflows/cuit.yml`. Reply "show diff" before "yes" so you can confirm the Context read pattern matches your codebase.
