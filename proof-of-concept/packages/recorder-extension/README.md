# @haywork/recorder-extension

A Chrome MV3 extension that captures a session on any page and exports the
`SessionEvent[]` JSON that `@haywork/spec-gen` consumes. This is the missing
feedback edge for agentic coding tools — Claude Code, Codex, Cursor, Aider —
that write UIs but can't verify them.

## Why first-party?

Jam, LogRocket, Sentry Replay et al. are general-purpose session replay tools.
They were not designed to feed a deterministic spec generator. They:

- record pixel events without semantic selectors
- have no API for the host app to expose state snapshots
- charge per-seat / per-session
- require account auth + API keys before you can pull anything

The cuit recorder is built for one job: capture exactly what
`@haywork/spec-gen` needs (pointer events with semantic `targetName`, plus
state snapshots from `window.__cuitDebug.getState()`). One JSON file. No
account. No SDK. No phone-home.

## Install (unpacked)

```bash
git clone git@github.com:speechlabinc/complex-ui-tester.git
cd complex-ui-tester/proof-of-concept/packages/recorder-extension
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `recorder-extension/` folder.

A pin appears in your toolbar.

## Use

1. Visit your app. For state snapshots, your app must expose
   `window.__cuitDebug = { getState: () => yourState }`. Wire this once in
   your `useEffect` — see `packages/demo-app/src/App.tsx`.
2. Click the recorder pin. **Start recording**.
3. Reproduce your bug exactly as a user would.
4. **Stop**. **Copy JSON** (or **Download**).
5. Paste into Claude Code / Codex with a prompt like:

   > Use `@haywork/spec-gen` to convert this session into a Playwright spec
   > against `@haywork/harness` primitives. Then run it. Make it pass.

   Or run locally:

   ```bash
   pnpm cuit gen ./session.json --apply
   ```

## What it captures

- **Pointer events** — down / move / up, with `clientX/Y`, `pointerId`,
  CSS selector path, and semantic `targetName` from `data-segment-id`,
  `data-testid`, or `data-cuit-id`.
- **State snapshots** — flattened from `window.__cuitDebug.getState()` on
  start, on every pointerdown / pointerup, and on stop. Identical
  consecutive snapshots are collapsed to keep traces tight.
- **Navigation** — single nav event with the page URL.

The output JSON matches the `SessionEvent[]` schema in
`@haywork/types` exactly. Same shape `@haywork/spec-gen` already consumes.

## Limitations (PoC)

- No record-on-error or record-on-failed-assertion modes.
- No video / DOM mutation capture.
- Chrome-only (Manifest V3). Firefox/Safari ports are mechanical.
- The recorder logic in `content.js` is duplicated from `@haywork/recorder`
  because the extension ships unbundled; sync the two by hand or via a
  build step.

## Roadmap

- Direct integration with the Claude Code CLI: a hot-key that fires the
  captured session at a local agent endpoint and opens the resulting PR.
- DOM mutation observer for canvas-heavy UIs.
- Optional rrweb event recording for cross-vendor compatibility.
- WebExtensions port for Firefox / Safari.
