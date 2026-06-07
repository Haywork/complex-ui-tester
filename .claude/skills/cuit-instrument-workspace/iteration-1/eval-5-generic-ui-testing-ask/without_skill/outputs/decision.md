# Decision

- **INVOKE SKILL:** NO

- **REASONING:** This is a generic framework-comparison question (Cypress vs Playwright) about choosing a test tool for a React app with flaky drag-and-drop tests. None of the available skills target framework selection or flake remediation specifically. CUIT skills (`cuit-instrument`, `cuit-loop`) are for wiring CUIT into an app or processing a recorded session JSON — neither applies here since the user is still in the evaluation phase and has not asked to instrument anything or attached a session. `test-generation` writes tests in an already-chosen framework; `verify` runs the app to confirm a change. No skill answers "which framework should I pick?"

- **WHAT YOU'D DO NEXT:**
  1. Recommend Playwright as the stronger choice for this use case: better drag-and-drop primitives (`page.dragTo()`, fine-grained `mouse.down/move/up` with `steps`), auto-waiting that reduces flake, multi-browser support, and trace viewer for debugging flaky runs. Cypress drag-and-drop requires plugins (`cypress-drag-drop`) and struggles with HTML5 native DnD events.
  2. Diagnose the current flake root cause before migrating — common culprits are missing waits on drop-target state, animation timing, and fixed `setTimeout` calls. A framework switch alone will not fix bad test design.
  3. Offer to prototype one flaky drag-and-drop scenario in Playwright as a head-to-head comparison before committing to a full migration.
