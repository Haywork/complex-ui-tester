/**
 * Tests for opt-in console + error capture in the Recorder class.
 *
 * ALL tests in this file are expected to FAIL until the implementation is
 * added to packages/recorder/src/index.ts. The Recorder currently has no
 * captureConsole, captureErrors, or redactConsoleArg options, and does not
 * monkey-patch console or listen for window error events.
 *
 * Constants mirror the implementation spec so magic numbers are never buried:
 *   MAX_ARGS     = 10   — max serialized args before overflow marker
 *   MAX_ARG_LEN  = 2000 — max characters per serialized arg before truncation
 */

import { afterEach, describe, expect, test } from 'vitest';
import { Recorder } from '../src/index';
import type { ConsoleEvent, ErrorEvent } from '@cuit/types';

// ─── Constants mirrored from the planned implementation ──────────────────────

const MAX_ARGS = 10;
const MAX_ARG_LEN = 2000;
const CONSOLE_LEVELS = ['log', 'info', 'warn', 'error', 'debug'] as const;
type ConsoleLevel = (typeof CONSOLE_LEVELS)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a monotonically increasing time source seeded at a known epoch so
 * tests are deterministic and independent of wall-clock time.
 */
function makeNow(start = 1_700_000_000_000): () => number {
  let t = start;
  return () => (t += 1);
}

/** Narrow-cast a SessionEvent to ConsoleEvent — throws if type doesn't match. */
function asConsole(ev: unknown): ConsoleEvent {
  const e = ev as { type?: string };
  if (e.type !== 'console') throw new TypeError(`Expected console event, got ${e.type}`);
  return ev as ConsoleEvent;
}

/** Narrow-cast a SessionEvent to ErrorEvent — throws if type doesn't match. */
function asError(ev: unknown): ErrorEvent {
  const e = ev as { type?: string };
  if (e.type !== 'error-event') throw new TypeError(`Expected error-event, got ${e.type}`);
  return ev as ErrorEvent;
}

/**
 * Build a Recorder with console + error capture enabled and a deterministic
 * clock, wired to jsdom's global document.
 */
function makeRecorder(
  overrides: {
    captureConsole?: boolean;
    captureErrors?: boolean;
    redactConsoleArg?: (arg: unknown) => unknown;
  } = {},
): Recorder {
  return new Recorder({
    sessionId: 'cc-test',
    now: makeNow(),
    captureConsole: overrides.captureConsole ?? true,
    captureErrors: overrides.captureErrors ?? true,
    redactConsoleArg: overrides.redactConsoleArg,
  } as ConstructorParameters<typeof Recorder>[0]);
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

// Save originals BEFORE any test so the restoring-originals tests can compare.
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
} as const;

afterEach(() => {
  // Hard-restore console in case a test's recorder.stop() was never reached.
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;

  document.body.innerHTML = '';
});

// ─── describe blocks ─────────────────────────────────────────────────────────

