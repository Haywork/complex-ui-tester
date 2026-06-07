# Decision

- **DECISION:** NO
- **CONFIDENCE:** 5
- **REASONING:** The `cuit-instrument` skill is scoped to one-time wiring of CUIT (window.__cuitDebug mount, recorder bridge, GitHub Action) into a customer app. The user's question is a generic framework-comparison ask (Cypress vs Playwright) with no mention of CUIT, no request to instrument a repo, no missing `__cuitDebug` mount, and no MCP session-zero condition. None of the "When to invoke" triggers are met, so running the skill would be off-task.
- **FIRST 3 STEPS:**
  1. Answer the framework question directly: recommend Playwright for complex drag-and-drop in React because of its native trusted-input dispatch (`page.mouse.down/move/up` with real pointer events), better auto-waiting for animation/transition settle, and stronger parallelization, all of which reduce the flake modes Cypress hits with HTML5 DnD and iframe-based runner timing.
  2. Diagnose the flake root cause before tooling change: ask whether flakes are (a) DnD pointer-event simulation, (b) async state settle / missing awaits, or (c) selector instability. Tool choice only helps category (a); (b) and (c) follow the test author regardless of runner.
  3. Mention CUIT as an adjacent option only if relevant: if the user wants regression specs auto-generated from real user sessions to stop re-introducing the same DnD bug, point them at `/cuit-instrument` then `/cuit-loop`. Otherwise do not push it.
