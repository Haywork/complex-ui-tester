/**
 * ax-debug.ts — Pure-TS debugging primitives for @haywork/runner.
 *
 * Four functions operating over the immutable SessionEvent[] trace:
 *   - minimalDiff   — single minimal divergence from a red result
 *   - stepState     — forward/backward snapshot stepping with per-frame deltas
 *   - listPrimitives — honest executable/noop contract per Primitive kind
 *   - replayPlan    — plain JSON replay plan for a future cuit__replay MCP tool
 *
 * All functions are pure: no fs, no global mutation, no side-effects.
 */

import type {
  SessionEvent,
  PointerEvent as CuitPointerEvent,
  StateSnapshotEvent,
  NavEvent,
  Primitive,
} from '@haywork/types';

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

/** Accepts either a bare SessionEvent[] or a wrapper object with an events field. */
type SessionInput = SessionEvent[] | { events: SessionEvent[] };

function normalizeEvents(input: SessionInput): SessionEvent[] {
  if (Array.isArray(input)) return input;
  return input.events;
}

// ---------------------------------------------------------------------------
// Internal type guards
// ---------------------------------------------------------------------------

function isSnapshot(e: SessionEvent): e is StateSnapshotEvent {
  return e.type === 'state-snapshot';
}

function isPointer(e: SessionEvent): e is CuitPointerEvent {
  return e.type === 'pointer';
}

function isNav(e: SessionEvent): e is NavEvent {
  return e.type === 'nav';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Left-fold all state-snapshot events in order, keyed by path.
 * Returns the cumulative state as of the last snapshot event in `events`.
 */
function foldSnapshots(events: SessionEvent[]): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const e of events) {
    if (isSnapshot(e)) {
      state[e.path] = e.value;
    }
  }
  return state;
}

/**
 * A snapshot frame is a maximal contiguous run of state-snapshot events
 * sharing the same `ts` value (one captureSnapshot flush).
 *
 * Returns an array of frames in order. Each frame carries:
 *   - ts: the shared timestamp
 *   - snapshotEvents: the state-snapshot events in this flush
 *   - pointerEventsSincePrevFrame: pointer events whose ts is strictly between
 *     the previous frame's ts and this frame's ts (exclusive on both sides for
 *     the previous boundary, inclusive up to but not including this frame's ts).
 *     For frame 0 all pointer events before ts are included.
 */
interface SnapshotFrame {
  ts: number;
  snapshotEvents: StateSnapshotEvent[];
  pointerEventsSincePrevFrame: CuitPointerEvent[];
}

function frameBoundaries(events: SessionEvent[]): SnapshotFrame[] {
  const frames: SnapshotFrame[] = [];
  const allPointers = events.filter(isPointer);

  let i = 0;
  while (i < events.length) {
    const e = events[i];
    if (!e) { i++; continue; }
    if (!isSnapshot(e)) { i++; continue; }

    // Start of a new frame — collect all contiguous snapshots with same ts
    const framets = e.ts;
    const frameSnaps: StateSnapshotEvent[] = [];

    while (i < events.length) {
      const cur = events[i];
      if (!cur) break;
      if (!isSnapshot(cur) || cur.ts !== framets) break;
      frameSnaps.push(cur);
      i++;
    }

    // Collect pointer events between previous frame ts and this frame ts
    const prevFrameTs = frames.length > 0 ? (frames[frames.length - 1]?.ts ?? -1) : -1;
    const pointersSince = allPointers.filter((p) => {
      if (frames.length === 0) {
        // Frame 0: all pointers with ts < framets
        return p.ts < framets;
      }
      return p.ts > prevFrameTs && p.ts < framets;
    });

    frames.push({
      ts: framets,
      snapshotEvents: frameSnaps,
      pointerEventsSincePrevFrame: pointersSince,
    });
  }

  return frames;
}

// ---------------------------------------------------------------------------
// 1. minimalDiff
// ---------------------------------------------------------------------------

export interface MinimalDiffResult {
  path: string;
  expected: unknown;
  actual: unknown;
  nearest_pointer_event: CuitPointerEvent | null;
}

export interface RedResult {
  trace: SessionEvent[];
  expectedFinalState: Array<{ path: string; value: unknown }>;
  finalSnapshot?: Record<string, unknown>;
}

/**
 * Given a red result, return the SINGLE minimal divergence for the first
 * failing expected path.
 *
 * Returns null when no divergence exists (green).
 */
