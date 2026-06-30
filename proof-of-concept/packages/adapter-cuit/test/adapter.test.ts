/**
 * Tests for @haywork/adapter-cuit — the identity adapter for native cuit sessions.
 *
 * These tests are INTENTIONALLY FAILING until packages/adapter-cuit/src/index.ts
 * is implemented and packages/runner/src/index.ts gains selectAdapter() routing.
 *
 * The normalizeCuitSession import below resolves to a stub that exports nothing;
 * every test in the first describe block fails until the function is exported.
 *
 * The runner routing describe block uses vi.resetModules() + dynamic imports so
 * it can observe which adapter is called; those tests fail until the runner's
 * hardwired normalizeJamSession call is replaced by selectAdapter().
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import type {
  SessionEvent,
  NavEvent,
  PointerEvent,
  StateSnapshotEvent,
  ConsoleEvent,
  ErrorEvent,
} from '@haywork/cuit-types';
// Resolves to the stub src/index.ts which exports nothing — normalizeCuitSession
// will be undefined, causing every test in the first describe block to fail.
import { normalizeCuitSession, type RawCuitSession } from '../src/index.js';

// ─── Fixture factory helpers ─────────────────────────────────────────────────

function makeRawSession(
  events: unknown[],
  overrides: Partial<RawCuitSession> = {},
): RawCuitSession {
  return {
    sessionId: 'cuit-sess-001',
    vendor: 'cuit',
    createdAt: 1716800000000,
    url: 'http://localhost:5173/',
    events,
    ...overrides,
  };
}

/** A canonical well-formed nav event. */
const NAV_EVENT_RAW = {
  seq: 0,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-1',
  ts: 1716800000000,
  wallClock: 1716800000000,
  type: 'nav',
  url: 'http://localhost:5173/',
} as const;

/** A canonical pointer-down event. */
const POINTER_DOWN_RAW = {
  seq: 1,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-2',
  ts: 1716800000100,
  wallClock: 1716800000100,
  type: 'pointer',
  phase: 'down',
  targetSelector: '[data-segment-id="seg-0"]',
  targetName: 'seg-0',
  x: 50,
  y: 60,
  pointerId: 1,
} as const;

/** A canonical pointer-move event. */
const POINTER_MOVE_RAW = {
  seq: 2,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-3',
  ts: 1716800000200,
  wallClock: 1716800000200,
  type: 'pointer',
  phase: 'move',
  targetSelector: '[data-segment-id="seg-0"]',
  targetName: 'seg-0',
  x: 100,
  y: 60,
  pointerId: 1,
} as const;

/** A canonical pointer-up event. */
const POINTER_UP_RAW = {
  seq: 3,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-4',
  ts: 1716800000300,
  wallClock: 1716800000300,
  type: 'pointer',
  phase: 'up',
  targetSelector: '[data-segment-id="seg-0"]',
  targetName: 'seg-0',
  x: 150,
  y: 60,
  pointerId: 1,
} as const;

/** A canonical state-snapshot event. */
const STATE_SNAPSHOT_RAW = {
  seq: 4,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-5',
  ts: 1716800000400,
  wallClock: 1716800000400,
  type: 'state-snapshot',
  path: 'segments[0].x',
  value: 150,
} as const;

/** A canonical console event (cuit-native — Jam never handled this type). */
const CONSOLE_EVENT_RAW = {
  seq: 5,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-6',
  ts: 1716800000500,
  wallClock: 1716800000500,
  type: 'console',
  level: 'error',
  message: 'TypeError: Cannot read property "x" of undefined',
  args: ['TypeError: Cannot read property "x" of undefined'],
} as const;

/** A canonical error-event (cuit-native — Jam never handled this type). */
const ERROR_EVENT_RAW = {
  seq: 6,
  vendor: 'cuit',
  vendorEventId: 'cuit-sess-001-7',
  ts: 1716800000600,
  wallClock: 1716800000600,
  type: 'error-event',
  source: 'window.error',
  message: 'Uncaught ReferenceError: x is not defined',
  stack: 'ReferenceError: x is not defined\n    at App.tsx:42:10',
} as const;

// ─── normalizeCuitSession — identity + validation ─────────────────────────────

