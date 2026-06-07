# Decision

- **INVOKE SKILL: YES** — `cuit-instrument`

- **REASONING:** The user's request "set up cuit on this repo" matches the `cuit-instrument` skill's exact purpose: wiring CUIT into a customer app end-to-end (auto-detect framework/state lib, mount `window.__cuitDebug`, install recorder bridge, set up GitHub Action, verify with round-trip). The alternative `cuit-loop` skill applies only when a recorded session JSON is provided, which is not the case here — this is a first-time setup, not a session replay/regression task.

- **WHAT YOU'D DO NEXT:**
  1. Invoke the `cuit-instrument` skill to load its full setup playbook.
  2. Detect the repo's framework and state library (inspect `package.json`, `marketing-site/`, and source tree) so the skill can pick the right bridge.
  3. Follow the skill's steps to mount `window.__cuitDebug`, install the recorder, add the GitHub Action workflow, and run a round-trip verification session to confirm instrumentation works.
