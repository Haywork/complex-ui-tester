# Decision

- **INVOKE SKILL: YES** — `cuit-instrument`

- **REASONING:** The user explicitly named CUIT and described a brand-new wire-in into a customer app (Vite + Preact + Jotai at `apps/internal-dash`). That's exactly the `cuit-instrument` skill's job: auto-detect framework + state lib, mount `window.__cuitDebug`, install the recorder bridge, set up the GitHub Action, and verify with a round-trip session. Their constraints (minimal code touch, prod bundle untouched) map cleanly to the skill's dev-only/conditional-mount patterns, so invoking it ensures we follow the supported wiring path instead of improvising.

- **WHAT I'D DO NEXT:**
  1. Invoke `/cuit-instrument` from `apps/internal-dash` so it auto-detects Vite + Preact + Jotai and proposes the dev-only entry shim (guarded by `import.meta.env.DEV`) plus the Jotai store bridge for `window.__cuitDebug`.
  2. Let the skill scaffold the GitHub Action and recorder bridge, then review the diff to confirm prod bundle is untouched (no CUIT imports in the prod entry, dev-only dynamic import, treeshakeable).
  3. Run the skill's verification step — record a short session via the extension, round-trip it through `@cuit/spec-gen`, and confirm the generated Playwright spec runs green against the dev server before handing off to the team.