describe('normalizeCuitSession', () => {
  // ── TC1: Full happy-path session ─────────────────────────────────────────────

  test('passes a native cuit session (nav + pointer down/move/up + state-snapshot) through validated and unchanged, stamping vendor cuit', () => {
    const raw = makeRawSession([
      NAV_EVENT_RAW,
      POINTER_DOWN_RAW,
      POINTER_MOVE_RAW,
      POINTER_UP_RAW,
      STATE_SNAPSHOT_RAW,
    ]);

    const result = normalizeCuitSession(raw);

    // Count and type sequence must exactly match the input.
    expect(result).toHaveLength(5);
    expect(result.map((e) => e.type)).toEqual([
      'nav',
      'pointer',
      'pointer',
      'pointer',
      'state-snapshot',
    ]);

    // Every event must be stamped vendor:'cuit'.
    const vendors = new Set(result.map((e) => e.vendor));
    expect(vendors).toEqual(new Set(['cuit']));

    // Nav event: field-level identity check.
    const nav = result[0] as NavEvent;
    expect(nav.seq).toBe(0);
    expect(nav.ts).toBe(1716800000000);
    expect(nav.wallClock).toBe(1716800000000);
    expect(nav.vendorEventId).toBe('cuit-sess-001-1');
    expect(nav.url).toBe('http://localhost:5173/');

    // Pointer-down event: field-level identity check.
    const down = result[1] as PointerEvent;
    expect(down.seq).toBe(1);
    expect(down.phase).toBe('down');
    expect(down.targetSelector).toBe('[data-segment-id="seg-0"]');
    expect(down.targetName).toBe('seg-0');
    expect(down.x).toBe(50);
    expect(down.y).toBe(60);
    expect(down.pointerId).toBe(1);
    expect(down.ts).toBe(1716800000100);

    // Pointer-up event: field-level identity check.
    const up = result[3] as PointerEvent;
    expect(up.phase).toBe('up');
    expect(up.x).toBe(150);
    expect(up.y).toBe(60);

    // State-snapshot event: field-level identity check.
    const snap = result[4] as StateSnapshotEvent;
    expect(snap.path).toBe('segments[0].x');
    expect(snap.value).toBe(150);
  });

  // ── TC2: console and error-event entries (cuit-native signals) pass through ───

  test('preserves console and error-event entries (cuit-native signals Jam never handled) through the identity transform', () => {
    const raw = makeRawSession([NAV_EVENT_RAW, CONSOLE_EVENT_RAW, ERROR_EVENT_RAW]);

    const result = normalizeCuitSession(raw);

    expect(result).toHaveLength(3);

    // Console event — fields must be intact and correctly narrowed.
    const consoleEv = result.find((e): e is ConsoleEvent => e.type === 'console');
    expect(consoleEv).toBeDefined();
    expect(consoleEv?.level).toBe('error');
    expect(consoleEv?.message).toBe(
      'TypeError: Cannot read property "x" of undefined',
    );
    expect(consoleEv?.args).toEqual([
      'TypeError: Cannot read property "x" of undefined',
    ]);
    expect(consoleEv?.vendor).toBe('cuit');
    expect(consoleEv?.seq).toBe(5);

    // Error-event — fields must be intact and correctly narrowed.
    const errorEv = result.find((e): e is ErrorEvent => e.type === 'error-event');
    expect(errorEv).toBeDefined();
    expect(errorEv?.source).toBe('window.error');
    expect(errorEv?.message).toBe('Uncaught ReferenceError: x is not defined');
    expect(errorEv?.stack).toBe(
      'ReferenceError: x is not defined\n    at App.tsx:42:10',
    );
    expect(errorEv?.vendor).toBe('cuit');
  });

  // ── TC3: Malformed events — field-scoped error messages ──────────────────────

  test.each([
    {
      label: 'ts is a string',
      event: {
        seq: 0,
        vendor: 'cuit',
        vendorEventId: 'bad-ts-1',
        ts: 'not-a-number',
        wallClock: 1000,
        type: 'nav',
        url: 'http://localhost:5173/',
      },
      pattern: /Cuit event field "ts" is not a finite number/,
    },
    {
      label: 'pointer x is missing',
      event: {
        seq: 0,
        vendor: 'cuit',
        vendorEventId: 'bad-x-1',
        ts: 1000,
        wallClock: 1000,
        type: 'pointer',
        phase: 'down',
        targetSelector: 'div',
        x: undefined,
        y: 10,
        pointerId: 1,
      },
      pattern: /Cuit event field "x" is not a finite number/,
    },
    {
      label: 'seq is non-finite (NaN)',
      event: {
        seq: NaN,
        vendor: 'cuit',
        vendorEventId: 'bad-seq-1',
        ts: 1000,
        wallClock: 1000,
        type: 'nav',
        url: 'http://localhost:5173/',
      },
      pattern: /Cuit event field "seq" is not a finite number/,
    },
  ])(
    'rejects a malformed cuit event: $label — throws with a clear field-scoped error',
    ({ event, pattern }) => {
      const raw = makeRawSession([event]);
      expect(() => normalizeCuitSession(raw)).toThrow(pattern);
    },
  );

  // ── TC4: Unknown event type — type name in error ──────────────────────────────

  test('rejects an unknown event type with the type named in the message', () => {
    const raw = makeRawSession([
      {
        seq: 0,
        vendor: 'cuit',
        vendorEventId: 'unknown-type-1',
        ts: 1000,
        wallClock: 1000,
        type: 'teleport',
      },
    ]);

    expect(() => normalizeCuitSession(raw)).toThrow(
      /Unknown Cuit event type: teleport/,
    );
  });

  // ── TC5: Out-of-order seq sorting ──────────────────────────────────────────────

  test('sorts out-of-order cuit events by seq before returning (round-trip invariant mirrors adapter-jam)', () => {
    const raw = makeRawSession([
      // Supplied in order [seq=2, seq=0, seq=1].
      {
        seq: 2,
        vendor: 'cuit',
        vendorEventId: 'oo-3',
        ts: 1716800000300,
        wallClock: 1716800000300,
        type: 'state-snapshot',
        path: 'segments[0].x',
        value: 150,
      },
      {
        seq: 0,
        vendor: 'cuit',
        vendorEventId: 'oo-1',
        ts: 1716800000000,
        wallClock: 1716800000000,
        type: 'nav',
        url: 'http://localhost:5173/',
      },
      {
        seq: 1,
        vendor: 'cuit',
        vendorEventId: 'oo-2',
        ts: 1716800000100,
        wallClock: 1716800000100,
        type: 'pointer',
        phase: 'down',
        targetSelector: '[data-segment-id="seg-0"]',
        targetName: 'seg-0',
        x: 50,
        y: 60,
        pointerId: 1,
      },
    ]);

    const result = normalizeCuitSession(raw);

    // seq sequence must be [0, 1, 2] after sort.
    expect(result.map((e) => e.seq)).toEqual([0, 1, 2]);

    // vendorEventId ordering follows seq.
    expect(result.map((e) => e.vendorEventId)).toEqual(['oo-1', 'oo-2', 'oo-3']);

    // Type sequence follows seq order.
    expect(result.map((e) => e.type)).toEqual(['nav', 'pointer', 'state-snapshot']);
  });

  // ── TC6: Empty events array ───────────────────────────────────────────────────

  test('returns an empty array for a cuit session with no events', () => {
    const raw = makeRawSession([]);
    const result = normalizeCuitSession(raw);
    expect(result).toEqual([]);
  });

  // ── TC7: wallClock missing — tolerant fallback to 0 ──────────────────────────

  test('falls back to wallClock=0 when the source event omits wallClock (mirrors adapter-jam tolerance)', () => {
    const raw = makeRawSession([
      {
        seq: 0,
        vendor: 'cuit',
        vendorEventId: 'no-wallclock-1',
        ts: 1716800000000,
        // wallClock intentionally omitted
        type: 'nav',
        url: 'http://localhost:5173/',
      },
    ]);

    const result = normalizeCuitSession(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.wallClock).toBe(0);
    expect(result[0]?.ts).toBe(1716800000000);
  });

  // ── TC8: per-event vendor re-stamp ────────────────────────────────────────────

  test('re-stamps vendor:cuit on every event even when the raw event has a stale vendor value', () => {
    const raw = makeRawSession([
      {
        seq: 0,
        vendor: 'jam', // stale/mismatched — should be overwritten
        vendorEventId: 'stale-vendor-1',
        ts: 1716800000000,
        wallClock: 1716800000000,
        type: 'nav',
        url: 'http://localhost:5173/',
      },
    ]);

    const result = normalizeCuitSession(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.vendor).toBe('cuit');
  });

  // ── TC9: All 5 SessionEvent types satisfy the discriminated union contract ────

  test('produces results that satisfy the SessionEvent discriminated union for all five event types', () => {
    const raw = makeRawSession([
      NAV_EVENT_RAW,
      POINTER_DOWN_RAW,
      STATE_SNAPSHOT_RAW,
      CONSOLE_EVENT_RAW,
      ERROR_EVENT_RAW,
    ]);

    const result = normalizeCuitSession(raw);

    for (const event of result) {
      const typed: SessionEvent = event;
      expect(typeof typed.seq).toBe('number');
      expect(Number.isFinite(typed.seq)).toBe(true);
      expect(typeof typed.ts).toBe('number');
      expect(Number.isFinite(typed.ts)).toBe(true);
      expect(typeof typed.wallClock).toBe('number');
      expect(typeof typed.vendorEventId).toBe('string');
      expect(typed.vendor).toBe('cuit');

      if (typed.type === 'pointer') {
        expect(['down', 'move', 'up']).toContain(typed.phase);
        expect(typeof typed.x).toBe('number');
        expect(typeof typed.y).toBe('number');
        expect(typeof typed.pointerId).toBe('number');
        expect(typeof typed.targetSelector).toBe('string');
      } else if (typed.type === 'state-snapshot') {
        expect(typeof typed.path).toBe('string');
      } else if (typed.type === 'nav') {
        expect(typeof typed.url).toBe('string');
      } else if (typed.type === 'console') {
        expect(['log', 'info', 'warn', 'error', 'debug']).toContain(typed.level);
        expect(typeof typed.message).toBe('string');
        expect(Array.isArray(typed.args)).toBe(true);
      } else if (typed.type === 'error-event') {
        expect(typeof typed.message).toBe('string');
      }
    }
  });
});

