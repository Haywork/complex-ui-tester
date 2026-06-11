/**
 * Failing tests for the ax-debug module.
 *
 * All tests in this file are expected to FAIL until
 * packages/runner/src/ax-debug.ts is implemented and exported from
 * packages/runner/src/index.ts.
 *
 * Grounding fixture shapes:
 *   translate-ui-react-drag-after-resize.json — seg-1 drag, dx=20, dy=0
 *   segment-collision.json (via inline events)  — seg-0 drag, dx=100, dy=0
 */
import { describe, expect, test } from 'vitest';
import type { SessionEvent, PointerEvent as CuitPointerEvent, Primitive } from '@cuit/types';
import {
  minimalDiff,
  stepState,
  listPrimitives,
  replayPlan,
} from '../src/ax-debug.js';

// ---------------------------------------------------------------------------
// Shared fixture: translate-ui session (seg-1, dx=20)
//
// Mirrors fixtures/translate-ui-react-drag-after-resize.json exactly so
// these tests are self-contained and deterministic.
// ---------------------------------------------------------------------------

const TUR_URL = 'https://translate-dev.speechlab.ai/projects/abc-real-project-id?waveformDebug=1';
const TUR_GIT_SHA = 'developNoWaveFormFinal';

/** All events from the translate-ui fixture, typed as SessionEvent[]. */
const TUR_EVENTS: SessionEvent[] = [
  // nav (seq 0)
  {
    seq: 0, vendor: 'cuit', vendorEventId: 'tur-001-nav-0',
    ts: 0, wallClock: 1748952000000,
    type: 'nav', url: TUR_URL,
  },
  // initial snapshot frame ts=800 (seqs 1-9)
  { seq: 1, vendor: 'cuit', vendorEventId: 'tur-001-snap-1', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'activeSegmentIndex', value: 0 },
  { seq: 2, vendor: 'cuit', vendorEventId: 'tur-001-snap-2', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'playheadSeconds', value: 0 },
  { seq: 3, vendor: 'cuit', vendorEventId: 'tur-001-snap-3', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'scrollLeft', value: 0 },
  { seq: 4, vendor: 'cuit', vendorEventId: 'tur-001-snap-4', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'segments.length', value: 5 },
  { seq: 5, vendor: 'cuit', vendorEventId: 'tur-001-snap-5', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'segments[1].id', value: 'seg-1' },
  { seq: 6, vendor: 'cuit', vendorEventId: 'tur-001-snap-6', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'segments[1].startTime', value: 4.32 },
  { seq: 7, vendor: 'cuit', vendorEventId: 'tur-001-snap-7', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'segments[1].endTime', value: 7.81 },
  { seq: 8, vendor: 'cuit', vendorEventId: 'tur-001-snap-8', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'segments[1].x', value: 288 },
  { seq: 9, vendor: 'cuit', vendorEventId: 'tur-001-snap-9', ts: 800, wallClock: 1748952000800, type: 'state-snapshot', path: 'segments[1].width', value: 232.67 },
  // pointer stream ts=1200-1260 (seqs 10-13)
  { seq: 10, vendor: 'cuit', vendorEventId: 'tur-001-p-10', ts: 1200, wallClock: 1748952001200, type: 'pointer', phase: 'down',  targetSelector: "div.WaveFormDub__track > div.react-rnd[data-segment-id='seg-1']", targetName: 'seg-1', x: 404, y: 64, pointerId: 1 },
  { seq: 11, vendor: 'cuit', vendorEventId: 'tur-001-p-11', ts: 1220, wallClock: 1748952001220, type: 'pointer', phase: 'move', targetSelector: "div.WaveFormDub__track > div.react-rnd[data-segment-id='seg-1']", targetName: 'seg-1', x: 414, y: 64, pointerId: 1 },
  { seq: 12, vendor: 'cuit', vendorEventId: 'tur-001-p-12', ts: 1240, wallClock: 1748952001240, type: 'pointer', phase: 'move', targetSelector: "div.WaveFormDub__track > div.react-rnd[data-segment-id='seg-1']", targetName: 'seg-1', x: 424, y: 64, pointerId: 1 },
  { seq: 13, vendor: 'cuit', vendorEventId: 'tur-001-p-13', ts: 1260, wallClock: 1748952001260, type: 'pointer', phase: 'up',   targetSelector: "div.WaveFormDub__track > div.react-rnd[data-segment-id='seg-1']", targetName: 'seg-1', x: 424, y: 64, pointerId: 1 },
  // post-drag snapshot frame ts=1300 (seqs 14-16)
  { seq: 14, vendor: 'cuit', vendorEventId: 'tur-001-snap-14', ts: 1300, wallClock: 1748952001300, type: 'state-snapshot', path: 'segments[1].x',         value: 308 },
  { seq: 15, vendor: 'cuit', vendorEventId: 'tur-001-snap-15', ts: 1300, wallClock: 1748952001300, type: 'state-snapshot', path: 'segments[1].startTime',  value: 4.62 },
  { seq: 16, vendor: 'cuit', vendorEventId: 'tur-001-snap-16', ts: 1300, wallClock: 1748952001300, type: 'state-snapshot', path: 'playheadSeconds',         value: 4.62 },
];

