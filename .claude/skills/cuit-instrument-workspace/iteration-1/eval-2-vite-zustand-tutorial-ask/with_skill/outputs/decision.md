# Decision

- **DECISION:** YES
- **CONFIDENCE:** 4
- **REASONING:** The `/cuit-instrument` skill is designed exactly for this scenario: a Vite app with a known state lib that needs one-time wiring (window.__cuitDebug, recorder bridge, GitHub Action). The skill explicitly guarantees zero production-bundle impact via a hard NODE_ENV gate, satisfying the "prod bundle stays untouched" constraint. The auto-detect step will identify Vite + Preact + Jotai cleanly, minimizing code changes. Confidence is 4 (not 5) because Preact (vs React) and Jotai (vs Zustand/Redux) are less-common combos — the MCP proposer may need a Jotai-specific `__cuitDebug` snippet, and Preact compat may need confirmation.

## First 3 Steps

1. **Pre-flight check** — Verify cwd is `apps/internal-dash` (where `package.json` lives), confirm git working tree is clean (skill refuses to run on dirty repos), and verify CUIT MCP tools (`cuit__detect_app_shape`, `cuit__propose_instrumentation`, `cuit__verify_session_round_trip`) are loaded.

2. **Run discovery** — Call `cuit__detect_app_shape` with cwd. Expect `framework: "vite"`, `ui_libs: ["preact"]`, `state_libs: ["jotai"]`. If Jotai isn't auto-detected, explicitly tell the proposer "Jotai atoms, read via `useAtomValue`" so the generated `__cuitDebug` mount uses the right pattern.

3. **Propose + review diff** — Call `cuit__propose_instrumentation`, then show the developer the file list (expect `src/cuit/debug.ts`, `src/cuit/recorder-bridge.tsx`, a `main.tsx` edit, and `.github/workflows/cuit.yml`). Confirm every new module is `import.meta.env.DEV`-gated before applying.