// ─── Runner vendor routing tests ──────────────────────────────────────────────
//
// These tests verify the runner's selectAdapter() dispatch.  They mock BOTH
// adapter modules so we can observe which normalize fn gets called.
//
// The runner currently hardwires normalizeJamSession (lines 3 & 116 of
// packages/runner/src/index.ts); these tests will FAIL until selectAdapter()
// is implemented there.
//
// vi.mock() calls are hoisted to file scope by vitest, intercepting the dynamic
// imports in each test.  vi.resetModules() + dynamic import is used to force a
// fresh module instance per test so mock call counts start at zero.

const FIXTURE_PATH = '/abs/fixtures/segment-collision.json';
const OUT_DIR = '/abs/out';

const CUIT_RAW_SESSION = {
  sessionId: 'cuit-sess-routing-001',
  vendor: 'cuit',
  createdAt: 1716800000000, // number — cuit uses ms epoch, not ISO string
  url: 'http://localhost:5173/',
  events: [
    {
      seq: 0,
      vendor: 'cuit',
      vendorEventId: 'cuit-sess-routing-001-1',
      ts: 1716800000000,
      wallClock: 1716800000000,
      type: 'nav',
      url: 'http://localhost:5173/',
    },
  ],
};

const JAM_RAW_SESSION = {
  sessionId: 'jam-sess-routing-2014',
  vendor: 'jam',
  createdAt: '2026-05-20T14:13:00.000Z', // string — jam uses ISO
  url: 'http://localhost:5173/',
  events: [
    {
      seq: 0,
      vendor: 'jam',
      vendorEventId: 'jam-sess-routing-2014-1',
      ts: 1716800000000,
      wallClock: 1716800000000,
      type: 'nav',
      url: 'http://localhost:5173/',
    },
  ],
};

