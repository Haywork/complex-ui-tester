/**
 * Generality proof for @haywork/cuit-spec-gen.
 *
 * These tests are written BEFORE the implementation is updated. They drive the
 * TDD cycle for killing the three module-level hardcoded literals (TEST_NAME,
 * TEST_CASE_NAME, ASSERT_PATH) and the implicit assumption that every session
 * is a dispatchDrag.
 *
 * All tests in this file MUST FAIL against the current implementation.
 * Make them green by:
 *   1. Adding KeyboardEvent to @haywork/cuit-types and dispatchClick/dispatchType Primitive kinds.
 *   2. Replacing the three constants with derivation logic in generateSpec/serializeSpec.
 *   3. Implementing classifyInteraction + diffSnapshots helpers.
 */

import { describe, expect, test } from 'vitest';
import type { SessionEvent, StateSnapshotEvent } from '@haywork/cuit-types';
import { generateSpec, serializeSpec } from '../src/index.js';
import {
  SEGMENT_COLLISION_EVENTS,
  SEGMENT_COLLISION_START_TS,
} from './fixtures/segment-collision-events.js';

// ---------------------------------------------------------------------------
// Session factory helpers
// ---------------------------------------------------------------------------

const BASE_TS = 1_716_900_000_000;

/**
 * Build a minimal pointer event.
 * y is fixed at 60 throughout — pointer sessions only vary in x and phase.
 */
const pointer = (
  seq: number,
  tsOffset: number,
  phase: 'down' | 'move' | 'up',
  x: number,
  targetName: string,
  targetSelector: string,
  pointerId = 1,
): SessionEvent => ({
  seq,
  vendor: 'cuit',
  vendorEventId: `cuit-gen-${seq}`,
  ts: BASE_TS + tsOffset,
  wallClock: BASE_TS + tsOffset,
  type: 'pointer',
  phase,
  targetSelector,
  targetName,
  x,
  y: 60,
  pointerId,
});

/** Build a state-snapshot event. */
const snapshot = (
  seq: number,
  tsOffset: number,
  path: string,
  value: unknown,
): StateSnapshotEvent => ({
  seq,
  vendor: 'cuit',
  vendorEventId: `cuit-snap-${seq}`,
  ts: BASE_TS + tsOffset,
  wallClock: BASE_TS + tsOffset,
  type: 'state-snapshot',
  path,
  value,
});

/** Build a nav event. */
const nav = (seq: number, url: string): SessionEvent => ({
  seq,
  vendor: 'cuit',
  vendorEventId: `cuit-nav-${seq}`,
  ts: BASE_TS,
  wallClock: BASE_TS,
  type: 'nav',
  url,
});

/**
 * Build a keyboard/text-entry event.
 *
 * NOTE: KeyboardEvent is not yet part of @haywork/cuit-types. Adding it is part of the
 * implementation step. Until then, we cast to SessionEvent via `unknown` so
 * the test file itself compiles inside vitest's transform pipeline. The cast
 * intentionally documents the new variant the implementation must add.
 */
const keyboardEvent = (
  seq: number,
  tsOffset: number,
  targetName: string,
  targetSelector: string,
  value: string,
): SessionEvent =>
  ({
    seq,
    vendor: 'cuit',
    vendorEventId: `cuit-kbd-${seq}`,
    ts: BASE_TS + tsOffset,
    wallClock: BASE_TS + tsOffset,
    type: 'keyboard',
    targetSelector,
    targetName,
    value,
  }) as unknown as SessionEvent;

// ---------------------------------------------------------------------------
// Three hand-built sessions
// ---------------------------------------------------------------------------

/**
 * DRAG SESSION — a segment drag with pre/post snapshots where post-state is
 * identical to pre-state (the collision bug pattern). The assert value must
 * come from preValue + dx (intent), NOT the unchanged post-snapshot value.
 *
 * Oracle (independently pre-computed):
 *   targetName = 'seg-0'
 *   dx = 150 - 50 = 100
 *   preValue = 0
 *   expectedValue = 0 + 100 = 100
 *   assertPath = 'segments[0].x'
 */
