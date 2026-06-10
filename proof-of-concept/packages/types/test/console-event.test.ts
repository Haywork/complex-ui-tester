import { describe, expect, test } from 'vitest';
import {
  isConsoleEvent,
  isConsoleLevel,
  isErrorEvent,
  capArgs,
  CONSOLE_LEVELS,
  type ConsoleEvent,
  type ConsoleLevel,
  type ErrorEvent,
  type NavEvent,
  type PointerEvent,
  type SessionEvent,
  type StateSnapshotEvent,
} from '../src/index.js';

// ─── Shared base, so each fixture differs only in its discriminant fields ─────

const BASE = {
  ts: 120,
  wallClock: 1_700_000_000_000,
  seq: 7,
  vendor: 'cuit',
  vendorEventId: 'sess-1-c-7',
} as const satisfies Omit<SessionEvent, 'type'> & Record<string, unknown>;

// Runtime fallback so test.each doesn't error during collection when
// CONSOLE_LEVELS is not yet exported. Tests that specifically validate
// CONSOLE_LEVELS behaviour will still fail for the right reasons.
const ALL_LEVELS: ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

const makeConsole = (
  overrides: Partial<ConsoleEvent> = {},
): ConsoleEvent => ({
  ...BASE,
  type: 'console',
  level: 'log',
  args: ['hello', 42],
  ...overrides,
});

const makeError = (overrides: Partial<ErrorEvent> = {}): ErrorEvent => ({
  ...BASE,
  type: 'error-event',
  message: 'boom',
  ...overrides,
});

const makePointer = (): PointerEvent => ({
  ...BASE,
  type: 'pointer',
  phase: 'down',
  targetSelector: 'div#root',
  x: 10,
  y: 20,
  pointerId: 1,
});

const makeNav = (): NavEvent => ({ ...BASE, type: 'nav', url: 'http://x' });

const makeSnapshot = (): StateSnapshotEvent => ({
  ...BASE,
  type: 'state-snapshot',
  path: 'segments[0].x',
  value: 100,
});

// Every non-console / non-error variant — the negative set both guards must reject.
const NON_CONSOLE_NON_ERROR: ReadonlyArray<readonly [string, SessionEvent]> = [
  ['pointer', makePointer()],
  ['nav', makeNav()],
  ['state-snapshot', makeSnapshot()],
];

describe('isConsoleEvent', () => {
  test('returns true and narrows to ConsoleEvent for a console event', () => {
    const ev: SessionEvent = makeConsole({ level: 'warn', args: ['x'] });

    expect(isConsoleEvent(ev)).toBe(true);

    if (isConsoleEvent(ev)) {
      // Narrowing must expose ConsoleEvent-only fields without a cast.
      expect(ev.level).toBe('warn');
      expect(ev.args).toEqual(['x']);
    } else {
      throw new Error('guard failed to narrow a console event');
    }
  });

  test.each(ALL_LEVELS)(
    'accepts a console event at level "%s"',
    (level) => {
      expect(isConsoleEvent(makeConsole({ level }))).toBe(true);
    },
  );

  test.each(NON_CONSOLE_NON_ERROR)(
    'rejects a %s event',
    (_label, ev) => {
      expect(isConsoleEvent(ev)).toBe(false);
    },
  );

  test('rejects an error-event', () => {
    expect(isConsoleEvent(makeError())).toBe(false);
  });
});

describe('isErrorEvent', () => {
  test('returns true and narrows to ErrorEvent for an error event', () => {
    const ev: SessionEvent = makeError({
      stack: 'Error: boom\n  at f',
      source: 'unhandledrejection',
    });

    expect(isErrorEvent(ev)).toBe(true);

    if (isErrorEvent(ev)) {
      expect(ev.message).toBe('boom');
      expect(ev.source).toBe('unhandledrejection');
      expect(ev.stack).toBe('Error: boom\n  at f');
    } else {
      throw new Error('guard failed to narrow an error event');
    }
  });

  test.each(NON_CONSOLE_NON_ERROR)(
    'rejects a %s event',
    (_label, ev) => {
      expect(isErrorEvent(ev)).toBe(false);
    },
  );

  test('rejects a console event', () => {
    expect(isErrorEvent(makeConsole())).toBe(false);
  });
});

describe('SessionEvent discriminated union', () => {
  test('discriminant guards are mutually exclusive across all variants', () => {
    const all: SessionEvent[] = [
      makePointer(),
      makeNav(),
      makeSnapshot(),
      makeConsole(),
      makeError(),
    ];

    // Exactly one of the two new guards may fire per event, and only for the
    // two new variants — never both, never for the legacy three.
    for (const ev of all) {
      const c = isConsoleEvent(ev);
      const e = isErrorEvent(ev);
      expect(c && e).toBe(false);
    }

    expect(all.filter(isConsoleEvent)).toHaveLength(1);
    expect(all.filter(isErrorEvent)).toHaveLength(1);
  });

  test('exhaustive switch over the union compiles with no default fallthrough', () => {
    const describe_ = (ev: SessionEvent): string => {
      switch (ev.type) {
        case 'pointer':
          return ev.phase;
        case 'nav':
          return ev.url;
        case 'state-snapshot':
          return ev.path;
        case 'console':
          return ev.level;
        case 'error-event':
          return ev.message;
        default: {
          // If a variant is added without a case, `ev` is no longer `never`
          // and this assignment fails to compile — the exhaustiveness gate.
          const _exhaustive: never = ev;
          return _exhaustive;
        }
      }
    };

    expect(describe_(makeConsole({ level: 'debug' }))).toBe('debug');
    expect(describe_(makeError({ message: 'kaboom' }))).toBe('kaboom');
    expect(describe_(makePointer())).toBe('down');
  });
});