const NORMALIZED_NAV_EVENTS: SessionEvent[] = [
  {
    seq: 0,
    vendor: 'cuit',
    vendorEventId: 'routing-norm-1',
    ts: 1716800000000,
    wallClock: 1716800000000,
    type: 'nav',
    url: 'http://localhost:5173/',
  },
];

const ROUTING_GENERATED_SPEC = {
  testName: 'routing-test — vendor dispatch smoke',
  url: 'http://localhost:5173/',
  primitives: [
    { kind: 'goto' as const, url: 'http://localhost:5173/' },
    { kind: 'setClock' as const, t: 1716800000000 },
    { kind: 'dispatchDrag' as const, targetName: 'seg-0', dx: 100, dy: 0 },
    {
      kind: 'assertStateEquals' as const,
      path: 'segments[0].x',
      value: 100,
    },
  ],
  expectedFinalState: [{ path: 'segments[0].x', value: 100 }],
};

const ROUTING_SERIALIZED_SPEC = `import { describe, expect, test } from 'vitest';
import { dispatchDrag, getStateSnapshot, setClock } from '@haywork/cuit-harness';

describe('routing-test — vendor dispatch smoke', () => {
  test('drags segment 0 right by 100px and asserts state moves', () => {
    setClock(1716800000000);
    dispatchDrag('seg-0', 100, 0);
    const snapshot = getStateSnapshot();
    expect(snapshot['segments[0].x']).toEqual(100);
  });
});
`;