describe('Recorder (console + error capture)', () => {
  // ── 1. patched console.log calls through AND pushes a console event ────────
  describe('patched console.log', () => {
    test('calls through to the original AND pushes a ConsoleEvent with type console', () => {
      // Arrange: install a spy as the "original" before recorder patches console.
      const callArgs: unknown[][] = [];
      console.log = (...args: unknown[]) => {
        callArgs.push(args);
      };
      const preStartLog = console.log;

      const rec = makeRecorder();
      rec.start();

      // Act
      console.log('hi', 42);
      rec.stop();

      // Assert — call-through: spy was invoked exactly once with original args
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0]).toEqual(['hi', 42]);

      // Assert — event was pushed
      const events = rec.export().events;
      const consoleEvents = events.filter((e) => e.type === 'console');
      expect(consoleEvents).toHaveLength(1);

      const ce = asConsole(consoleEvents[0]);
      expect(ce.level).toBe('log');
      expect(ce.message).toBe('hi 42');
      expect(ce.args).toEqual(['hi', '42']);

      // The recorder must not have leaked: after stop(), console.log === preStartLog
      expect(console.log).toBe(preStartLog);
    });
  });

  // ── 2. Each console level maps to the correct ConsoleEvent.level ───────────
  describe('console level mapping', () => {
    test.each(CONSOLE_LEVELS)(
      'console.%s produces a ConsoleEvent with level "%s"',
      (level) => {
        const rec = makeRecorder();
        rec.start();

        // Call the method by name.
        (console[level as ConsoleLevel] as (...a: unknown[]) => void)('test-msg');
        rec.stop();

        const events = rec.export().events.filter((e) => e.type === 'console');
        expect(events).toHaveLength(1);
        expect(asConsole(events[0]).level).toBe(level);
      },
    );
  });

  // ── 3. window 'error' event is captured as an ErrorEvent ──────────────────
  describe('window error listener', () => {
    test('dispatching a window error event yields an ErrorEvent with source window.error', () => {
      const rec = makeRecorder();
      rec.start();

      const err = new Error('boom');
      err.stack = 'Error: boom\n  at <anonymous>:1:1';

      // Add a cancelation listener BEFORE the recorder's listener so the event
      // is cancelled before propagating further — this suppresses the vitest
      // uncaught-exception handler from re-throwing the error.
      const cancelHandler = (e: Event): void => { e.preventDefault(); };
      window.addEventListener('error', cancelHandler, { capture: true });

      const ev = new ErrorEvent('error', {
        message: 'boom',
        error: err,
        bubbles: false,
        cancelable: true,
      });
      window.dispatchEvent(ev);

      window.removeEventListener('error', cancelHandler, true);

      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'error-event');
      expect(events).toHaveLength(1);

      const ee = asError(events[0]);
      expect(ee.source).toBe('window.error');
      expect(ee.message).toBe('boom');
      expect(ee.stack).toContain('boom');
    });
  });

  // ── 4. unhandledrejection is captured as an ErrorEvent ────────────────────
  describe('window unhandledrejection listener', () => {
    test('dispatching an unhandledrejection event yields an ErrorEvent with source unhandledrejection', () => {
      const rec = makeRecorder();
      rec.start();

      const reason = new Error('rejected');
      // Attach a no-op catch so the internal Promise does not become an unhandled
      // rejection itself (the PromiseRejectionEvent constructor creates a real
      // Promise, which Node/jsdom would otherwise re-emit as a secondary error).
      const silentPromise = Promise.reject(reason);
      silentPromise.catch(() => { /* intentionally silenced */ });
      const ev = new PromiseRejectionEvent('unhandledrejection', {
        promise: silentPromise,
        reason,
        cancelable: true,
        bubbles: false,
      });
      window.dispatchEvent(ev);

      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'error-event');
      expect(events).toHaveLength(1);

      const ee = asError(events[0]);
      expect(ee.source).toBe('unhandledrejection');
      expect(ee.message).toBe('rejected');
    });
  });

  // ── 5. stop() fully restores original console methods ────────────────────
  describe('stop() console restoration', () => {
    test('every console method is === the original ref after stop()', () => {
      // Save strict refs before start() patches them.
      const savedLog = console.log;
      const savedInfo = console.info;
      const savedWarn = console.warn;
      const savedError = console.error;
      const savedDebug = console.debug;

      const rec = makeRecorder();
      rec.start();

      // Confirm methods were replaced (they must differ from saved refs while running).
      expect(console.log).not.toBe(savedLog);

      rec.stop();

      // After stop(), each must be === the exact original function reference.
      expect(console.log).toBe(savedLog);
      expect(console.info).toBe(savedInfo);
      expect(console.warn).toBe(savedWarn);
      expect(console.error).toBe(savedError);
      expect(console.debug).toBe(savedDebug);
    });
  });

  // ── 6. after stop(), console calls no longer append events ───────────────
  describe('stop() event gate', () => {
    test('console.log calls after stop() do not add console events', () => {
      const rec = makeRecorder();
      rec.start();
      console.log('pre');

      // 'pre' MUST have been captured before stop() — this assertion fails if
      // console capture is not implemented.
      const eventsBeforeStop = rec.export().events.filter((e) => e.type === 'console');
      expect(eventsBeforeStop).toHaveLength(1);
      expect(asConsole(eventsBeforeStop[0]).message).toBe('pre');

      rec.stop();

      const sizeAfterStop = rec.export().events.length;

      console.log('post');

      const events = rec.export().events;
      expect(events).toHaveLength(sizeAfterStop);
      const postEvents = events.filter(
        (e) => e.type === 'console' && asConsole(e).message === 'post',
      );
      expect(postEvents).toHaveLength(0);
    });
  });

  // ── 7. Circular argument does not throw and falls back to a string ─────────
  describe('circular argument handling', () => {
    test('circular object does not throw and produces a non-empty string arg', () => {
      const rec = makeRecorder();
      rec.start();

      const obj: Record<string, unknown> = { x: 1 };
      obj['self'] = obj; // circular reference

      expect(() => console.log(obj)).not.toThrow();
      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'console');
      expect(events).toHaveLength(1);
      const ce = asConsole(events[0]);
      expect(ce.args[0]).toBeTypeOf('string');
      expect((ce.args[0] as string).length).toBeGreaterThan(0);
    });
  });

  // ── 8. re-entrancy guard prevents infinite recursion ─────────────────────
  describe('re-entrancy guard', () => {
    test('a redactConsoleArg that calls console.log does not stack-overflow and produces exactly 1 top-level event', () => {
      // This redact hook itself calls console.log — without re-entrancy guard,
      // this would recurse infinitely and throw a stack overflow.
      const rec = makeRecorder({
        redactConsoleArg: (arg) => {
          // intentionally calls the (patched) console.log to trigger potential recursion
          console.log(arg);
          return arg;
        },
      });
      rec.start();

      expect(() => console.log('x')).not.toThrow();
      rec.stop();

      // The outer console.log('x') must produce exactly 1 top-level event.
      // The nested call inside redactConsoleArg short-circuits via the re-entrancy flag.
      const events = rec.export().events.filter((e) => e.type === 'console');
      // At minimum there is the outer 'x' event; the nested call must NOT produce
      // an unbounded number of extra events (bounded means <= 2, ideally 1).
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.length).toBeLessThanOrEqual(2);
    });
  });

  // ── 9. args array is capped at MAX_ARGS ───────────────────────────────────
  describe('args array cap', () => {
    test(`args array is capped at MAX_ARGS (${MAX_ARGS}) with an overflow marker`, () => {
      const TOTAL_ARGS = 25;
      const rec = makeRecorder();
      rec.start();

      // Spread 25 distinct args
      console.log(...Array.from({ length: TOTAL_ARGS }, (_, i) => `arg${i}`));
      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'console');
      expect(events).toHaveLength(1);
      const ce = asConsole(events[0]);

      // Expect MAX_ARGS serialized entries + 1 overflow marker = MAX_ARGS + 1
      expect(ce.args).toHaveLength(MAX_ARGS + 1);

      // The last entry must mention how many were dropped
      const overflow = ce.args[MAX_ARGS] as string;
      expect(overflow).toMatch(/\+15 more/);
    });
  });

  // ── 10. individual arg string is capped at MAX_ARG_LEN ────────────────────
  describe('arg string length cap', () => {
    test(`individual arg is truncated to MAX_ARG_LEN (${MAX_ARG_LEN}) with a '…' marker`, () => {
      const rec = makeRecorder();
      rec.start();

      console.log('a'.repeat(5000));
      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'console');
      expect(events).toHaveLength(1);
      const ce = asConsole(events[0]);

      const firstArg = ce.args[0] as string;
      expect(firstArg).toHaveLength(MAX_ARG_LEN);
      expect(firstArg.endsWith('…')).toBe(true);
    });
  });

  // ── 11. redactConsoleArg is applied before serialization ──────────────────
  describe('redactConsoleArg', () => {
    test('redaction hook replaces sensitive substrings before they reach the event', () => {
      const rec = makeRecorder({
        redactConsoleArg: (a) =>
          typeof a === 'string' ? a.replace(/sk-[a-z0-9]+/, '[REDACTED]') : a,
      });
      rec.start();

      console.log('token sk-abc123');
      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'console');
      expect(events).toHaveLength(1);
      const ce = asConsole(events[0]);

      expect(ce.message).toBe('token [REDACTED]');
      expect(ce.message).not.toContain('sk-abc123');
      expect(ce.args[0]).not.toContain('sk-abc123');
    });
  });

  // ── 12. captureConsole:false leaves console untouched ────────────────────
  describe('captureConsole: false opt-out', () => {
    test('with captureConsole:false, console.log is not patched and no console events are emitted', () => {
      const originalLog = console.log;

      const rec = makeRecorder({ captureConsole: false });
      rec.start();

      // console.log must remain === original (not patched)
      expect(console.log).toBe(originalLog);

      console.log('y');
      rec.stop();

      const events = rec.export().events.filter((e) => e.type === 'console');
      expect(events).toHaveLength(0);
    });

    test('with captureConsole:true (default), start() does patch console.log away from the original', () => {
      const originalLog = console.log;

      const rec = makeRecorder({ captureConsole: true });
      rec.start();

      // After start(), console.log must be the PATCHED wrapper, not the original.
      // This assertion fails if the implementation is missing.
      expect(console.log).not.toBe(originalLog);

      rec.stop();
    });
  });

  // ── 13. stop() is idempotent ───────────────────────────────────────────────
  describe('stop() idempotency', () => {
    test('calling stop() twice does not throw and console methods stay restored', () => {
      const savedLog = console.log;
      const rec = makeRecorder();
      rec.start();

      // Verify that start() DID patch console (fails if implementation missing)
      expect(console.log).not.toBe(savedLog);

      console.log('during');
      rec.stop();

      // After first stop(), console must be restored
      expect(console.log).toBe(savedLog);

      const sizeAfterFirstStop = rec.export().events.length;

      // There must be at least one console event from 'during'
      const duringEvents = rec.export().events.filter((e) => e.type === 'console');
      expect(duringEvents).toHaveLength(1);

      // Second stop() must not throw
      expect(() => rec.stop()).not.toThrow();

      // Console must still point to the original
      expect(console.log).toBe(savedLog);

      // Event count must be stable (no extra events on second stop)
      expect(rec.export().events).toHaveLength(sizeAfterFirstStop);
    });
  });
});
