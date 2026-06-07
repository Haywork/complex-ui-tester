# Decision

- **DECISION:** NO
- **CONFIDENCE:** 5
- **REASONING:** The user has an already-instrumented app with a generated CUIT spec that is running in CI and locally — they are debugging a flaky/environment-dependent assertion failure, not wiring CUIT into a new codebase. `/cuit-instrument` is for one-time setup (mounting `window.__cuitDebug`, installing the recorder bridge, creating the GitHub Action). This is a spec-debugging task that belongs to `/cuit-loop` (or general debugging), not instrumentation.
- **FIRST 3 STEPS:**
  1. Do not invoke `/cuit-instrument`. Tell the user this is a spec-runtime issue, not a setup issue, and point them to `/cuit-loop` since their app is already instrumented.
  2. Triage the assertion diff (`expected segments[0].x = 100, got 25`): ask whether the spec asserts on a viewport-dependent coordinate. CI typically runs at a different default viewport than the developer's local browser (e.g., 1280x720 headless vs. local full-window), which scales layout-derived `x` values. Have them log the CI viewport and DPR.
  3. Compare environments deterministically: pin the Playwright `viewport`, `deviceScaleFactor`, and any locale/timezone in the generated spec config; re-run locally with the exact CI viewport. If `segments[0].x` is layout-derived, refactor the assertion to a resolution-independent invariant (relative offset, ordering, or `data-testid` presence) rather than an absolute pixel value.
