import {
  type ConsoleEvent,
  type ErrorEvent,
  type GeneratedSpec,
  isConsoleEvent,
  isErrorEvent,
  isKeyboardEvent,
  type KeyboardEvent,
  type NavEvent,
  type PointerEvent,
  type Primitive,
  type SessionEvent,
  type StateSnapshotEvent,
} from '@cuit/types';

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

const isPointer = (e: SessionEvent): e is PointerEvent => e.type === 'pointer';
const isNav = (e: SessionEvent): e is NavEvent => e.type === 'nav';
const isSnapshot = (e: SessionEvent): e is StateSnapshotEvent =>
  e.type === 'state-snapshot';

/**
 * An uncaught error (`error-event`) or a `console.error` is a regression
 * signal in its own right: a UI action that logs an error during the
 * interaction is broken even if the resulting state happens to look correct.
 */
const isErrorSignal = (e: SessionEvent): e is ConsoleEvent | ErrorEvent =>
  isErrorEvent(e) || (isConsoleEvent(e) && e.level === 'error');

// ---------------------------------------------------------------------------
// Interaction classification
// ---------------------------------------------------------------------------

type InteractionShape =
  | { shape: 'drag'; targetName: string; dx: number; dy: number }
  | { shape: 'click'; targetName: string }
  | { shape: 'type'; targetName: string; value: string };

/**
 * Classify the dominant interaction in the event stream.
 *
 * Priority:
 * 1. If a keyboard event is present → text-entry (type).
 * 2. If pointer down + up exist with |dx| or |dy| > 5px → drag.
 * 3. Pointer down + up with near-zero delta → click.
 *
 * The 5px threshold avoids classifying micro-jitter as a drag while
 * still catching deliberate pointer movements.
 */
function classifyInteraction(events: SessionEvent[]): InteractionShape {
  // Check for keyboard/text-entry first — it takes priority over pointer events.
  const kbd = events.find((e): e is KeyboardEvent => isKeyboardEvent(e));
  if (kbd) {
    const targetName = kbd.targetName ?? kbd.targetSelector;
    return { shape: 'type', targetName, value: kbd.value };
  }

  const pointerDown = events.find(
    (e): e is PointerEvent => isPointer(e) && e.phase === 'down',
  );
  if (!pointerDown) {
    throw new Error(
      'Cannot generate spec: no pointer-down event found to ground interaction',
    );
  }

  const pointerId = pointerDown.pointerId;
  const sameTarget = events
    .filter(isPointer)
    .filter((e) => e.pointerId === pointerId);
  const pointerUp = [...sameTarget].reverse().find((e) => e.phase === 'up');
  const lastPointer = pointerUp ?? sameTarget[sameTarget.length - 1]!;

  const dx = lastPointer.x - pointerDown.x;
  const dy = lastPointer.y - pointerDown.y;
  const targetName = pointerDown.targetName ?? pointerDown.targetSelector;

  const DRAG_THRESHOLD = 5;
  if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
    return { shape: 'drag', targetName, dx, dy };
  }

  return { shape: 'click', targetName };
}

// ---------------------------------------------------------------------------
// Snapshot diffing
// ---------------------------------------------------------------------------

type SnapshotEntry = { path: string; value: unknown };

/**
 * Collect the last snapshot value for each path in the provided events.
 * Multiple snapshots for the same path → last one wins.
 */
function buildSnapshotMap(events: SessionEvent[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const e of events) {
    if (isSnapshot(e)) {
      map.set(e.path, e.value);
    }
  }
  return map;
}

/**
 * Diff pre-interaction vs post-interaction snapshots and return the paths
 * whose values changed. Returns an empty array when nothing changed.
 */