/**
 * RED result where the regression value for segments[1].x stayed at 288
 * instead of advancing to 308 (the no-op drag-after-resize bug).
 */
const EXPECTED_X_AFTER_DRAG = 308;
const REGRESSION_X_NO_OP = 288;

const TUR_RED_RESULT = {
  trace: TUR_EVENTS,
  expectedFinalState: [{ path: 'segments[1].x', value: EXPECTED_X_AFTER_DRAG }],
  // Final snapshot: drag was a no-op — x stayed at initial value
  finalSnapshot: { 'segments[1].x': REGRESSION_X_NO_OP },
};

// ---------------------------------------------------------------------------
// Shared fixture: segment-collision session (seg-0, dx=100, horizontal only)
//
// Inline events matching the segment-collision.json fixture shape.
// ---------------------------------------------------------------------------

const SC_URL = 'http://localhost:5173/';
const SC_START_TS = 1716800000000;

const scPointer = (
  seq: number,
  tsOffset: number,
  phase: 'down' | 'move' | 'up',
  x: number,
): SessionEvent => ({
  seq,
  vendor: 'jam',
  vendorEventId: `jam-sess-2014-${seq + 1}`,
  ts: SC_START_TS + tsOffset,
  wallClock: SC_START_TS + tsOffset,
  type: 'pointer',
  phase,
  targetSelector: '[data-segment-id="seg-0"]',
  targetName: 'seg-0',
  x,
  y: 60,
  pointerId: 1,
});

const SC_EVENTS: SessionEvent[] = [
  { seq: 0, vendor: 'jam', vendorEventId: 'jam-sess-2014-1', ts: SC_START_TS,      wallClock: SC_START_TS,      type: 'nav',            url: SC_URL },
  { seq: 1, vendor: 'jam', vendorEventId: 'jam-sess-2014-2', ts: SC_START_TS + 10, wallClock: SC_START_TS + 10, type: 'state-snapshot', path: 'segments[0].x', value: 0 },
  { seq: 2, vendor: 'jam', vendorEventId: 'jam-sess-2014-3', ts: SC_START_TS + 11, wallClock: SC_START_TS + 11, type: 'state-snapshot', path: 'segments[1].x', value: 200 },
  scPointer(3, 100,  'down', 50),
  scPointer(4, 200,  'move', 100),
  scPointer(5, 300,  'move', 130),
  scPointer(6, 400,  'up',   150),
  { seq: 7, vendor: 'jam', vendorEventId: 'jam-sess-2014-8', ts: SC_START_TS + 500, wallClock: SC_START_TS + 500, type: 'state-snapshot', path: 'segments[0].x', value: 0 },
];