// ── Hoisted mock factories (vitest lifts vi.mock() calls before imports) ──────

const fsMocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

const jamAdapterMocks = vi.hoisted(() => ({
  normalizeJamSession: vi.fn(),
}));

const cuitAdapterMocks = vi.hoisted(() => ({
  normalizeCuitSession: vi.fn(),
}));

const specGenMocks = vi.hoisted(() => ({
  generateSpec: vi.fn(),
  serializeSpec: vi.fn(),
}));

const harnessMocks = vi.hoisted(() => ({
  setClock: vi.fn(),
  dispatchDrag: vi.fn(),
  getStateSnapshot: vi.fn(),
  registerStateSnapshot: vi.fn(),
  captureConsoleErrors: vi.fn(),
  assertNoConsoleErrors: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: fsMocks.readFile,
  writeFile: fsMocks.writeFile,
  mkdir: fsMocks.mkdir,
  default: {
    readFile: fsMocks.readFile,
    writeFile: fsMocks.writeFile,
    mkdir: fsMocks.mkdir,
  },
}));

vi.mock('@haywork/adapter-jam', () => ({
  normalizeJamSession: jamAdapterMocks.normalizeJamSession,
}));

vi.mock('@haywork/adapter-cuit', async (importOriginal) => {
  // Use vi.importActual so the static import of normalizeCuitSession (which
  // resolves to the same module) gets the REAL function by default.  The
  // routing tests override with mockReturnValue; every other test calls through.
  const actual = await importOriginal<{ normalizeCuitSession: unknown }>();
  cuitAdapterMocks.normalizeCuitSession.mockImplementation(
    actual.normalizeCuitSession as (...args: unknown[]) => unknown,
  );
  return {
    normalizeCuitSession: cuitAdapterMocks.normalizeCuitSession,
  };
});

vi.mock('@haywork/cuit-spec-gen', () => ({
  generateSpec: specGenMocks.generateSpec,
  serializeSpec: specGenMocks.serializeSpec,
}));

vi.mock('@haywork/cuit-harness', () => ({
  setClock: harnessMocks.setClock,
  dispatchDrag: harnessMocks.dispatchDrag,
  getStateSnapshot: harnessMocks.getStateSnapshot,
  registerStateSnapshot: harnessMocks.registerStateSnapshot,
  captureConsoleErrors: harnessMocks.captureConsoleErrors,
  assertNoConsoleErrors: harnessMocks.assertNoConsoleErrors,
}));