// ─── CONSOLE_LEVELS runtime constant ────────────────────────────────────────
// These tests require `CONSOLE_LEVELS: readonly ConsoleLevel[]` to be exported
// from packages/types/src/index.ts. This constant does not yet exist in the
// source, so all tests in this describe block will FAIL until it is added.

describe('CONSOLE_LEVELS', () => {
  test('is exported as a defined value', () => {
    // CONSOLE_LEVELS is not yet exported — this will be undefined.
    expect(CONSOLE_LEVELS).toBeDefined();
  });

  test('is a non-empty readonly array', () => {
    expect(Array.isArray(CONSOLE_LEVELS)).toBe(true);
    expect((CONSOLE_LEVELS as unknown[]).length).toBeGreaterThan(0);
  });

  test('contains exactly the five canonical levels', () => {
    const expected: ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
    expect([...(CONSOLE_LEVELS as ConsoleLevel[])].sort()).toEqual(
      [...expected].sort(),
    );
  });

  test('contains no duplicates', () => {
    const seen = new Set<string>();
    for (const level of CONSOLE_LEVELS as ConsoleLevel[]) {
      expect(seen.has(level)).toBe(false);
      seen.add(level);
    }
  });

  test('every entry is a valid ConsoleLevel string', () => {
    const valid = new Set<string>(['log', 'info', 'warn', 'error', 'debug']);
    for (const level of CONSOLE_LEVELS as ConsoleLevel[]) {
      expect(valid.has(level)).toBe(true);
    }
  });
});

// ─── isConsoleLevel runtime guard ───────────────────────────────────────────
// These tests require `isConsoleLevel(v: unknown): v is ConsoleLevel` to be
// exported from packages/types/src/index.ts. This function does not yet exist
// in the source, so all tests in this describe block will FAIL until it is added.

describe('isConsoleLevel', () => {
  test('is exported as a function', () => {
    // isConsoleLevel is not yet exported — will be undefined.
    expect(typeof isConsoleLevel).toBe('function');
  });

  test.each(['log', 'info', 'warn', 'error', 'debug'] as const)(
    'returns true for valid level "%s"',
    (level) => {
      expect(isConsoleLevel(level)).toBe(true);
    },
  );

  test.each([
    'LOG',
    'INFO',
    'warning',
    'err',
    'verbose',
    '',
    'trace',
    'fatal',
  ])('returns false for invalid string "%s"', (value) => {
    expect(isConsoleLevel(value)).toBe(false);
  });

  test.each([null, undefined, 42, true, [], {}] as const)(
    'returns false for non-string value %o',
    (value) => {
      expect(isConsoleLevel(value)).toBe(false);
    },
  );
});

// ─── capArgs utility ────────────────────────────────────────────────────────
// These tests require `capArgs(args: unknown[], maxCount?: number): unknown[]`
// to be exported from packages/types/src/index.ts. The utility must:
//   - Return a new array (not mutate the input).
//   - Cap the array to `maxCount` entries (default 10).
//   - Replace non-JSON-safe values (functions, undefined, circular refs, Symbols)
//     with a placeholder string so the result is always JSON.stringify-safe.
// This function does not yet exist in the source, so all tests in this describe
// block will FAIL until it is added.

describe('capArgs', () => {
  test('is exported as a function', () => {
    // capArgs is not yet exported — will be undefined.
    expect(typeof capArgs).toBe('function');
  });

  test('returns an array', () => {
    expect(Array.isArray(capArgs([1, 'two', true]))).toBe(true);
  });

  test('returns a new array — does not mutate input', () => {
    const input = [1, 2, 3];
    const result = capArgs(input);
    expect(result).not.toBe(input);
  });

  test('preserves JSON-safe primitives unchanged', () => {
    const args = [1, 'hello', true, null, { x: 2 }, [3, 4]];
    expect(capArgs(args)).toEqual(args);
  });

  test('caps to default limit of 10 entries', () => {
    const args = Array.from({ length: 20 }, (_, i) => i);
    const result = capArgs(args);
    expect(result.length).toBe(10);
    expect(result).toEqual(args.slice(0, 10));
  });

  test('caps to a custom maxCount', () => {
    const args = [1, 2, 3, 4, 5];
    const result = capArgs(args, 3);
    expect(result.length).toBe(3);
    expect(result).toEqual([1, 2, 3]);
  });

  test('returns empty array for empty input', () => {
    expect(capArgs([])).toEqual([]);
  });

  test('replaces function values with a placeholder string', () => {
    const result = capArgs([() => 'noop']);
    expect(typeof result[0]).toBe('string');
    expect(result[0]).toContain('[Function');
  });

  test('replaces undefined values with a placeholder string', () => {
    const result = capArgs([undefined]);
    expect(typeof result[0]).toBe('string');
  });

  test('replaces Symbol values with a placeholder string', () => {
    const result = capArgs([Symbol('test')]);
    expect(typeof result[0]).toBe('string');
  });

  test('result is always JSON.stringify-safe for non-serializable inputs', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    const result = capArgs([circular, () => 'fn', Symbol('s'), undefined]);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  test('result round-trips through JSON for a valid args array', () => {
    const args = [1, 'text', true, null, { a: 1 }];
    const result = capArgs(args);
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(JSON.parse(JSON.stringify(result))).toEqual(args);
  });

  test('replaces a circular object with a placeholder string', () => {
    const circular: Record<string, unknown> = { x: 1 };
    circular['self'] = circular;
    const result = capArgs([circular]);
    expect(typeof result[0]).toBe('string');
  });
});
