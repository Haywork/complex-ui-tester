import {
  type ConsoleEvent,
  type ErrorEvent,
  type GeneratedSpec,
  isConsoleEvent,
  isErrorEvent,
  type NavEvent,
  type PointerEvent,
  type Primitive,
  type SessionEvent,
} from '@cuit/types';

const TEST_NAME = 'issue-2014 — segment 0 drag must not collide-noop';
const TEST_CASE_NAME = 'drags segment 0 right by 100px and asserts state moves';
const ASSERT_PATH = 'segments[0].x';

const isPointer = (e: SessionEvent): e is PointerEvent => e.type === 'pointer';
const isNav = (e: SessionEvent): e is NavEvent => e.type === 'nav';

/**
 * An uncaught error (`error-event`) or a `console.error` is a regression signal
 * in its own right: a UI action that logs an error during the interaction is
 * broken even if the resulting state happens to look correct. Match those.
 */
const isErrorSignal = (e: SessionEvent): e is ConsoleEvent | ErrorEvent =>
  isErrorEvent(e) || (isConsoleEvent(e) && e.level === 'error');

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

  // The interaction window is bounded by the grounding pointer-down and the
  // final pointer event of the same drag. An error/console-error whose ts
  // falls inside (or on the boundary of) that window "straddles" the
  // interaction and is captured as a regression signal.
  const interactionStart = pointerDown.ts;
  const interactionEnd = lastPointer.ts;
  const hasStraddlingError = events.some(
    (e) =>
      isErrorSignal(e) && e.ts >= interactionStart && e.ts <= interactionEnd,
  );

  const primitives: Primitive[] = [
    { kind: 'goto', url },
    { kind: 'setClock', t: startTs },
    { kind: 'getStateSnapshot' },
    { kind: 'dispatchDrag', targetName, dx, dy },
    { kind: 'getStateSnapshot' },
    { kind: 'assertStateEquals', path: ASSERT_PATH, value: expectedValue },
  ];

  // A console error during a UI action is itself a regression, even when the
  // resulting state looks correct — so guard the interaction with an explicit
  // no-console-errors assertion.
  if (hasStraddlingError) {
    primitives.push({ kind: 'assertNoConsoleErrors' });
  }

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

  const guardsConsole = spec.primitives.some(
    (p) => p.kind === 'assertNoConsoleErrors',
  );

  const imports = [
    '  dispatchDrag,',
    '  getStateSnapshot,',
    '  setClock,',
    ...(guardsConsole
      ? ['  assertNoConsoleErrors,', '  captureConsoleErrors,']
      : []),
  ];

  const lines = [
    "import { describe, expect, test } from 'vitest';",
    'import {',
    ...imports,
    "} from '@cuit/harness';",
    '',
    `describe(${literal(spec.testName)}, () => {`,
    `  test(${literal(TEST_CASE_NAME)}, () => {`,
    ...(guardsConsole ? ['    captureConsoleErrors();', ''] : []),
    `    setClock(${setClockPrim.t});`,
    '',
    `    dispatchDrag(${literal(dragPrim.targetName)}, ${dragPrim.dx}, ${dragPrim.dy});`,
    '',
    '    const snapshot = getStateSnapshot();',
    `    expect(snapshot[${literal(assertPrim.path)}]).toEqual(${literal(assertPrim.value)});`,
    ...(guardsConsole ? ['', '    assertNoConsoleErrors();'] : []),
    '  });',
    '});',
    '',
  ];

  return lines.join('\n');
}
