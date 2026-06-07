# Decision

- **DECISION:** NO
- **CONFIDENCE:** 5
- **REASONING:** The user already has a recorded session JSON from the Chrome extension and wants to generate a Playwright spec, run it against the app, and confirm a bug reproduces. That is exactly the closed-loop flow that `/cuit-loop` is built for (spec-gen from a session, auto-detect baseline vs bug-repro, commit a green regression gate). `/cuit-instrument` is the one-time wiring skill — it mounts `window.__cuitDebug`, installs the recorder bridge, sets up the GH Action, and does a round-trip verify. None of that is being asked for; the recorder is already producing sessions, so the app is already instrumented enough for the loop. Invoking `/cuit-instrument` here would be a wrong-skill misfire.
- **FIRST 3 STEPS:**
  1. Invoke `/cuit-loop` and pass the session JSON (`{sessionId:'abc', vendor:'cuit', events:[...]}`) as the input artifact.
  2. Let `/cuit-loop` call `@cuit/spec-gen` to translate the session events into a Playwright/Vitest spec, then run that spec against the app.
  3. Have `/cuit-loop` auto-detect the flow: since the user said "make sure the bug is reproduced," expect first-run FAIL → bug-reproduction flow → iterate on the spec until it reliably reproduces, then commit it as a red-then-green regression gate (or, if it passes first run, treat as baseline lock-in).
