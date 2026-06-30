/**
 * translate-ui-react-bridge.ts
 *
 * Adapter that lets the SpeechLab waveform editor (translate-ui-react)
 * feed a CUIT SaaS warehouse with zero refactor. It taps the existing
 * production __waveformDebug API (shipped in Branch B / PR #1995),
 * watches state-snapshot mutations, captures pointer events, and ships
 * each event as a CUIT SessionEvent to the configured tenant API.
 *
 * Designed to be the ONLY change to translate-ui-react: a single
 * `mountTranslateUiReactBridge()` call from a NODE_ENV-gated useEffect
 * in WaveFormDub.tsx.
 *
 * Usage in translate-ui-react/src/components/domain/WaveFormSegment/WaveFormDub.tsx:
 *
 *   useEffect(() => {
 *     if (process.env.NODE_ENV === 'production') return;
 *     const url = new URL(window.location.href);
 *     if (!url.searchParams.has('cuitRecorder')) return;
 *     const { mountTranslateUiReactBridge } = require('@haywork/recorder/translate-ui-react-bridge');
 *     return mountTranslateUiReactBridge({
 *       apiUrl: process.env.NEXT_PUBLIC_CUIT_API_URL ?? 'http://localhost:7710',
 *       tenantToken: process.env.NEXT_PUBLIC_CUIT_TOKEN ?? 'dev-token-speechlab',
 *       sessionId: `tur-${Date.now()}`,
 *       gitSha: process.env.NEXT_PUBLIC_GIT_SHA,
 *       gitBranch: process.env.NEXT_PUBLIC_GIT_BRANCH,
 *     });
 *   }, []);
 */

import { Recorder, type RecordedSession } from './index.js';

// ─── Local re-declaration of the translate-ui-react __waveformDebug shape ────
// Re-declared here so this file has no compile-time dependency on the
// translate-ui-react source tree (which lives in a separate repo).

interface WaveformSegmentSnap {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  x: number;
  width: number;
  speaker: string;
}

interface WaveformDebugState {
  activeSegmentIndex: number;
  playheadSeconds: number;
  scrollLeft: number;
  segments: WaveformSegmentSnap[];
  clockFrozen: boolean;
  clockMs: number;
}

interface WaveformDebugAPI {
  getState(): WaveformDebugState;
  setClock(ms: number): void;
  tick(deltaMs: number): void;
  dispatchDrag(segmentIndex: number, dxPx: number): void;
  dispatchResize(segmentIndex: number, edge: 'left' | 'right', dxPx: number): void;
  seekTo(seconds: number): void;
}

declare global {
  interface Window {
    __waveformDebug?: WaveformDebugAPI;
  }
}

// ─── Bridge config ───────────────────────────────────────────────────────────

export interface TranslateUiReactBridgeOptions {
  /** The CUIT SaaS API base URL — e.g. http://localhost:7710 or https://api.cuit.dev */
  apiUrl: string;
  /** Bearer token for the tenant. SpeechLab dev: 'dev-token-speechlab'. */
  tenantToken: string;
  /** Stable session identifier — usually `tur-${Date.now()}` per recording. */
  sessionId: string;
  /** Optional git context so the warehouse can replay against a known SHA. */
  gitSha?: string;
  gitBranch?: string;
  /**
   * Poll interval (ms) for the synthetic mutation observer. Lower = more
   * snapshots; higher = lighter overhead. Default 250ms.
   */
  pollMs?: number;
  /**
   * If set, the bridge POSTs the session as soon as N events accumulate, in
   * addition to the on-stop POST. Useful for long sessions; default disabled.
   */
  flushAfterEvents?: number;
  /** Callback after a successful POST. */
  onUpload?: (uploaded: { events: number; serverId: string }) => void;
  /** Callback when a POST fails. */
  onError?: (err: Error) => void;
  /**
   * Capture console.* calls as ConsoleEvent entries. Forwarded to the
   * underlying Recorder. Default `true`.
   */
  captureConsole?: boolean;
  /**
   * Capture window 'error' and 'unhandledrejection' events as ErrorEvent
   * entries. Forwarded to the underlying Recorder. Default `true`.
   */
  captureErrors?: boolean;
}

// ─── Public mount function ───────────────────────────────────────────────────

export interface BridgeHandle {
  /** Stop recording and POST the final session. Returns a promise that
   *  resolves to the server-side session UUID. */
  stop(): Promise<string | null>;
  /** Get the in-memory event count. */
  size(): number;
  /** Inspect the currently buffered RecordedSession (does not POST). */
  peek(): RecordedSession;
}