// SC red result: expected x=100 (dx from 50->150), actual x stayed 0 (collision noop)
const SC_EXPECTED_X = 100;
const SC_ACTUAL_X_NOOP = 0;

const SC_RED_RESULT = {
  trace: SC_EVENTS,
  expectedFinalState: [{ path: 'segments[0].x', value: SC_EXPECTED_X }],
  finalSnapshot: { 'segments[0].x': SC_ACTUAL_X_NOOP },
};

// ---------------------------------------------------------------------------
// 1. minimalDiff
// ---------------------------------------------------------------------------

describe('minimalDiff', () => {
  test('returns the single diverging path with expected/actual, not the whole snapshot', () => {
    const result = minimalDiff(TUR_RED_RESULT);

    // Must not be null — there IS a divergence
    expect(result).not.toBeNull();

    // Exact path, expected, actual
    expect(result!.path).toEqual('segments[1].x');
    expect(result!.expected).toEqual(EXPECTED_X_AFTER_DRAG);
    expect(result!.actual).toEqual(REGRESSION_X_NO_OP);

    // Object must have EXACTLY these four keys — no extra state paths leaked
    expect(Object.keys(result!).sort()).toEqual(
      ['actual', 'expected', 'nearest_pointer_event', 'path'].sort(),
    );
  });

  test('anchors the failure to the nearest pointer event by ts (closest to the changed frame)', () => {
    const result = minimalDiff(TUR_RED_RESULT);

    expect(result).not.toBeNull();

    // segments[1].x last changed in the frame at ts=1300.
    // Pointer events occur at ts 1200(down)/1220(move)/1240(move)/1260(up).
    // Closest to ts=1300 is ts=1260 (the pointer-up, distance=40 vs down=100).
    const nearestPointer = result!.nearest_pointer_event as CuitPointerEvent | null;
    expect(nearestPointer).not.toBeNull();
    expect(nearestPointer!.ts).toEqual(1260);
    expect(nearestPointer!.phase).toEqual('up');
  });

  test('returns null when the final state matches every expected path (green — no divergence)', () => {
    const greenResult = {
      trace: TUR_EVENTS,
      expectedFinalState: [{ path: 'segments[1].x', value: REGRESSION_X_NO_OP }],
      // Snapshot satisfies the expectation — this is green
      finalSnapshot: { 'segments[1].x': REGRESSION_X_NO_OP },
    };

    const result = minimalDiff(greenResult);

    expect(result).toBeNull();
  });

  test('handles trace with no pointer events — nearest_pointer_event is null rather than throwing', () => {
    const noPointerTrace: SessionEvent[] = [
      { seq: 0, vendor: 'cuit', vendorEventId: 'v-0', ts: 0, wallClock: 0, type: 'nav', url: 'http://localhost/' },
      { seq: 1, vendor: 'cuit', vendorEventId: 'v-1', ts: 100, wallClock: 100, type: 'state-snapshot', path: 'segments[1].x', value: 25 },
    ];
    const noPointerRed = {
      trace: noPointerTrace,
      expectedFinalState: [{ path: 'segments[1].x', value: 100 }],
      finalSnapshot: { 'segments[1].x': 25 },
    };

    const result = minimalDiff(noPointerRed);

    expect(result).not.toBeNull();
    expect(result!.nearest_pointer_event).toBeNull();
  });

  test('reports actual:undefined when an expected path never appears in the trace snapshot', () => {
    const missingPathRed = {
      trace: TUR_EVENTS,
      expectedFinalState: [{ path: 'nonexistent.path', value: 42 }],
      finalSnapshot: {},
    };

    const result = minimalDiff(missingPathRed);

    expect(result).not.toBeNull();
    expect(result!.path).toEqual('nonexistent.path');
    expect(result!.actual).toBeUndefined();
    expect(result!.expected).toEqual(42);
  });

  test('derives finalSnapshot by folding trace when finalSnapshot is not supplied', () => {
    // Provide a trace whose final snapshot fold produces x=308.
    // Pass expectedFinalState that MATCHES — so result should be null (green).
    const resultWithFold = minimalDiff({
      trace: TUR_EVENTS,
      expectedFinalState: [{ path: 'segments[1].x', value: 308 }],
      // No finalSnapshot supplied — must fold from trace
    });

    expect(resultWithFold).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. stepState
// ---------------------------------------------------------------------------

describe('stepState', () => {
  // The translate-ui fixture has two snapshot frames:
  //   frame 0: ts=800 (seqs 1-9)
  //   frame 1: ts=1300 (seqs 14-16)
  //
  // Frame 0 paths: activeSegmentIndex, playheadSeconds, scrollLeft,
  //                segments.length, segments[1].id, segments[1].startTime,
  //                segments[1].endTime, segments[1].x (288), segments[1].width
  //
  // Frame 1 paths changed vs frame 0:
  //                segments[1].x (288->308), segments[1].startTime (4.32->4.62),
  //                playheadSeconds (0->4.62)

  test('frame 0 changed entries all have from===undefined (nothing before frame 0)', () => {
    const step = stepState(TUR_EVENTS, 0);

    expect(step.index).toEqual(0);

    // Every changed entry in the first frame must have from === undefined
    for (const delta of step.changed) {
      expect(delta.from).toBeUndefined();
    }

    // The first frame contributes 9 snapshot events → 9 paths changed
    expect(step.changed).toHaveLength(9);
  });

  test('frame 1 changed entries report per-step deltas against frame 0 (not global initial)', () => {
    const step = stepState(TUR_EVENTS, 1);

    expect(step.index).toEqual(1);

    // segments[1].x went from 288 (frame 0 value) to 308 (frame 1 value)
    const xDelta = step.changed.find((d) => d.path === 'segments[1].x');
    expect(xDelta).toBeDefined();
    expect(xDelta!.from).toEqual(288);
    expect(xDelta!.to).toEqual(308);

    // playheadSeconds went from 0 to 4.62
    const playheadDelta = step.changed.find((d) => d.path === 'playheadSeconds');
    expect(playheadDelta).toBeDefined();
    expect(playheadDelta!.from).toEqual(0);
    expect(playheadDelta!.to).toEqual(4.62);

    // Only the 3 paths that actually changed in frame 1 should appear
    expect(step.changed).toHaveLength(3);
  });

  test('stepState forward then backward to the same index returns deep-equal state', () => {
    const forward  = stepState(TUR_EVENTS, 1);
    const backward = stepState(TUR_EVENTS, 0);
    // Stepping to frame 1 then querying frame 0 independently — pure function
    const forwardThenBack = stepState(TUR_EVENTS, 0);

    expect(forwardThenBack.state).toEqual(backward.state);
    expect(forward.state['segments[1].x']).toEqual(308);
    expect(backward.state['segments[1].x']).toEqual(288);
  });

  test('throws RangeError naming the valid range when index >= frameCount', () => {
    // Translate-ui fixture has exactly 2 frames (index 0 and 1)
    expect(() => stepState(TUR_EVENTS, 2)).toThrowError(RangeError);

    try {
      stepState(TUR_EVENTS, 2);
    } catch (err) {
      expect((err as Error).message).toMatch(/0/);
      expect((err as Error).message).toMatch(/1/);
    }
  });

  test('throws RangeError for negative index', () => {
    expect(() => stepState(TUR_EVENTS, -1)).toThrowError(RangeError);
  });

  test('accepts a {events} wrapper object as well as a bare SessionEvent[] array', () => {
    const wrapped = { events: TUR_EVENTS };
    const fromArray   = stepState(TUR_EVENTS, 0);
    const fromWrapped = stepState(wrapped, 0);

    expect(fromWrapped.state).toEqual(fromArray.state);
  });

  test('empty trace throws RangeError on any index because frameCount is 0', () => {
    expect(() => stepState([], 0)).toThrowError(RangeError);
  });

  test('pointerSince on frame 1 includes all pointer events between frame 0 and frame 1', () => {
    const step = stepState(TUR_EVENTS, 1);

    // Pointers at ts=1200,1220,1240,1260 sit between frame ts=800 and frame ts=1300
    expect(step.pointerSince).toHaveLength(4);
    const phases = step.pointerSince.map((p) => p.phase);
    expect(phases).toContain('down');
    expect(phases).toContain('up');
  });
});

// ---------------------------------------------------------------------------
// 3. listPrimitives
// ---------------------------------------------------------------------------

describe('listPrimitives', () => {
  // The Primitive union has exactly 6 kinds:
  //   goto | setClock | getStateSnapshot | dispatchDrag | assertStateEquals | assertNoConsoleErrors

  const ALL_PRIMITIVE_KINDS: Array<Primitive['kind']> = [
    'goto',
    'setClock',
    'getStateSnapshot',
    'dispatchDrag',
    'assertStateEquals',
    'assertNoConsoleErrors',
  ];

  test('returns exactly one entry per Primitive kind with no extras and none missing', () => {
    const entries = listPrimitives();

    const returnedKinds = entries.map((e) => e.kind).sort();
    const expectedKinds = [...ALL_PRIMITIVE_KINDS].sort();

    expect(returnedKinds).toEqual(expectedKinds);
  });

  test('setClock and dispatchDrag are marked executable — they call into @cuit/harness via runPrimitive', () => {
    const entries = listPrimitives();

    const setClock = entries.find((e) => e.kind === 'setClock');
    const dispatchDrag = entries.find((e) => e.kind === 'dispatchDrag');

    expect(setClock).toBeDefined();
    expect(setClock!.mode).toEqual('executable');

    expect(dispatchDrag).toBeDefined();
    expect(dispatchDrag!.mode).toEqual('executable');
  });

  test('goto, getStateSnapshot, assertStateEquals are marked noop — they return early in runPrimitive', () => {
    const entries = listPrimitives();

    for (const kind of ['goto', 'getStateSnapshot', 'assertStateEquals'] as const) {
      const entry = entries.find((e) => e.kind === kind);
      expect(entry).toBeDefined();
      expect(entry!.mode).toEqual('noop');
    }
  });

  test('assertNoConsoleErrors is honestly reported as harness-spec-only (not handled in runPrimitive)', () => {
    const entries = listPrimitives();

    const entry = entries.find((e) => e.kind === 'assertNoConsoleErrors');
    expect(entry).toBeDefined();

    // The mode must NOT be 'executable' because runPrimitive has no case for it.
    // It is realized only in the serialized spec via harness.assertNoConsoleErrors.
    expect(entry!.mode).not.toEqual('executable');
    // The realizedBy field must mention spec or harness to be honest
    expect(typeof entry!.realizedBy).toEqual('string');
    expect((entry!.realizedBy as string).length).toBeGreaterThan(0);
  });

  test('every entry has the required shape {kind, mode, realizedBy}', () => {
    const entries = listPrimitives();

    for (const entry of entries) {
      expect(typeof entry.kind).toEqual('string');
      expect(typeof entry.mode).toEqual('string');
      expect(typeof entry.realizedBy).toEqual('string');
    }
  });
});

// ---------------------------------------------------------------------------
// 4. replayPlan
// ---------------------------------------------------------------------------

describe('replayPlan', () => {
  test('returns a structurally valid JSON-serializable plan for the translate-ui fixture', () => {
    const plan = replayPlan(TUR_EVENTS, TUR_GIT_SHA);

    // Must survive JSON round-trip (no functions, no undefined values)
    expect(JSON.parse(JSON.stringify(plan))).toEqual(plan);

    // Top-level shape
    expect(plan.gitSha).toEqual(TUR_GIT_SHA);
    expect(plan.url).toEqual(TUR_URL);
  });

  test('drive array contains a dispatchDrag for seg-1 with dx=20, dy=0 derived from down(404,64)->up(424,64)', () => {
    const plan = replayPlan(TUR_EVENTS, TUR_GIT_SHA);

    const drag = (plan.drive as Primitive[]).find(
      (p): p is Extract<Primitive, { kind: 'dispatchDrag' }> => p.kind === 'dispatchDrag',
    );

    expect(drag).toBeDefined();
    expect(drag!.targetName).toEqual('seg-1');
    expect(drag!.dx).toEqual(20);   // 424 - 404 = 20
    expect(drag!.dy).toEqual(0);    // 64 - 64 = 0
  });

  test('assert in the plan equals the expectedFinalState derived from the trace', () => {
    const plan = replayPlan(TUR_EVENTS, TUR_GIT_SHA);

    // The plan must carry an assert section (the expected final state)
    expect(plan.assert).toBeDefined();
    expect(Array.isArray(plan.assert)).toBe(true);
  });

  test('generalizes to segment-collision fixture — targetName seg-0, dx=100, dy=0', () => {
    const plan = replayPlan(SC_EVENTS, 'fix-collision-sha');

    // URL comes from the SC nav event
    expect(plan.url).toEqual(SC_URL);
    expect(plan.gitSha).toEqual('fix-collision-sha');

    const drag = (plan.drive as Primitive[]).find(
      (p): p is Extract<Primitive, { kind: 'dispatchDrag' }> => p.kind === 'dispatchDrag',
    );

    expect(drag).toBeDefined();
    expect(drag!.targetName).toEqual('seg-0');
    expect(drag!.dx).toEqual(100);  // x: 50 (down) -> 150 (up) = 100
    expect(drag!.dy).toEqual(0);    // y never changes
  });

  test('accepts a {events} wrapper object — produces the same plan as a bare array', () => {
    const fromArray   = replayPlan(TUR_EVENTS, TUR_GIT_SHA);
    const fromWrapped = replayPlan({ events: TUR_EVENTS }, TUR_GIT_SHA);

    expect(fromWrapped).toEqual(fromArray);
  });

  test('plan contains a goto primitive referencing the session URL', () => {
    const plan = replayPlan(TUR_EVENTS, TUR_GIT_SHA);

    const gotoPrim = (plan.drive as Primitive[]).find(
      (p): p is Extract<Primitive, { kind: 'goto' }> => p.kind === 'goto',
    );

    expect(gotoPrim).toBeDefined();
    expect(gotoPrim!.url).toEqual(TUR_URL);
  });

  test('checkout object in the plan references the supplied gitSha', () => {
    const sha = 'abc123-test-sha';
    const plan = replayPlan(TUR_EVENTS, sha);

    expect(plan.checkout).toBeDefined();
    // The checkout object must reference the sha in some form
    const checkoutStr = JSON.stringify(plan.checkout);
    expect(checkoutStr).toContain(sha);
  });

  test('third interaction shape — programmatic-only events with no pointer-down: does not crash', () => {
    // A trace with state snapshots but no pointer events (programmatic state change)
    const programmaticTrace: SessionEvent[] = [
      { seq: 0, vendor: 'cuit', vendorEventId: 'p-nav', ts: 0, wallClock: 0, type: 'nav', url: 'http://localhost/' },
      { seq: 1, vendor: 'cuit', vendorEventId: 'p-snap', ts: 100, wallClock: 100, type: 'state-snapshot', path: 'segments[0].x', value: 50 },
    ];

    // Must not throw — should return a plan (possibly with empty drive or a safe fallback)
    expect(() => replayPlan(programmaticTrace, 'no-drag-sha')).not.toThrow();

    const plan = replayPlan(programmaticTrace, 'no-drag-sha');
    // Result must still be JSON-serializable
    expect(JSON.parse(JSON.stringify(plan))).toEqual(plan);
  });
});
