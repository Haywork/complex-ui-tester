import { describe, expect, test } from 'vitest';
import type {
  ConsoleEvent,
  ErrorEvent,
  GeneratedSpec,
  SessionEvent,
} from '@haywork/cuit-types';
import { generateSpec, serializeSpec } from '../src/index.js';
import {
  SEGMENT_COLLISION_EVENTS,
  SEGMENT_COLLISION_START_TS,
} from './fixtures/segment-collision-events.js';

// ---------------------------------------------------------------------------
// NOTE: These are FAILING tests written before the implementation is complete.
// They drive the TDD cycle for the "console errors as assertion signal" feature.
//
// To make them green, update generateSpec and serializeSpec so that:
//   1. generateSpec detects error signals straddling the interaction window and
//      emits an { kind: 'assertNoConsoleErrors', count: N } primitive (carrying
//      the number of straddling errors as metadata for diagnostics).
//   2. serializeSpec, when that primitive is present, imports and calls
//      restoreConsoleErrors() after assertNoConsoleErrors() for cleanup.
// ---------------------------------------------------------------------------

// The collision fixture's drag spans pointer-down at +100ms through
// pointer-up at +400ms (relative to START_TS). Mid-drag is +250ms; events
// before the drag and after pointer-up are outside the interaction window.
const DRAG_START_OFFSET = 100;
const DRAG_END_OFFSET = 400;
const MID_DRAG_OFFSET = 250;

const primitiveKinds = (events: SessionEvent[]): string[] =>
  generateSpec(events).primitives.map((p) => p.kind);

// Pull the assertNoConsoleErrors primitive out of a generated spec and return it,
// or undefined when absent.
const findGuardPrimitive = (spec: GeneratedSpec) =>
  spec.primitives.find((p) => p.kind === 'assertNoConsoleErrors') as
    | { kind: 'assertNoConsoleErrors'; count: number }
    | undefined;

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

const consoleError = (
  seq: number,
  tsOffset: number,
  text: string,
): ConsoleEvent => ({
  seq,
  vendor: 'jam',
  vendorEventId: `jam-sess-2014-console-${seq}`,
  ts: SEGMENT_COLLISION_START_TS + tsOffset,
  wallClock: SEGMENT_COLLISION_START_TS + tsOffset,
  type: 'console',
  level: 'error',
  args: [text],
});

const consoleWarn = (
  seq: number,
  tsOffset: number,
  text: string,
): ConsoleEvent => ({
  seq,
  vendor: 'jam',
  vendorEventId: `jam-sess-2014-console-${seq}`,
  ts: SEGMENT_COLLISION_START_TS + tsOffset,
  wallClock: SEGMENT_COLLISION_START_TS + tsOffset,
  type: 'console',
  level: 'warn',
  args: [text],
});

const errorEvent = (
  seq: number,
  tsOffset: number,
  message: string,
): ErrorEvent => ({
  seq,
  vendor: 'jam',
  vendorEventId: `jam-sess-2014-error-${seq}`,
  ts: SEGMENT_COLLISION_START_TS + tsOffset,
  wallClock: SEGMENT_COLLISION_START_TS + tsOffset,
  type: 'error-event',
  message,
  source: 'window.onerror',
});

const withEvent = (extra: SessionEvent): SessionEvent[] => [
  ...SEGMENT_COLLISION_EVENTS,
  extra,
];

// ---------------------------------------------------------------------------
// generateSpec — primitive emission with error count metadata
// ---------------------------------------------------------------------------