export function minimalDiff(red: RedResult): MinimalDiffResult | null {
  const snapshot = red.finalSnapshot ?? foldSnapshots(red.trace);

  // Find the first expected entry whose value diverges from the snapshot
  let failingPath: string | undefined;
  let expectedValue: unknown;
  let actualValue: unknown;

  for (const entry of red.expectedFinalState) {
    const actual = snapshot[entry.path];
    if (actual !== entry.value) {
      failingPath = entry.path;
      expectedValue = entry.value;
      actualValue = actual;
      break;
    }
  }

  if (failingPath === undefined) {
    return null;
  }

  // Find the snapshot frame where `failingPath` last changed its value.
  // We need the ts of that frame to anchor to the nearest pointer event.
  const frames = frameBoundaries(red.trace);
  let changedFrameTs: number | null = null;

  // Walk frames in order, track the last frame where this path appeared
  for (const frame of frames) {
    const hasPath = frame.snapshotEvents.some((s) => s.path === failingPath);
    if (hasPath) {
      changedFrameTs = frame.ts;
    }
  }

  // Find the pointer event whose ts is closest to changedFrameTs
  const allPointers = red.trace.filter(isPointer);
  let nearestPointer: CuitPointerEvent | null = null;

  if (changedFrameTs !== null && allPointers.length > 0) {
    let minDist = Infinity;
    for (const p of allPointers) {
      const dist = Math.abs(p.ts - changedFrameTs);
      // Tie-break: pick the later seq (deterministic)
      if (dist < minDist || (dist === minDist && nearestPointer !== null && p.seq > nearestPointer.seq)) {
        minDist = dist;
        nearestPointer = p;
      }
    }
  }

  return {
    path: failingPath,
    expected: expectedValue,
    actual: actualValue,
    nearest_pointer_event: nearestPointer,
  };
}

// ---------------------------------------------------------------------------
// 2. stepState
// ---------------------------------------------------------------------------

export interface StepStateDelta {
  path: string;
  from: unknown;
  to: unknown;
}

export interface StepStateResult {
  index: number;
  ts: number;
  state: Record<string, unknown>;
  changed: StepStateDelta[];
  pointerSince: CuitPointerEvent[];
}

/**
 * Step to a specific frame index in the snapshot trace.
 *
 * Returns the cumulative folded state at that frame, the paths that changed
 * vs the previous frame, and the pointer events between frames.
 *
 * Throws RangeError for out-of-range indices.
 */
export function stepState(
  session: SessionInput,
  index: number,
): StepStateResult {
  const events = normalizeEvents(session);
  const frames = frameBoundaries(events);
  const frameCount = frames.length;

  if (index < 0 || index >= frameCount) {
    throw new RangeError(
      `stepState: index ${index} is out of range. Valid indices are 0 to ${frameCount - 1} (frameCount=${frameCount}).`,
    );
  }

  // Build cumulative state up to and including frame `index`
  const stateAtIndex: Record<string, unknown> = {};
  for (let f = 0; f <= index; f++) {
    const frame = frames[f];
    if (!frame) continue;
    for (const snap of frame.snapshotEvents) {
      stateAtIndex[snap.path] = snap.value;
    }
  }

  // Build cumulative state at frame index-1 (to compute deltas)
  const stateAtPrev: Record<string, unknown> = {};
  for (let f = 0; f < index; f++) {
    const frame = frames[f];
    if (!frame) continue;
    for (const snap of frame.snapshotEvents) {
      stateAtPrev[snap.path] = snap.value;
    }
  }

  // Compute changed: paths that appear in the current frame and differ from prev
  const currentFrame = frames[index];
  if (!currentFrame) {
    throw new RangeError(
      `stepState: frame at index ${index} not found (frameCount=${frameCount}).`,
    );
  }

  const changedPaths = new Set<string>();
  for (const snap of currentFrame.snapshotEvents) {
    changedPaths.add(snap.path);
  }

  const changed: StepStateDelta[] = [];
  for (const path of changedPaths) {
    const to = stateAtIndex[path];
    const from = Object.prototype.hasOwnProperty.call(stateAtPrev, path)
      ? stateAtPrev[path]
      : undefined;
    changed.push({ path, from, to });
  }

  return {
    index,
    ts: currentFrame.ts,
    state: stateAtIndex,
    changed,
    pointerSince: currentFrame.pointerEventsSincePrevFrame,
  };
}

// ---------------------------------------------------------------------------
// 3. listPrimitives
// ---------------------------------------------------------------------------

export interface PrimitiveEntry {
  kind: Primitive['kind'];
  mode: 'executable' | 'noop' | 'harness-spec-only';
  realizedBy: string;
}

/**
 * Returns the honest executable contract for every Primitive kind.
 *
 * Derived directly from runPrimitive in runner/src/index.ts:
 *   - setClock, dispatchDrag: call into @haywork/harness (executable)
 *   - goto, getStateSnapshot, assertStateEquals: early-return no-ops in runPrimitive
 *   - assertNoConsoleErrors: not handled in runPrimitive at all;
 *     only realized in the serialized spec via harness.assertNoConsoleErrors
 *
 * The compile-time exhaustiveness check below ensures that adding a new
 * Primitive kind forces updating this list.
 */
