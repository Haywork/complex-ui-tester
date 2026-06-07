# Decision

- **INVOKE SKILL:** YES — `cuit-instrument`
- **REASONING:** The user is starting a CUIT pilot on a new (uninstrumented) app and explicitly asks how to get instrumented. The `cuit-instrument` skill is purpose-built for wiring CUIT into a customer app end-to-end (framework + state lib auto-detection, `window.__cuitDebug` mount, recorder bridge install, GitHub Action setup, round-trip verification). The missing CUIT MCP is a separate concern — instrumentation itself does not require the MCP, so it does not block the pilot kickoff.
- **WHAT YOU'D DO NEXT:**
  1. Invoke the `cuit-instrument` skill against the Astro + Solid.js repo so it can auto-detect the framework/state lib and scaffold the recorder bridge, `window.__cuitDebug`, and GitHub Action.
  2. Confirm Astro's island/SSR boundaries and Solid.js signals are picked up correctly during detection; manually wire the bridge into the client-side entry if Astro's partial hydration hides it.
  3. Clarify with the user whether they want the CUIT MCP set up in parallel (it's optional for the pilot — recording + spec generation via `cuit-loop` works without it; MCP only adds richer agent-side tooling later).