const DRAG_URL = 'http://localhost:5173/editor';
const DRAG_SESSION: SessionEvent[] = [
  nav(0, DRAG_URL),
  // Pre-interaction snapshots
  snapshot(1, 10, 'segments[0].x', 0),
  snapshot(2, 11, 'segments[1].x', 200),
  // Pointer sequence: down at x=50, move to x=100, up at x=150 → dx=100
  pointer(3, 100, 'down', 50, 'seg-0', '[data-segment-id="seg-0"]'),
  pointer(4, 200, 'move', 100, 'seg-0', '[data-segment-id="seg-0"]'),
  pointer(5, 400, 'up', 150, 'seg-0', '[data-segment-id="seg-0"]'),
  // Post-interaction snapshot — unchanged (collision bug)
  snapshot(6, 500, 'segments[0].x', 0),
  snapshot(7, 501, 'segments[1].x', 200),
];

const DRAG_ORACLE = {
  assertPath: 'segments[0].x',
  assertValue: 100, // 0 + 100 (preValue + dx)
} as const;

/**
 * CLICK-TOGGLE SESSION — a click on a mute-toggle button. The boolean key
 * 'muted' flips from false → true in the post-snapshot.
 *
 * Oracle (independently pre-computed):
 *   targetName = 'toggle-mute'
 *   dx ≈ 0 (pointer down/up at same x) → click, not drag
 *   assertPath = 'muted'
 *   assertValue = true (the observed post-snapshot value)
 */
const CLICK_URL = 'http://localhost:5173/player';
const CLICK_TOGGLE_SESSION: SessionEvent[] = [
  nav(0, CLICK_URL),
  // Pre-interaction snapshots
  snapshot(1, 10, 'muted', false),
  snapshot(2, 11, 'volume', 0.8),
  // Pointer sequence: down and up at the same x position → click
  pointer(3, 100, 'down', 200, 'toggle-mute', '[data-testid="toggle-mute"]'),
  pointer(4, 150, 'up', 200, 'toggle-mute', '[data-testid="toggle-mute"]'),
  // Post-interaction snapshot — muted flipped to true
  snapshot(5, 250, 'muted', true),
  snapshot(6, 251, 'volume', 0.8),
];

const CLICK_ORACLE = {
  assertPath: 'muted',
  assertValue: true, // post-snapshot observed value
} as const;

/**
 * TEXT-ENTRY SESSION — typing into a language input field. The string key
 * 'targetLanguage' changes from '' → 'es'.
 *
 * Oracle (independently pre-computed):
 *   targetName = 'lang-input'
 *   type = 'keyboard' (text-entry interaction)
 *   assertPath = 'targetLanguage'
 *   assertValue = 'es' (the observed post-snapshot value)
 */
const TEXT_URL = 'http://localhost:5173/settings';
const TEXT_ENTRY_SESSION: SessionEvent[] = [
  nav(0, TEXT_URL),
  // Pre-interaction snapshots
  snapshot(1, 10, 'targetLanguage', ''),
  snapshot(2, 11, 'sourceLanguage', 'en'),
  // Keyboard / text-entry event
  keyboardEvent(3, 100, 'lang-input', '[data-testid="lang-input"]', 'es'),
  // Post-interaction snapshot — targetLanguage updated
  snapshot(4, 200, 'targetLanguage', 'es'),
  snapshot(5, 201, 'sourceLanguage', 'en'),
];

const TEXT_ORACLE = {
  assertPath: 'targetLanguage',
  assertValue: 'es', // post-snapshot observed value
} as const;

// ---------------------------------------------------------------------------
// 1. Drag session derives path + value from intent (delta), not the unchanged post-snapshot
// ---------------------------------------------------------------------------

