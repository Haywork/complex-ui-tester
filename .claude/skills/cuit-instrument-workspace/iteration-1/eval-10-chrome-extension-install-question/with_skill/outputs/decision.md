# Decision

- **DECISION:** NO
- **CONFIDENCE:** 5
- **REASONING:** The `cuit-instrument` skill is scoped to wiring CUIT into a customer app codebase end-to-end (auto-detecting framework, mounting `window.__cuitDebug`, installing the recorder bridge, setting up the GitHub Action, and verifying a round-trip session). The user's question is purely about locating/installing the `@cuit/recorder-extension` Chrome extension from the Chrome Web Store — a distribution/install question, not an in-repo instrumentation task. None of the skill's MCP tools (`cuit__detect_app_shape`, `cuit__propose_instrumentation`, `cuit__verify_session_round_trip`) apply here, and the skill's "When to invoke" triggers are not met.

## First 3 Steps

1. Clarify that the Chrome extension is the `@cuit/recorder-extension`, which is typically distributed as an unlisted/internal extension and may not appear via public Chrome Web Store search — ask the user whether they were given a direct Web Store link or an internal distribution channel by their CUIT contact.
2. Point the user to the official CUIT docs page for extension install (`https://complex-ui-tester.vercel.app/docs/` — extension/recorder section) and offer the developer-mode sideload path: download the packaged extension from the CUIT dashboard or `proof-of-concept/packages/recorder-extension/`, then load it via `chrome://extensions` with Developer Mode on and "Load unpacked".
3. Note the alternative: if they are instrumenting an app and don't need the browser extension specifically, the `@cuit/recorder` npm module + `?cuitRecorder=1` URL flag captures sessions without any Chrome extension — and offer to run `/cuit-instrument` if they want that path instead.
