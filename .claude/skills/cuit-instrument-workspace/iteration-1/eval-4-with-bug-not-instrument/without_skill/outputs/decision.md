# Decision

- **INVOKE SKILL: YES** — `cuit-loop`
- **REASONING:** The user has a recorded session JSON from the CUIT Chrome extension (`vendor:'cuit'`, `sessionId`, `events[]`) and wants to generate a Playwright spec from it and run it against their app to confirm a bug reproduces. This is the exact trigger for the `cuit-loop` skill, which closes the UI feedback loop: ingest a cuit-session JSON, generate a spec via `@cuit/spec-gen`, run it, auto-detect baseline-lock-in vs bug-reproduction flow based on whether it passes on first run, and commit a green regression gate. The sibling skill `cuit-instrument` is for initial wiring of CUIT into an app, not for processing an already-recorded session.
- **WHAT YOU'D DO NEXT:**
  1. Invoke `/cuit-loop` with the session JSON as input so the skill can parse the events and run `@cuit/spec-gen` to emit a Playwright/Vitest spec.
  2. Execute the generated spec against the local app; since the user expects a bug, anticipate a first-run FAIL and route into the bug-reproduction branch (capture failing assertion, diff vs recorded expectation).
  3. Report the reproduction outcome (failing step, selector, expected vs actual) and propose next actions (fix code, then re-run to flip the spec to green as a regression gate).
