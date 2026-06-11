import { describe, it, expect } from 'vitest';
import { generateSpec } from '../src/index.js';
import type { SessionEvent } from '@cuit/types';

/**
 * Regression for the spec-gen bug the support-triage self-test caught:
 * the LIVE recorder lands its first state-snapshot AT pointerdown, not
 * strictly before it, so `preEvents` (ts < pointerDown.ts) is empty even on
 * a healthy capture. The generalized deriveAssert used to throw
 * "no pre-interaction snapshots found and no state changed", which broke
 * `pnpm proof:agent-loop`. The fix falls back to the post-window snapshots.
 *
 * This test reproduces that capture shape directly so a hand-built fixture
 * with a convenient pre-snapshot can never hide the regression again.
 */
describe('generateSpec — no pre-interaction snapshot (live-recorder shape)', () => {
  const DOWN_TS = 1000;
  const UP_TS = 1200;
  const DX = 100;

  // A drag-collision session: snapshots land AT/after pointerdown, never
  // before it, and state does NOT change (the bug). segments[0].x stays at
  // its baseline; the spec must still assert the INTENDED value (base + dx).
  const session: SessionEvent[] = [
    { type: 'pointer', phase: 'down', pointerId: 1, targetName: 'seg-0', x: 25, y: 5, ts: DOWN_TS, seq: 0, vendor: 'cuit', vendorEventId: 'p0', wallClock: DOWN_TS },
    // first snapshot is AT pointerdown (the exact live-recorder behavior)
    { type: 'state-snapshot', path: 'segments[0].id', value: 'seg-0', ts: DOWN_TS, seq: 1, vendor: 'cuit', vendorEventId: 's0', wallClock: DOWN_TS },
    { type: 'state-snapshot', path: 'segments[0].x', value: 25, ts: DOWN_TS, seq: 2, vendor: 'cuit', vendorEventId: 's1', wallClock: DOWN_TS },
    { type: 'pointer', phase: 'up', pointerId: 1, targetName: 'seg-0', x: 125, y: 5, ts: UP_TS, seq: 3, vendor: 'cuit', vendorEventId: 'p1', wallClock: UP_TS },
    // post-interaction snapshot: x is UNCHANGED (collision bug)
    { type: 'state-snapshot', path: 'segments[0].id', value: 'seg-0', ts: UP_TS + 50, seq: 4, vendor: 'cuit', vendorEventId: 's2', wallClock: UP_TS + 50 },
    { type: 'state-snapshot', path: 'segments[0].x', value: 25, ts: UP_TS + 50, seq: 5, vendor: 'cuit', vendorEventId: 's3', wallClock: UP_TS + 50 },
  ] as unknown as SessionEvent[];

  it('does not throw, and derives the numeric coordinate path (not the string id)', () => {
    const spec = generateSpec(session);
    const assertion = spec.primitives.find((p) => p.kind === 'assertStateEquals');
    expect(assertion).toBeDefined();
    // Must target the numeric x, never segments[0].id (value "seg-0")
    expect(assertion!.path).toBe('segments[0].x');
  });

  it('asserts the INTENDED value (baseline + dx), proving RED on the collision bug', () => {
    const spec = generateSpec(session);
    const assertion = spec.primitives.find((p) => p.kind === 'assertStateEquals')!;
    // baseline 25 + dx 100 = 125 — what the drag SHOULD have produced.
    expect(assertion.value).toBe(25 + DX);
  });
});