beforeEach(async () => {
  vi.resetModules();

  fsMocks.readFile.mockReset();
  fsMocks.writeFile.mockReset();
  fsMocks.mkdir.mockReset();
  jamAdapterMocks.normalizeJamSession.mockReset();
  cuitAdapterMocks.normalizeCuitSession.mockReset();
  specGenMocks.generateSpec.mockReset();
  specGenMocks.serializeSpec.mockReset();
  harnessMocks.setClock.mockReset();
  harnessMocks.dispatchDrag.mockReset();
  harnessMocks.getStateSnapshot.mockReset();
  harnessMocks.registerStateSnapshot.mockReset();
  harnessMocks.captureConsoleErrors.mockReset();
  harnessMocks.assertNoConsoleErrors.mockReset();

  // Restore the real normalizeCuitSession implementation after mockReset so
  // the normalizeCuitSession describe block tests (which don't configure the
  // mock) call through to the actual function.  Routing tests override this
  // with mockReturnValue before calling runProofLoop.
  const actualCuit = await vi.importActual<{ normalizeCuitSession: (...args: unknown[]) => unknown }>('../src/index.js');
  cuitAdapterMocks.normalizeCuitSession.mockImplementation(actualCuit.normalizeCuitSession);

  fsMocks.writeFile.mockResolvedValue(undefined);
  fsMocks.mkdir.mockResolvedValue(undefined);

  specGenMocks.generateSpec.mockReturnValue(ROUTING_GENERATED_SPEC);
  specGenMocks.serializeSpec.mockReturnValue(ROUTING_SERIALIZED_SPEC);

  // bug-mode: collision bug — segment 0 stayed at x=0.
  // fixed-mode: drag worked — segment 0 ended at x=100.
  harnessMocks.getStateSnapshot
    .mockReturnValueOnce({ 'segments[0].x': 0 })
    .mockReturnValueOnce({ 'segments[0].x': 100 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('runner selectAdapter — vendor routing', () => {
  // ── TC10: vendor 'cuit' → normalizeCuitSession, NOT normalizeJamSession ──────

  test('runner routes by session.vendor: a vendor cuit fixture invokes normalizeCuitSession and NOT normalizeJamSession', async () => {
    fsMocks.readFile.mockResolvedValue(JSON.stringify(CUIT_RAW_SESSION));
    cuitAdapterMocks.normalizeCuitSession.mockReturnValue(NORMALIZED_NAV_EVENTS);

    // Dynamic import after vi.resetModules() gives a fresh runner instance that
    // respects the vi.mock() stubs registered at file scope.
    const { runProofLoop } = await import('../../runner/src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(cuitAdapterMocks.normalizeCuitSession).toHaveBeenCalledTimes(1);
    expect(cuitAdapterMocks.normalizeCuitSession).toHaveBeenCalledWith(
      CUIT_RAW_SESSION,
    );
    expect(jamAdapterMocks.normalizeJamSession).toHaveBeenCalledTimes(0);
  });

  // ── TC11: vendor 'jam' still routes to normalizeJamSession (no regression) ───

  test('runner still routes vendor jam fixtures to normalizeJamSession (no regression)', async () => {
    fsMocks.readFile.mockResolvedValue(JSON.stringify(JAM_RAW_SESSION));
    jamAdapterMocks.normalizeJamSession.mockReturnValue(NORMALIZED_NAV_EVENTS);

    const { runProofLoop } = await import('../../runner/src/index.js');

    const result = await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(jamAdapterMocks.normalizeJamSession).toHaveBeenCalledTimes(1);
    expect(jamAdapterMocks.normalizeJamSession).toHaveBeenCalledWith(
      JAM_RAW_SESSION,
    );
    expect(cuitAdapterMocks.normalizeCuitSession).toHaveBeenCalledTimes(0);

    // Canonical 6-step lifecycle must remain intact for jam sessions.
    const CANONICAL_STEPS = [
      'load',
      'normalize',
      'generate',
      'run-bug-RED',
      'run-fixed-GREEN',
      'write-ci-yaml',
    ];
    expect(result.steps).toEqual(CANONICAL_STEPS);
  });

  // ── TC12: unknown vendor → clear named error ──────────────────────────────────

  test('runner throws a clear error for an unrecognized vendor (datadog-rum)', async () => {
    const unknownVendorSession = {
      sessionId: 'dd-sess-001',
      vendor: 'datadog-rum',
      createdAt: 1716800000000,
      url: 'http://localhost:5173/',
      events: [],
    };
    fsMocks.readFile.mockResolvedValue(JSON.stringify(unknownVendorSession));

    const { runProofLoop } = await import('../../runner/src/index.js');

    await expect(
      runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR }),
    ).rejects.toThrow(/no adapter|unsupported vendor|unknown vendor/i);
  });
});