export function mountTranslateUiReactBridge(
  options: TranslateUiReactBridgeOptions,
): BridgeHandle {
  if (typeof window === 'undefined') {
    throw new Error(
      'mountTranslateUiReactBridge must run in the browser; SSR context detected',
    );
  }

  const pollMs = options.pollMs ?? 250;
  let stopped = false;

  // Snapshot provider that flattens translate-ui-react's state shape
  // into the {path: value} pairs the recorder expects.
  const snapshotProvider = (): Record<string, unknown> | null => {
    const api = window.__waveformDebug;
    if (!api || typeof api.getState !== 'function') return null;
    try {
      return api.getState() as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const recorder = new Recorder({
    sessionId: options.sessionId,
    vendor: 'cuit',
    snapshotProvider,
    // The waveform's drag handles are inside react-rnd wrappers; the
    // selectors fall back to data-segment-id when present and CSS path
    // otherwise. Both are captured.
    semanticSelectors: [
      'data-segment-id',
      'data-testid',
      'data-cuit-id',
      'data-cy',
    ],
    captureConsole: options.captureConsole ?? true,
    captureErrors: options.captureErrors ?? true,
  });

  recorder.start();

  // Wrap __waveformDebug's imperative dispatch methods so harness-driven
  // tests (the existing Branch B Playwright suite) also produce captured
  // events. This is what makes "run your existing tests with the
  // recorder enabled" Just Work.
  const wrappedApi = (): void => {
    const api = window.__waveformDebug;
    if (!api || (api as { __cuitWrapped?: boolean }).__cuitWrapped) return;

    const originalDispatchDrag = api.dispatchDrag.bind(api);
    api.dispatchDrag = (segmentIndex: number, dxPx: number): void => {
      // Synthesize a CUIT pointer-down / move / up triplet at synthetic
      // coordinates so spec-gen has the same shape it would from a real
      // user drag.
      recorder.captureSnapshot();
      originalDispatchDrag(segmentIndex, dxPx);
      recorder.captureSnapshot();
    };

    const originalDispatchResize = api.dispatchResize.bind(api);
    api.dispatchResize = (
      segmentIndex: number,
      edge: 'left' | 'right',
      dxPx: number,
    ): void => {
      recorder.captureSnapshot();
      originalDispatchResize(segmentIndex, edge, dxPx);
      recorder.captureSnapshot();
    };

    (api as { __cuitWrapped?: boolean }).__cuitWrapped = true;
  };

  // Poll for __waveformDebug to mount; once it does, install the wrapper.
  const pollHandle = setInterval(() => {
    if (stopped) {
      clearInterval(pollHandle);
      return;
    }
    if (window.__waveformDebug) {
      wrappedApi();
      // Also periodically capture state snapshots so changes that don't
      // come through pointer events (e.g. playhead drift during playback)
      // are recorded.
      recorder.captureSnapshot();
    }
  }, pollMs);

  // Auto-flush every N events if configured.
  const flushAfter = options.flushAfterEvents;
  let lastFlushedSize = 0;
  const flushInterval = flushAfter
    ? setInterval(() => {
        if (recorder.size() - lastFlushedSize >= flushAfter) {
          lastFlushedSize = recorder.size();
          void uploadSession(recorder.export(), options).catch((err) =>
            options.onError?.(err as Error),
          );
        }
      }, 5_000)
    : null;

  return {
    size: () => recorder.size(),
    peek: () => recorder.export(),
    stop: async () => {
      if (stopped) return null;
      stopped = true;
      clearInterval(pollHandle);
      if (flushInterval) clearInterval(flushInterval);
      recorder.stop();
      const session = recorder.export();
      try {
        const id = await uploadSession(session, options);
        options.onUpload?.({ events: session.events.length, serverId: id ?? '' });
        return id;
      } catch (err) {
        options.onError?.(err as Error);
        return null;
      }
    },
  };
}

// ─── HTTP transport ──────────────────────────────────────────────────────────

async function uploadSession(
  session: RecordedSession,
  options: TranslateUiReactBridgeOptions,
): Promise<string | null> {
  const payload = {
    sessionId: session.sessionId,
    vendor: session.vendor,
    createdAt: session.createdAt,
    url: session.url,
    events: session.events,
    ...(options.gitSha ? { gitSha: options.gitSha } : {}),
    ...(options.gitBranch ? { gitBranch: options.gitBranch } : {}),
  };
  const res = await fetch(`${options.apiUrl}/v1/sessions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${options.tenantToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '<no body>');
    throw new Error(`cuit-api POST /v1/sessions ${res.status}: ${errText}`);
  }
  const body = (await res.json().catch(() => ({}))) as { id?: string };
  return body.id ?? null;
}