describe('generateSpec — console-error regression signal', () => {
  test('adds assertNoConsoleErrors when a console.error straddles the drag', () => {
    const events = withEvent(
      consoleError(100, MID_DRAG_OFFSET, 'collision detected: noop'),
    );

    // The primitive must carry count=1 so diagnostics can report how many
    // console errors were captured during the interaction.
    expect(findGuardPrimitive(generateSpec(events))).toEqual({
      kind: 'assertNoConsoleErrors',
      count: 1,
    });
  });

  test('adds assertNoConsoleErrors when an uncaught error straddles the drag', () => {
    const events = withEvent(
      errorEvent(100, MID_DRAG_OFFSET, 'TypeError: cannot read x of undefined'),
    );

    expect(findGuardPrimitive(generateSpec(events))).toEqual({
      kind: 'assertNoConsoleErrors',
      count: 1,
    });
  });

  test('appends the assertion after assertStateEquals, not replacing it', () => {
    const events = withEvent(consoleError(100, MID_DRAG_OFFSET, 'boom'));

    expect(primitiveKinds(events)).toEqual([
      'goto',
      'setClock',
      'getStateSnapshot',
      'dispatchDrag',
      'getStateSnapshot',
      'assertStateEquals',
      'assertNoConsoleErrors',
    ]);
  });

  test('a clean session emits no assertNoConsoleErrors primitive', () => {
    expect(findGuardPrimitive(generateSpec(SEGMENT_COLLISION_EVENTS))).toBeUndefined();
  });

  test('count reflects the number of straddling error signals — two errors yield count=2', () => {
    const events = [
      ...SEGMENT_COLLISION_EVENTS,
      consoleError(100, MID_DRAG_OFFSET, 'first'),
      consoleError(101, MID_DRAG_OFFSET + 10, 'second'),
    ];

    // count captures how many distinct error signals straddle the drag,
    // while the primitive itself still appears exactly once.
    expect(findGuardPrimitive(generateSpec(events))).toEqual({
      kind: 'assertNoConsoleErrors',
      count: 2,
    });
  });

  test('guard primitive appears exactly once even with multiple straddling errors', () => {
    const events = [
      ...SEGMENT_COLLISION_EVENTS,
      consoleError(100, MID_DRAG_OFFSET, 'first'),
      consoleError(101, MID_DRAG_OFFSET + 10, 'second'),
    ];

    const guards = generateSpec(events).primitives.filter(
      (p) => p.kind === 'assertNoConsoleErrors',
    );

    expect(guards).toHaveLength(1);
  });

  test('a non-error console event (warn) does not add the guard', () => {
    const events = withEvent(consoleWarn(100, MID_DRAG_OFFSET, 'just a warning'));

    expect(findGuardPrimitive(generateSpec(events))).toBeUndefined();
  });

  test('a console.error on the pointer-down boundary straddles the drag', () => {
    const events = withEvent(consoleError(100, DRAG_START_OFFSET, 'at down'));

    expect(findGuardPrimitive(generateSpec(events))).toEqual({
      kind: 'assertNoConsoleErrors',
      count: 1,
    });
  });

  test('a console.error on the pointer-up boundary straddles the drag', () => {
    const events = withEvent(consoleError(100, DRAG_END_OFFSET, 'at up'));

    expect(findGuardPrimitive(generateSpec(events))).toEqual({
      kind: 'assertNoConsoleErrors',
      count: 1,
    });
  });

  test('a console.error before the drag begins does not add the guard', () => {
    const events = withEvent(
      consoleError(100, DRAG_START_OFFSET - 50, 'before drag'),
    );

    expect(findGuardPrimitive(generateSpec(events))).toBeUndefined();
  });

  test('a console.error after pointer-up does not add the guard', () => {
    const events = withEvent(
      consoleError(100, DRAG_END_OFFSET + 50, 'after drag'),
    );

    expect(findGuardPrimitive(generateSpec(events))).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// serializeSpec — console-error guard wiring
// ---------------------------------------------------------------------------

describe('serializeSpec — console-error guard wiring', () => {
  test('emits captureConsoleErrors + assertNoConsoleErrors when guarded', () => {
    const events = withEvent(consoleError(100, MID_DRAG_OFFSET, 'boom'));
    const serialized = serializeSpec(generateSpec(events));

    expect(serialized).toContain('captureConsoleErrors,');
    expect(serialized).toContain('assertNoConsoleErrors,');
    expect(serialized).toContain('captureConsoleErrors();');
    expect(serialized).toContain('assertNoConsoleErrors();');
  });

  test('clean session serialization omits the console-error helpers', () => {
    const serialized = serializeSpec(generateSpec(SEGMENT_COLLISION_EVENTS));

    expect(serialized).not.toContain('assertNoConsoleErrors');
    expect(serialized).not.toContain('captureConsoleErrors');
  });

  test('guarded serialization imports restoreConsoleErrors from @haywork/cuit-harness', () => {
    // The generated spec must restore console.error after the test completes so
    // the spy does not bleed into subsequent tests.
    const events = withEvent(consoleError(100, MID_DRAG_OFFSET, 'boom'));
    const serialized = serializeSpec(generateSpec(events));

    expect(serialized).toContain('restoreConsoleErrors,');
  });

  test('guarded serialization calls restoreConsoleErrors() after assertNoConsoleErrors()', () => {
    // Cleanup must follow the assert so it never silences a real failure.
    const events = withEvent(consoleError(100, MID_DRAG_OFFSET, 'boom'));
    const serialized = serializeSpec(generateSpec(events));

    expect(serialized).toContain('restoreConsoleErrors();');
    const assertIdx = serialized.indexOf('assertNoConsoleErrors();');
    const restoreIdx = serialized.indexOf('restoreConsoleErrors();');
    expect(restoreIdx).toBeGreaterThan(assertIdx);
  });

  test('clean session serialization also omits restoreConsoleErrors', () => {
    const serialized = serializeSpec(generateSpec(SEGMENT_COLLISION_EVENTS));

    expect(serialized).not.toContain('restoreConsoleErrors');
  });
});
