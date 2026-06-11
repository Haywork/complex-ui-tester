// content.entry.ts — thin entry-point for the esbuild IIFE bundle.
// esbuild (format:'iife') wraps this in a self-invoking function,
// inlines @cuit/recorder and all transitive deps, and writes content.js.
//
// DO NOT import CSS, workers, or any module that references browser-only
// globals unavailable in the MAIN-world script context.

import { Recorder, cuitDebugProvider } from '@cuit/recorder';

// ─── Popup-driven API ──────────────────────────────────────────────────────────
// popup.js drives recording via chrome.scripting.executeScript({ world:'MAIN' })
// and calls window.__cuitRecorder[fnName](...fnArgs).  The three method names
// (start / stop / status) must stay exactly as-is — popup.js is plain JS with
// no build step and these strings are called directly.

let active: InstanceType<typeof Recorder> | null = null;

const api = {
  start(options?: { sessionId?: string }) {
    if (active) return { ok: false, error: 'already-recording' };
    const sessionId =
      (options && options.sessionId) || `cuit-${Date.now()}`;
    active = new Recorder({
      sessionId,
      vendor: 'cuit',
      snapshotProvider: cuitDebugProvider,
      // captureConsole and captureErrors both default to true in Recorder —
      // no need to pass them explicitly.  This means console.{log,info,warn,
      // error,debug} and window error/unhandledrejection are captured
      // automatically with zero extra code here.
    });
    active.start();
    return { ok: true, sessionId };
  },

  stop() {
    if (!active) return { ok: false, error: 'not-recording' };
    active.stop();
    const out = active.export();
    active = null;
    return { ok: true, session: out };
  },

  status() {
    const hasCuitDebug = Boolean(
      (window as unknown as { __cuitDebug?: unknown }).__cuitDebug,
    );
    if (!active) return { recording: false, hasCuitDebug };
    return {
      recording: true,
      sessionId: (active as unknown as { sessionId: string }).sessionId,
      eventCount: active.size(),
      hasCuitDebug,
    };
  },
};

// Expose on window so popup.js can reach it via chrome.scripting.executeScript.
(window as unknown as Record<string, unknown>).__cuitRecorder = api;

// Marker checked by popup.js and validate.mjs to confirm the script ran.
document.documentElement.dataset['cuitRecorderInstalled'] = 'true';
