/**
 * bridge-console.test.ts
 *
 * Tests that captureConsole / captureErrors options are threaded from
 * mountTranslateUiReactBridge through into the Recorder so that
 * console.* calls and window error / unhandledrejection events during a
 * recording session appear as type:'console' and type:'error-event'
 * SessionEvents in the exported RecordedSession, and that console methods
 * are fully restored after stop().
 *
 * ALL tests in this file are intentionally FAILING until the feature is
 * implemented.  They drive the implementation described in the plan.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ConsoleEvent, SessionEvent } from '@cuit/types';
import { mountTranslateUiReactBridge } from '../src/translate-ui-react-bridge';

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface WaveformDebugAPI {
  getState(): {
    activeSegmentIndex: number;
    playheadSeconds: number;
    scrollLeft: number;
    segments: Array<{
      id: string;
      index: number;
      startTime: number;
      endTime: number;
      x: number;
      width: number;
      speaker: string;
    }>;
    clockFrozen: boolean;
    clockMs: number;
  };
  setClock(ms: number): void;
  tick(deltaMs: number): void;
  dispatchDrag(segmentIndex: number, dxPx: number): void;
  dispatchResize(segmentIndex: number, edge: 'left' | 'right', dxPx: number): void;
  seekTo(seconds: number): void;
}

/** Install a minimal fake __waveformDebug on window so the bridge does not error. */
function mountFakeWaveformDebug(): WaveformDebugAPI {
  const state = {
    activeSegmentIndex: 0,
    playheadSeconds: 0,
    scrollLeft: 0,
    segments: [
      { id: 'seg-0', index: 0, startTime: 0, endTime: 2, x: 0, width: 132, speaker: 'A' },
    ],
    clockFrozen: false,
    clockMs: 0,
  };
  const api: WaveformDebugAPI = {
    getState: () => JSON.parse(JSON.stringify(state)) as typeof state,
    setClock: (ms: number) => { (state as { clockMs: number }).clockMs = ms; },
    tick: () => {},
    dispatchDrag: () => {},
    dispatchResize: () => {},
    seekTo: () => {},
  };
  (window as unknown as { __waveformDebug: WaveformDebugAPI }).__waveformDebug = api;
  return api;
}

/** Pull only the console events out of a peek(). */
function consoleEvents(events: SessionEvent[]): ConsoleEvent[] {
  return events.filter((e): e is ConsoleEvent => e.type === 'console');
}

// ─── Test lifecycle ───────────────────────────────────────────────────────────

beforeEach(() => {
  mountFakeWaveformDebug();
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({ id: 'srv-uuid-001' }),
    text: async () => '',
  } as unknown as Response)) as unknown as typeof fetch;
});