describe('generateSpec — drag session', () => {
  test('derives assertPath from the snapshot key targeting the dragged segment', () => {
    const spec = generateSpec(DRAG_SESSION);

    const assertPrim = spec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );

    expect(assertPrim?.path).toEqual(DRAG_ORACLE.assertPath);
  });

  test('derives assertValue as preValue + dx (intent), not the unchanged post-snapshot value 0', () => {
    const spec = generateSpec(DRAG_SESSION);

    const assertPrim = spec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );

    // Oracle: preValue=0, dx=100 → expected=100. Post-snapshot also shows 0
    // (the bug), so if the implementation reads the post-snapshot it would
    // wrongly yield 0, making this assertion catch the regression.
    expect(assertPrim?.value).toEqual(DRAG_ORACLE.assertValue);
    expect(assertPrim?.value).not.toEqual(0);
  });

  test('expectedFinalState contains the intent-derived {path, value} pair', () => {
    const spec = generateSpec(DRAG_SESSION);

    expect(spec.expectedFinalState).toContainEqual({
      path: DRAG_ORACLE.assertPath,
      value: DRAG_ORACLE.assertValue,
    });
  });

  test('testName is derived from url + targetName + shape (not the hardcoded constant)', () => {
    const spec = generateSpec(DRAG_SESSION);

    // testName must NOT be the hardcoded string
    expect(spec.testName).not.toEqual(
      'issue-2014 — segment 0 drag must not collide-noop',
    );
    // testName must mention the target and direction/shape so it is human-readable
    expect(spec.testName).toMatch(/seg-0/i);
    expect(spec.testName).toMatch(/drag/i);
  });
});

// ---------------------------------------------------------------------------
// 2. Click-toggle session derives the changed boolean path and its observed post value
// ---------------------------------------------------------------------------

describe('generateSpec — click-toggle session', () => {
  test('derives assertPath from the boolean key that flipped between pre/post snapshots', () => {
    const spec = generateSpec(CLICK_TOGGLE_SESSION);

    const assertPrim = spec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );

    expect(assertPrim?.path).toEqual(CLICK_ORACLE.assertPath);
  });

  test('derives assertValue as the observed post-snapshot value (true)', () => {
    const spec = generateSpec(CLICK_TOGGLE_SESSION);

    const assertPrim = spec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );

    expect(assertPrim?.value).toEqual(CLICK_ORACLE.assertValue);
  });

  test('emits a dispatchClick primitive (not dispatchDrag) for a zero-delta pointer', () => {
    const spec = generateSpec(CLICK_TOGGLE_SESSION);

    const kinds = spec.primitives.map((p) => p.kind);
    expect(kinds).toContain('dispatchClick');
    expect(kinds).not.toContain('dispatchDrag');
  });

  test('testName references the target and click shape', () => {
    const spec = generateSpec(CLICK_TOGGLE_SESSION);

    expect(spec.testName).toMatch(/toggle-mute/i);
    expect(spec.testName).toMatch(/click/i);
  });

  test('assert path and testName are distinct from the drag session', () => {
    const dragSpec = generateSpec(DRAG_SESSION);
    const clickSpec = generateSpec(CLICK_TOGGLE_SESSION);

    expect(clickSpec.testName).not.toEqual(dragSpec.testName);
    const clickAssert = clickSpec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );
    const dragAssert = dragSpec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );
    expect(clickAssert?.path).not.toEqual(dragAssert?.path);
  });
});

// ---------------------------------------------------------------------------
// 3. Text-entry session derives the changed string path and its observed post value
// ---------------------------------------------------------------------------