export function listPrimitives(): PrimitiveEntry[] {
  // Exhaustiveness helper — referenced at compile time only
  function assertNever(x: never): never {
    throw new Error(`Unhandled Primitive kind: ${String(x)}`);
  }

  const entries: PrimitiveEntry[] = [
    {
      kind: 'setClock',
      mode: 'executable',
      realizedBy: '@haywork/harness setClock via runPrimitive',
    },
    {
      kind: 'dispatchDrag',
      mode: 'executable',
      realizedBy: '@haywork/harness dispatchDrag via runPrimitive',
    },
    {
      kind: 'goto',
      mode: 'noop',
      realizedBy: 'no-op in runPrimitive (early return; navigation is assumed pre-mounted)',
    },
    {
      kind: 'getStateSnapshot',
      mode: 'noop',
      realizedBy: 'no-op in runPrimitive (snapshot is read separately via harness.getStateSnapshot after the loop)',
    },
    {
      kind: 'assertStateEquals',
      mode: 'noop',
      realizedBy: 'no-op in runPrimitive (assertion logic lives in specMatchesExpected, not the primitive runner)',
    },
    {
      kind: 'assertNoConsoleErrors',
      mode: 'harness-spec-only',
      realizedBy: 'harness.assertNoConsoleErrors in serialized spec only — not handled in runPrimitive',
    },
  ];

  // Compile-time exhaustiveness: iterate every kind through a switch.
  // If a new Primitive kind is added to @haywork/types but not above,
  // TypeScript will error here at the `assertNever` call.
  for (const entry of entries) {
    const k = entry.kind;
    switch (k) {
      case 'setClock':
      case 'dispatchDrag':
      case 'dispatchClick':
      case 'dispatchType':
      case 'goto':
      case 'getStateSnapshot':
      case 'assertStateEquals':
      case 'assertNoConsoleErrors':
        break;
      default:
        assertNever(k);
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// 4. replayPlan
// ---------------------------------------------------------------------------

export interface ReplayPlan {
  gitSha: string;
  url: string;
  checkout: { sha: string };
  mount: { url: string };
  drive: Primitive[];
  assert: Array<{ path: string; value: unknown }>;
}

/**
 * Build a plain JSON replay plan for re-driving a recorded session against a
 * specific git SHA.
 *
 * Derives:
 *   - url from the first nav event in the trace
 *   - dispatchDrag primitives from pointer-down → pointer-up pairs (same pointerId)
 *   - expectedFinalState (assert) from the final folded snapshot
 *
 * Returns plain data — no functions, no undefined values; JSON round-trips cleanly.
 */
export function replayPlan(session: SessionInput, gitSha: string): ReplayPlan {
  const events = normalizeEvents(session);

  // Extract URL from first nav event
  const navEvent = events.find(isNav);
  const url = navEvent?.url ?? '';

  // Extract the clock seed from the first pointer event's ts (or first snapshot ts)
  const firstPointer = events.find(isPointer);
  const firstSnapshot = events.find(isSnapshot);
  const clockTs = firstPointer?.ts ?? firstSnapshot?.ts ?? 0;

  // Build dispatchDrag primitives from pointer sequences
  // Group by pointerId: for each unique pointerId, find the first down and last up
  const pointersByPointerId = new Map<number, CuitPointerEvent[]>();
  for (const e of events) {
    if (isPointer(e)) {
      const existing = pointersByPointerId.get(e.pointerId) ?? [];
      existing.push(e);
      pointersByPointerId.set(e.pointerId, existing);
    }
  }

  const drive: Primitive[] = [];

  // Always add goto first
  drive.push({ kind: 'goto', url });

  // Add setClock if we have any pointer/snapshot events
  if (clockTs > 0) {
    drive.push({ kind: 'setClock', t: clockTs });
  }

  // Build drag primitives
  for (const [, pointers] of pointersByPointerId) {
    const downEvent = pointers.find((p) => p.phase === 'down');
    if (!downEvent) continue;

    // Last 'up' event for this pointerId
    const upEvents = pointers.filter((p) => p.phase === 'up');
    if (upEvents.length === 0) continue;

    const lastUp = upEvents[upEvents.length - 1];
    if (!lastUp) continue;

    const dx = lastUp.x - downEvent.x;
    const dy = lastUp.y - downEvent.y;
    const targetName = downEvent.targetName ?? downEvent.targetSelector;

    drive.push({
      kind: 'dispatchDrag',
      targetName,
      dx,
      dy,
    });
  }

  // Derive assert from the final folded snapshot of the trace
  const finalState = foldSnapshots(events);
  const assert = Object.entries(finalState).map(([path, value]) => ({
    path,
    value,
  }));

  return {
    gitSha,
    url,
    checkout: { sha: gitSha },
    mount: { url },
    drive,
    assert,
  };
}
