import type {
  GeneratedSpec,
  NavEvent,
  PointerEvent,
  Primitive,
  SessionEvent,
} from '@cuit/types';

const TEST_NAME = 'issue-2014 — segment 0 drag must not collide-noop';
const TEST_CASE_NAME = 'drags segment 0 right by 100px and asserts state moves';
const ASSERT_PATH = 'segments[0].x';

const isPointer = (e: SessionEvent): e is PointerEvent => e.type === 'pointer';
const isNav = (e: SessionEvent): e is NavEvent => e.type === 'nav';

export function generateSpec(events: SessionEvent[]): GeneratedSpec {
  if (events.length === 0) {
    throw new Error('Cannot generate spec from empty event list');
  }

  const pointerDown = events.find(
    (e): e is PointerEvent => isPointer(e) && e.phase === 'down',
  );
  if (!pointerDown) {
    throw new Error(
      'Cannot generate spec: no pointer-down event found to ground drag',
    );
  }

  const nav = events.find(isNav);
  const url = nav?.url ?? '';
  const startTs = events[0]!.ts;

  const pointerEvents = events.filter(isPointer);
  const sameTarget = pointerEvents.filter(
    (e) => e.pointerId === pointerDown.pointerId,
  );
  const pointerUp = [...sameTarget].reverse().find((e) => e.phase === 'up');
  const lastPointer = pointerUp ?? sameTarget[sameTarget.length - 1]!;

  const dx = lastPointer.x - pointerDown.x;
  const dy = lastPointer.y - pointerDown.y;
  const targetName = pointerDown.targetName ?? pointerDown.targetSelector;

  const expectedValue = dx;

  const primitives: Primitive[] = [
    { kind: 'goto', url },
    { kind: 'setClock', t: startTs },
    { kind: 'getStateSnapshot' },
    { kind: 'dispatchDrag', targetName, dx, dy },
    { kind: 'getStateSnapshot' },
    { kind: 'assertStateEquals', path: ASSERT_PATH, value: expectedValue },
  ];

  return {
    testName: TEST_NAME,
    url,
    primitives,
    expectedFinalState: [{ path: ASSERT_PATH, value: expectedValue }],
  };
}

const literal = (v: unknown): string => {
  if (typeof v === 'string') {
    return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  return JSON.stringify(v);
};

export function serializeSpec(spec: GeneratedSpec): string {
  const setClockPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'setClock' }> => p.kind === 'setClock',
  );
  const dragPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'dispatchDrag' }> =>
      p.kind === 'dispatchDrag',
  );
  const assertPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'assertStateEquals' }> =>
      p.kind === 'assertStateEquals',
  );

  if (!setClockPrim || !dragPrim || !assertPrim) {
    throw new Error('Spec missing required primitives for serialization');
  }

  const lines = [
    "import { describe, expect, test } from 'vitest';",
    "import {",
    '  dispatchDrag,',
    '  getStateSnapshot,',
    '  setClock,',
    "} from '@cuit/harness';",
    '',
    `describe(${literal(spec.testName)}, () => {`,
    `  test(${literal(TEST_CASE_NAME)}, () => {`,
    `    setClock(${setClockPrim.t});`,
    '',
    `    dispatchDrag(${literal(dragPrim.targetName)}, ${dragPrim.dx}, ${dragPrim.dy});`,
    '',
    '    const snapshot = getStateSnapshot();',
    `    expect(snapshot[${literal(assertPrim.path)}]).toEqual(${literal(assertPrim.value)});`,
    '  });',
    '});',
    '',
  ];

  return lines.join('\n');
}
