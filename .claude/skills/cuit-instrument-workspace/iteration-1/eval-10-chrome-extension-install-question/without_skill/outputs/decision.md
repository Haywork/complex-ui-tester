# Decision

- **INVOKE SKILL:** NO

- **REASONING:** No CUIT skill is currently loaded in this session, so there is nothing to invoke. The user's question is a support/installation question about locating the `@cuit/recorder-extension` Chrome extension, not a request to instrument a codebase or process a recorded session — neither of which a skill would be needed for here. The right move is a direct answer based on what's known about CUIT's distribution model.

- **WHAT YOU'D DO NEXT:**
  1. Explain that the CUIT recorder extension is not published to the Chrome Web Store — it's distributed as an unpacked extension from the `@cuit/recorder-extension` package (or the monorepo's `packages/recorder-extension` build output).
  2. Walk them through sideloading: run the package's build, then in Chrome go to `chrome://extensions`, toggle **Developer mode** on (top right), click **Load unpacked**, and select the built `dist/` (or equivalent) directory.
  3. Offer to locate the extension source in this repo (or install it via npm) and produce the exact build + load-unpacked commands for their setup, and confirm it's working by checking that `window.__cuitDebug` appears on a page where the recorder is active.