function diffSnapshots(
  preEvents: SessionEvent[],
  postEvents: SessionEvent[],
): SnapshotEntry[] {
  const pre = buildSnapshotMap(preEvents);
  const post = buildSnapshotMap(postEvents);

  const changed: SnapshotEntry[] = [];
  for (const [path, postValue] of post.entries()) {
    if (!pre.has(path)) continue; // new key — only consider keys that existed before
    const preValue = pre.get(path);
    // Use JSON comparison to handle objects/arrays correctly
    if (JSON.stringify(preValue) !== JSON.stringify(postValue)) {
      changed.push({ path, value: postValue });
    }
  }
  return changed;
}

// ---------------------------------------------------------------------------
// Assert path/value derivation
// ---------------------------------------------------------------------------

type AssertEntry = { path: string; value: unknown };

/**
 * Derive the assert path and expected value from the interaction and snapshots.
 *
 * Rules (in priority order):
 * 1. If snapshot diffing found changed paths → use the first changed {path, postValue}.
 * 2. Drag with no diff (collision bug) → fall back to the snapshot path that
 *    matches the dragged target's index, and use preValue + dx as expected value.
 *    If no matching path is found, use the first pre-snapshot path.
 * 3. No snapshots at all → throw a descriptive error.
 */
function deriveAssert(
  interaction: InteractionShape,
  preEvents: SessionEvent[],
  postEvents: SessionEvent[],
): AssertEntry {
  const changed = diffSnapshots(preEvents, postEvents);

  if (changed.length > 0) {
    // Use the first changed path as the primary assert target.
    return { path: changed[0]!.path, value: changed[0]!.value };
  }

  // No change detected. This is the drag-collision bug pattern.
  // For a drag, the expected value must be derived from intent (preValue + delta),
  // NOT the unchanged post-snapshot value.
  if (interaction.shape === 'drag') {
    const preMap = buildSnapshotMap(preEvents);
    if (preMap.size === 0) {
      throw new Error(
        'Cannot derive assert: no pre-interaction snapshots found and no state changed',
      );
    }

    // Try to find a snapshot path that targets the dragged element.
    // Heuristic: the targetName (e.g. "seg-0") maps to a snapshot path like
    // "segments[0].x" where the index is derived from the numeric suffix of targetName.
    const targetName = interaction.targetName;
    const indexMatch = /(\d+)$/.exec(targetName);
    let matchedPath: string | undefined;

    if (indexMatch) {
      const idx = indexMatch[1];
      for (const path of preMap.keys()) {
        // Match paths like "segments[0].x", "items[0]", etc. that contain [idx]
        if (path.includes(`[${idx}]`)) {
          matchedPath = path;
          break;
        }
      }
    }

    // Fall back to the first path if no index-based match found
    if (!matchedPath) {
      matchedPath = [...preMap.keys()][0]!;
    }

    const preValue = preMap.get(matchedPath);
    if (typeof preValue !== 'number') {
      throw new Error(
        `Cannot compute drag intent for non-numeric preValue at path '${matchedPath}': ${JSON.stringify(preValue)}`,
      );
    }

    return { path: matchedPath, value: preValue + interaction.dx };
  }

  // Click/type with no snapshot change: nothing useful to assert.
  // This is an edge case (e.g., a click that produces no observable state change
  // in the captured paths). Throw a descriptive error.
  throw new Error(
    `Cannot derive assert: no state changed between pre/post snapshots for ${interaction.shape} interaction on '${interaction.targetName}'. Ensure the recorder captures at least one state-snapshot both before and after the interaction.`,
  );
}

// ---------------------------------------------------------------------------
// testName derivation
// ---------------------------------------------------------------------------

/**
 * Build a human-readable test name from the interaction and the derived assert.
 *
 * Examples:
 *   drag  → "drag seg-0 by +100px updates segments[0].x"
 *   click → "click toggle-mute flips muted"
 *   type  → "type 'es' into lang-input sets targetLanguage"
 */