describe('generateSpec — text-entry session', () => {
  test('derives assertPath from the string key that changed between pre/post snapshots', () => {
    const spec = generateSpec(TEXT_ENTRY_SESSION);

    const assertPrim = spec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );

    expect(assertPrim?.path).toEqual(TEXT_ORACLE.assertPath);
  });

  test('derives assertValue as the observed post-snapshot string value', () => {
    const spec = generateSpec(TEXT_ENTRY_SESSION);

    const assertPrim = spec.primitives.find(
      (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
        p.kind === 'assertStateEquals',
    );

    expect(assertPrim?.value).toEqual(TEXT_ORACLE.assertValue);
  });

  test('emits a dispatchType primitive for a keyboard/text-entry event', () => {
    const spec = generateSpec(TEXT_ENTRY_SESSION);

    const kinds = spec.primitives.map((p) => p.kind);
    expect(kinds).toContain('dispatchType');
    expect(kinds).not.toContain('dispatchDrag');
    expect(kinds).not.toContain('dispatchClick');
  });

  test('testName references the target and type shape', () => {
    const spec = generateSpec(TEXT_ENTRY_SESSION);

    expect(spec.testName).toMatch(/lang-input/i);
    expect(spec.testName).toMatch(/type/i);
  });

  test('assert path and testName are distinct from both drag and click sessions', () => {
    const dragSpec = generateSpec(DRAG_SESSION);
    const clickSpec = generateSpec(CLICK_TOGGLE_SESSION);
    const typeSpec = generateSpec(TEXT_ENTRY_SESSION);

    expect(typeSpec.testName).not.toEqual(dragSpec.testName);
    expect(typeSpec.testName).not.toEqual(clickSpec.testName);

    const getAssertPath = (
      s: ReturnType<typeof generateSpec>,
    ): string | undefined =>
      s.primitives.find(
        (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
          p.kind === 'assertStateEquals',
      )?.path;

    expect(getAssertPath(typeSpec)).not.toEqual(getAssertPath(dragSpec));
    expect(getAssertPath(typeSpec)).not.toEqual(getAssertPath(clickSpec));
  });
});

// ---------------------------------------------------------------------------
// 4. No placeholder literals survive in any generated source across all three shapes
// ---------------------------------------------------------------------------

describe('serializeSpec — no placeholder literals in generated source', () => {
  const FORBIDDEN = [
    'TEST_NAME',
    'TEST_CASE_NAME',
    'ASSERT_PATH',
    'TODO',
    'issue-2014',
  ] as const;

  test('drag session serialized source contains no placeholder literals', () => {
    const source = serializeSpec(generateSpec(DRAG_SESSION));

    for (const token of FORBIDDEN) {
      expect(source).not.toContain(token);
    }
  });

  test('click-toggle session serialized source contains no placeholder literals', () => {
    const source = serializeSpec(generateSpec(CLICK_TOGGLE_SESSION));

    for (const token of FORBIDDEN) {
      expect(source).not.toContain(token);
    }
  });

  test('text-entry session serialized source contains no placeholder literals', () => {
    const source = serializeSpec(generateSpec(TEXT_ENTRY_SESSION));

    for (const token of FORBIDDEN) {
      expect(source).not.toContain(token);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Three sessions produce three distinct specs
// ---------------------------------------------------------------------------

describe('generateSpec — three sessions produce three distinct specs', () => {
  test('all three (testName, assertPath, assertValue) tuples are unique', () => {
    const getKey = (events: SessionEvent[]): string => {
      const spec = generateSpec(events);
      const assertPrim = spec.primitives.find(
        (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
          p.kind === 'assertStateEquals',
      );
      return JSON.stringify({
        testName: spec.testName,
        assertPath: assertPrim?.path,
        assertValue: assertPrim?.value,
      });
    };

    const keys = [
      getKey(DRAG_SESSION),
      getKey(CLICK_TOGGLE_SESSION),
      getKey(TEXT_ENTRY_SESSION),
    ];

    // All three must be distinct — derivation actually varies with input
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toEqual(3);
  });

  test('each session derives its oracle assert path correctly', () => {
    const getAssertPath = (events: SessionEvent[]): unknown =>
      generateSpec(events).primitives.find(
        (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
          p.kind === 'assertStateEquals',
      )?.path;

    expect(getAssertPath(DRAG_SESSION)).toEqual(DRAG_ORACLE.assertPath);
    expect(getAssertPath(CLICK_TOGGLE_SESSION)).toEqual(CLICK_ORACLE.assertPath);
    expect(getAssertPath(TEXT_ENTRY_SESSION)).toEqual(TEXT_ORACLE.assertPath);
  });

  test('each session derives its oracle assert value correctly', () => {
    const getAssertValue = (events: SessionEvent[]): unknown =>
      generateSpec(events).primitives.find(
        (p): p is Extract<typeof p, { kind: 'assertStateEquals' }> =>
          p.kind === 'assertStateEquals',
      )?.value;

    expect(getAssertValue(DRAG_SESSION)).toEqual(DRAG_ORACLE.assertValue);
    expect(getAssertValue(CLICK_TOGGLE_SESSION)).toEqual(CLICK_ORACLE.assertValue);
    expect(getAssertValue(TEXT_ENTRY_SESSION)).toEqual(TEXT_ORACLE.assertValue);
  });
});

// ---------------------------------------------------------------------------
// 6. Existing segment-collision fixture remains green
// ---------------------------------------------------------------------------

describe('generateSpec — existing segment-collision fixture regression', () => {
  test('still yields assertStateEquals path segments[0].x value 100', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives).toContainEqual({
      kind: 'assertStateEquals',
      path: 'segments[0].x',
      value: 100,
    });
    expect(spec.expectedFinalState).toContainEqual({
      path: 'segments[0].x',
      value: 100,
    });
  });

  test('still produces the canonical primitive-kind sequence', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives.map((p) => p.kind)).toEqual([
      'goto',
      'setClock',
      'getStateSnapshot',
      'dispatchDrag',
      'getStateSnapshot',
      'assertStateEquals',
    ]);
  });

  test('setClock primitive still uses SEGMENT_COLLISION_START_TS', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives[1]).toEqual({
      kind: 'setClock',
      t: SEGMENT_COLLISION_START_TS,
    });
  });

  test('testName is derived and no longer the hardcoded issue-2014 constant', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    // After the implementation lands, testName must be derived from session data.
    // Until then this confirms the constant is still present (this sub-test
    // itself goes RED when the hardcoded constant is removed and derivation lands).
    expect(spec.testName).not.toEqual(
      'issue-2014 — segment 0 drag must not collide-noop',
    );
  });
});

// ---------------------------------------------------------------------------
// 7. Serialized drag output emits the computed dispatchDrag call
// ---------------------------------------------------------------------------

describe('serializeSpec — drag session emits dispatchDrag with derived values', () => {
  test("serialized drag contains \"dispatchDrag('seg-0', 100, 0)\"", () => {
    const source = serializeSpec(generateSpec(DRAG_SESSION));

    expect(source).toContain("dispatchDrag('seg-0', 100, 0)");
  });

  test('serialized drag contains toEqual(100)', () => {
    const source = serializeSpec(generateSpec(DRAG_SESSION));

    expect(source).toContain('toEqual(100)');
  });

  test('serialized click-toggle contains dispatchClick', () => {
    const source = serializeSpec(generateSpec(CLICK_TOGGLE_SESSION));

    expect(source).toContain('dispatchClick');
  });

  test('serialized text-entry contains dispatchType', () => {
    const source = serializeSpec(generateSpec(TEXT_ENTRY_SESSION));

    expect(source).toContain('dispatchType');
  });

  test('serialized drag testName and inner test name are derived (not hardcoded)', () => {
    const source = serializeSpec(generateSpec(DRAG_SESSION));

    // The hardcoded inner test name must not survive serialization
    expect(source).not.toContain(
      'drags segment 0 right by 100px and asserts state moves',
    );
    // A human-readable description mentioning the target must be present
    expect(source).toMatch(/seg-0/i);
  });
});