afterEach(() => {
  delete (window as unknown as { __waveformDebug?: unknown }).__waveformDebug;
  vi.restoreAllMocks();
});

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('mountTranslateUiReactBridge — console capture', () => {
  /**
   * TC-1  Happy-path: a console.error emitted during the session appears in
   * peek().events as a type:'console' level:'error' event whose args contain
   * the original message and any additional arguments.
   *
   * FAILS until: TranslateUiReactBridgeOptions gains captureConsole option AND
   * Recorder wraps console methods and pushes ConsoleEvents.
   */
  test('captures a console.error emitted during a recording session into peek().events', () => {
    const segmentPayload = { segmentIndex: 1 };
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc1',
      pollMs: 10_000, // disable poll noise
      // captureConsole defaults to true — no explicit option needed
    });

    console.error('seg drag failed', segmentPayload);

    const events = consoleEvents(handle.peek().events);
    expect(events).toHaveLength(1);

    const [ev] = events;
    expect(ev?.level).toBe('error');
    // args[0] must contain the literal message
    expect(ev?.args).toContain('seg drag failed');
    // args[1] must be a JSON-serialisable representation of the payload
    const secondArg = ev?.args[1];
    expect(secondArg).toBeTruthy();
    // Either the object itself or its stringified form must surface segmentIndex
    const secondArgStr = typeof secondArg === 'string' ? secondArg : JSON.stringify(secondArg);
    expect(secondArgStr).toContain('1');
  });

  /**
   * TC-2  stop() restores the original console.error reference so post-session
   * calls are not captured and the reference identity is unchanged.
   *
   * FAILS until: Recorder registers a restore closure for each wrapped console
   * method in this.listeners, and stop() iterates them.
   */
  test('stop() restores the original console.error so post-session calls are not recorded', async () => {
    const originalError = console.error;

    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc2',
      pollMs: 10_000,
    });

    // Sanity: the bridge should have replaced console.error during recording.
    expect(console.error).not.toBe(originalError);

    // Emit one error while recording so we have a baseline count.
    console.error('during recording');
    const countDuringRecording = consoleEvents(handle.peek().events).length;
    expect(countDuringRecording).toBe(1);

    await handle.stop();

    // After stop the reference must be the original again.
    expect(console.error).toBe(originalError);

    // Emitting after stop must NOT increase the console event count.
    console.error('after stop');
    expect(consoleEvents(handle.peek().events)).toHaveLength(countDuringRecording);
  });

  /**
   * TC-3  Console events are included in the POST /v1/sessions body that is
   * sent when stop() is called.
   *
   * FAILS until: ConsoleEvents are appended to this.events in the Recorder, so
   * recorder.export().events contains them, which the bridge serialises into the
   * fetch body.
   */
  test('console events are included in the POST /v1/sessions body sent on stop()', async () => {
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc3',
      pollMs: 10_000,
    });

    console.warn('rate limited');

    await handle.stop();

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const init = fetchMock.mock.calls[0]![1] as { body: string };
    const body = JSON.parse(init.body) as {
      events: Array<{ type: string; level?: string; args?: unknown[] }>;
    };

    const warnEvent = body.events.find(
      (e) => e.type === 'console' && e.level === 'warn',
    );
    expect(warnEvent).toBeDefined();
    expect(warnEvent?.args).toContain('rate limited');
  });

  /**
   * TC-4  When captureConsole:false is passed, no console wrapping occurs:
   * console.error is not replaced and no ConsoleEvents are recorded.
   * The default (captureConsole:true) MUST replace console.error; the explicit
   * false opt-out MUST NOT replace it. The contrast between the two is what
   * makes this test fail until both sides of the option are implemented.
   *
   * FAILS until: TranslateUiReactBridgeOptions gains captureConsole option AND
   * the bridge passes captureConsole:true to the Recorder by default (which
   * replaces console.error) AND passes captureConsole:false to leave it alone.
   */
  test('captureConsole:false suppresses console capture', () => {
    const originalError = console.error;

    // First confirm the default path DOES replace console.error (this assertion
    // fails until the feature is implemented, making the whole test fail).
    const defaultHandle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc4a',
      pollMs: 10_000,
    });
    expect(console.error).not.toBe(originalError);
    void defaultHandle.stop();

    // Restore state for the second sub-case.
    console.error = originalError;

    const suppressedHandle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc4b',
      pollMs: 10_000,
      // @ts-expect-error — captureConsole option does not yet exist on the type
      captureConsole: false,
    });

    // With explicit false: console.error must be the original — no wrapping.
    expect(console.error).toBe(originalError);

    console.error('should be ignored');

    expect(consoleEvents(suppressedHandle.peek().events)).toHaveLength(0);
    void suppressedHandle.stop();
  });

  /**
   * TC-5  captureErrors:true (the default) captures window 'error' and
   * 'unhandledrejection' events as error-level console events with monotonic seq.
   *
   * FAILS until: Recorder installs window 'error' / 'unhandledrejection'
   * listeners that push ConsoleEvents, and these listeners are registered in
   * this.listeners so stop() cleans them up.
   *
   * jsdom 25 does not ship PromiseRejectionEvent — a minimal shim is installed
   * at test time so the dispatch call works without depending on the host
   * browser's built-in.  The ErrorEvent is dispatched without an attached Error
   * object to avoid vitest's uncaught-exception handler re-throwing it.
   */
  test('captureErrors:true records window error and unhandledrejection events as error-level console events', () => {
    // jsdom 25 does not define PromiseRejectionEvent — install a shim for this test.
    const needsRejectionShim =
      typeof (window as unknown as { PromiseRejectionEvent?: unknown }).PromiseRejectionEvent ===
      'undefined';
    if (needsRejectionShim) {
      class FakePromiseRejectionEvent extends Event {
        public readonly promise: Promise<unknown>;
        public readonly reason: unknown;
        constructor(
          type: string,
          init: { promise: Promise<unknown>; reason: unknown },
        ) {
          super(type, { bubbles: false, cancelable: true });
          this.promise = init.promise;
          this.reason = init.reason;
        }
      }
      (
        window as unknown as { PromiseRejectionEvent: typeof FakePromiseRejectionEvent }
      ).PromiseRejectionEvent = FakePromiseRejectionEvent;
    }

    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc5',
      pollMs: 10_000,
      // captureErrors defaults to true
    });

    // Dispatch a window 'error' event without an attached Error object so
    // vitest's global uncaught-exception handler does not re-throw.
    const errorEvent = new ErrorEvent('error', { message: 'boom' });
    window.dispatchEvent(errorEvent);

    // Dispatch an 'unhandledrejection' event using the (possibly shimmed) constructor.
    const RejEvent = (
      window as unknown as { PromiseRejectionEvent: typeof PromiseRejectionEvent }
    ).PromiseRejectionEvent;
    const fakePromise = Promise.resolve(); // avoids an actual unhandled rejection
    const rejectionEvent = new RejEvent('unhandledrejection', {
      promise: fakePromise,
      reason: 'unhandled reject reason',
    });
    window.dispatchEvent(rejectionEvent);

    const ceEvents = consoleEvents(handle.peek().events);
    // Expect at least two error-level events: one per window event type.
    expect(ceEvents.filter((e) => e.level === 'error').length).toBeGreaterThanOrEqual(2);

    // The 'boom' message from the ErrorEvent must appear in some event's args.
    const boomEvent = ceEvents.find((e) =>
      e.args.some((a) => typeof a === 'string' && a.includes('boom')),
    );
    expect(boomEvent).toBeDefined();

    // The rejection reason string must appear in some event's args.
    const rejEvent = ceEvents.find((e) =>
      e.args.some((a) => typeof a === 'string' && a.includes('unhandled reject reason')),
    );
    expect(rejEvent).toBeDefined();

    // Seq numbers on these console events must be strictly ascending.
    const seqs = ceEvents.map((e) => e.seq);
    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i]!).toBeGreaterThan(seqs[i - 1]!);
    }

    // Clean up the shim so it does not pollute subsequent tests.
    if (needsRejectionShim) {
      delete (window as unknown as { PromiseRejectionEvent?: unknown }).PromiseRejectionEvent;
    }
  });

  /**
   * TC-6  Default options (no captureConsole/captureErrors passed) capture
   * console by default — proving the ?? true default applied at the bridge layer.
   *
   * FAILS until: TranslateUiReactBridgeOptions defaults are wired through.
   */
  test('default options (no captureConsole/captureErrors passed) capture console by default', () => {
    // Mount with only the required fields — no captureConsole or captureErrors.
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'con-tc6',
      pollMs: 10_000,
    });

    console.error('default-on');

    const errorEvents = consoleEvents(handle.peek().events).filter(
      (e) => e.level === 'error',
    );
    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0]?.args).toContain('default-on');
  });
});