function deriveTestName(
  url: string,
  interaction: InteractionShape,
  assertEntry: AssertEntry,
): string {
  // Strip the origin, keep just the path component for brevity
  let urlPath = url;
  try {
    urlPath = new URL(url).pathname;
  } catch {
    // url is not a valid absolute URL (e.g. empty string) — use as-is
  }

  const pathSuffix = urlPath && urlPath !== '/' ? ` on ${urlPath}` : '';

  switch (interaction.shape) {
    case 'drag': {
      const sign = interaction.dx >= 0 ? '+' : '';
      return `drag ${interaction.targetName} by ${sign}${interaction.dx}px updates ${assertEntry.path}${pathSuffix}`;
    }
    case 'click':
      return `click ${interaction.targetName} flips ${assertEntry.path}${pathSuffix}`;
    case 'type':
      return `type ${literal(interaction.value)} into ${interaction.targetName} sets ${assertEntry.path}${pathSuffix}`;
  }
}

// ---------------------------------------------------------------------------
// generateSpec
// ---------------------------------------------------------------------------

export function generateSpec(events: SessionEvent[]): GeneratedSpec {
  if (events.length === 0) {
    throw new Error('Cannot generate spec from empty event list');
  }

  const nav = events.find(isNav);
  const url = nav?.url ?? '';
  const startTs = events[0]!.ts;

  // Classify the dominant interaction shape
  const interaction = classifyInteraction(events);

  // Determine the interaction window from pointer events (for error-signal detection)
  // For keyboard sessions, use the keyboard event's ts as a single-point window.
  let interactionStart: number;
  let interactionEnd: number;

  if (interaction.shape === 'drag' || interaction.shape === 'click') {
    const pointerDown = events.find(
      (e): e is PointerEvent => isPointer(e) && e.phase === 'down',
    )!;
    const pointerId = pointerDown.pointerId;
    const sameTarget = events
      .filter(isPointer)
      .filter((e) => e.pointerId === pointerId);
    const pointerUp = [...sameTarget].reverse().find((e) => e.phase === 'up');
    const lastPointer = pointerUp ?? sameTarget[sameTarget.length - 1]!;
    interactionStart = pointerDown.ts;
    interactionEnd = lastPointer.ts;
  } else {
    // keyboard
    const kbdEvent = events.find((e): e is KeyboardEvent => isKeyboardEvent(e))!;
    interactionStart = kbdEvent.ts;
    interactionEnd = kbdEvent.ts;
  }

  // Split events into pre/post interaction windows for snapshot diffing
  const preEvents = events.filter((e) => e.ts < interactionStart);
  const postEvents = events.filter((e) => e.ts > interactionEnd);

  // Derive assert path/value
  const assertEntry = deriveAssert(interaction, preEvents, postEvents);

  // Derive test name
  const testName = deriveTestName(url, interaction, assertEntry);

  // Console/error signals straddling the interaction window
  const straddlingErrors = events.filter(
    (e) =>
      isErrorSignal(e) && e.ts >= interactionStart && e.ts <= interactionEnd,
  );
  const straddlingErrorCount = straddlingErrors.length;

  // Build the primitives array
  const primitives: Primitive[] = [
    { kind: 'goto', url },
    { kind: 'setClock', t: startTs },
    { kind: 'getStateSnapshot' },
  ];

  // Emit the appropriate dispatch primitive
  switch (interaction.shape) {
    case 'drag':
      primitives.push({
        kind: 'dispatchDrag',
        targetName: interaction.targetName,
        dx: interaction.dx,
        dy: interaction.dy,
      });
      break;
    case 'click':
      primitives.push({
        kind: 'dispatchClick',
        targetName: interaction.targetName,
      });
      break;
    case 'type':
      primitives.push({
        kind: 'dispatchType',
        targetName: interaction.targetName,
        value: interaction.value,
      });
      break;
  }

  primitives.push({ kind: 'getStateSnapshot' });
  primitives.push({
    kind: 'assertStateEquals',
    path: assertEntry.path,
    value: assertEntry.value,
  });

  if (straddlingErrorCount > 0) {
    primitives.push({
      kind: 'assertNoConsoleErrors',
      count: straddlingErrorCount,
    });
  }

  return {
    testName,
    url,
    primitives,
    expectedFinalState: [{ path: assertEntry.path, value: assertEntry.value }],
  };
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

const literal = (v: unknown): string => {
  if (typeof v === 'string') {
    return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  return JSON.stringify(v);
};

// ---------------------------------------------------------------------------
// serializeSpec
// ---------------------------------------------------------------------------

export function serializeSpec(spec: GeneratedSpec): string {
  const setClockPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'setClock' }> => p.kind === 'setClock',
  );
  const assertPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'assertStateEquals' }> =>
      p.kind === 'assertStateEquals',
  );

  if (!setClockPrim || !assertPrim) {
    throw new Error('Spec missing required primitives for serialization');
  }

  // Determine which dispatch primitive is present
  const dragPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'dispatchDrag' }> =>
      p.kind === 'dispatchDrag',
  );
  const clickPrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'dispatchClick' }> =>
      p.kind === 'dispatchClick',
  );
  const typePrim = spec.primitives.find(
    (p): p is Extract<Primitive, { kind: 'dispatchType' }> =>
      p.kind === 'dispatchType',
  );

  if (!dragPrim && !clickPrim && !typePrim) {
    throw new Error(
      'Spec missing a dispatch primitive (dispatchDrag/dispatchClick/dispatchType) for serialization',
    );
  }

  const guardsConsole = spec.primitives.some(
    (p) => p.kind === 'assertNoConsoleErrors',
  );

  // Build the imports list — only include what's actually used
  const dispatchImport = dragPrim
    ? '  dispatchDrag,'
    : clickPrim
      ? '  dispatchClick,'
      : '  dispatchType,';

  const imports = [
    dispatchImport,
    '  getStateSnapshot,',
    '  setClock,',
    ...(guardsConsole
      ? [
          '  assertNoConsoleErrors,',
          '  captureConsoleErrors,',
          '  restoreConsoleErrors,',
        ]
      : []),
  ];

  // Derive inner test() name from the spec data (not a hardcoded constant)
  const innerTestName = deriveInnerTestName(spec);

  // Build the dispatch call line
  let dispatchLine: string;
  if (dragPrim) {
    dispatchLine = `    dispatchDrag(${literal(dragPrim.targetName)}, ${dragPrim.dx}, ${dragPrim.dy});`;
  } else if (clickPrim) {
    dispatchLine = `    dispatchClick(${literal(clickPrim.targetName)});`;
  } else {
    dispatchLine = `    dispatchType(${literal(typePrim!.targetName)}, ${literal(typePrim!.value)});`;
  }

  const lines = [
    "import { describe, expect, test } from 'vitest';",
    'import {',
    ...imports,
    "} from '@cuit/harness';",
    '',
    `describe(${literal(spec.testName)}, () => {`,
    `  test(${literal(innerTestName)}, () => {`,
    ...(guardsConsole ? ['    captureConsoleErrors();', ''] : []),
    `    setClock(${setClockPrim.t});`,
    '',
    dispatchLine,
    '',
    '    const snapshot = getStateSnapshot();',
    `    expect(snapshot[${literal(assertPrim.path)}]).toEqual(${literal(assertPrim.value)});`,
    ...(guardsConsole
      ? ['', '    assertNoConsoleErrors();', '    restoreConsoleErrors();']
      : []),
    '  });',
    '});',
    '',
  ];

  return lines.join('\n');
}

/**
 * Derive the inner `test(...)` description from the spec's testName and
 * primitives. This avoids any hardcoded constant leaking into serialized output.
 */
function deriveInnerTestName(spec: GeneratedSpec): string {
  // The inner test name is the testName itself — it already encodes all the
  // relevant information (target, shape, path).  Using spec.testName directly
  // ensures a single source of truth with no duplication.
  return spec.testName;
}
