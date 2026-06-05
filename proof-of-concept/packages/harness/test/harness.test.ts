// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SnapshotProvider, StateSnapshot } from '../src/index.js';

type HarnessModule = typeof import('../src/index.js');

const CLOCK_T0 = 1716800000000;
const FRAME_MS = 16;

// Each test gets a fresh module instance so global singletons (clock,
// snapshot provider) do not leak between tests.
async function loadHarness(): Promise<HarnessModule> {
  vi.resetModules();
  return await import('../src/index.js');
}

type CapturedPointerEvent = {
  type: string;
  clientX: number;
  clientY: number;
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
};

function makeTarget(name: string): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('data-segment-id', name);
  // jsdom does not implement layout — stub the bounding rect so the
  // harness has a deterministic origin for the synthetic pointer events.
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 50,
      bottom: 50,
      width: 50,
      height: 50,
      toJSON: () => ({}),
    } as DOMRect);
  document.body.appendChild(el);
  return el;
}

function captureEvents(target: HTMLElement, types: readonly string[]): CapturedPointerEvent[] {
  const captured: CapturedPointerEvent[] = [];
  for (const t of types) {
    target.addEventListener(t, (ev) => {
      const pe = ev as unknown as {
        type: string;
        clientX: number;
        clientY: number;
        pointerId: number;
        pointerType: string;
        isPrimary: boolean;
      };
      captured.push({
        type: pe.type,
        clientX: pe.clientX,
        clientY: pe.clientY,
        pointerId: pe.pointerId,
        pointerType: pe.pointerType,
        isPrimary: pe.isPrimary,
      });
    });
  }
  return captured;
}

describe('setClock', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('Date.now returns exactly the value passed to setClock', async () => {
    const { setClock } = await loadHarness();
    setClock(CLOCK_T0);
    expect(Date.now()).toEqual(CLOCK_T0);
  });

  test('requestAnimationFrame callback fires with the set wall-clock time advanced by one frame', async () => {
    const { setClock } = await loadHarness();
    setClock(CLOCK_T0);
    const seen: number[] = [];
    requestAnimationFrame((t) => seen.push(t));
    setClock(CLOCK_T0 + FRAME_MS);
    expect(seen).toEqual([CLOCK_T0 + FRAME_MS]);
  });

  test('multiple rAF callbacks queued in the same frame all flush in registration order', async () => {
    const { setClock } = await loadHarness();
    setClock(CLOCK_T0);
    const order: string[] = [];
    requestAnimationFrame(() => order.push('a'));
    requestAnimationFrame(() => order.push('b'));
    requestAnimationFrame(() => order.push('c'));
    setClock(CLOCK_T0 + FRAME_MS);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  test('rAF callbacks scheduled inside another rAF fire only on the next advance', async () => {
    const { setClock } = await loadHarness();
    setClock(CLOCK_T0);
    const seen: number[] = [];
    requestAnimationFrame((t) => {
      seen.push(t);
      // Re-scheduling from inside the callback must fire on the NEXT
      // advance, not the current one — guards against infinite loops.
      requestAnimationFrame((t2) => seen.push(t2));
    });
    setClock(CLOCK_T0 + FRAME_MS);
    expect(seen).toEqual([CLOCK_T0 + FRAME_MS]);
    setClock(CLOCK_T0 + 2 * FRAME_MS);
    expect(seen).toEqual([CLOCK_T0 + FRAME_MS, CLOCK_T0 + 2 * FRAME_MS]);
  });
});

describe('dispatchDrag', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('fires pointerdown first, pointerup last, and at least one pointermove in between on the named target', async () => {
    const { dispatchDrag, setClock } = await loadHarness();
    setClock(CLOCK_T0);
    const target = makeTarget('seg-0');
    const captured = captureEvents(target, ['pointerdown', 'pointermove', 'pointerup']);

    dispatchDrag('seg-0', 100, 0);

    const phases = captured.map((e) => e.type);
    expect(phases[0]).toEqual('pointerdown');
    expect(phases[phases.length - 1]).toEqual('pointerup');
    expect(phases.filter((p) => p === 'pointermove').length).toBeGreaterThanOrEqual(1);
  });

  test('starting clientX/Y equal the element center, and ending clientX/Y equal start + dx/dy', async () => {
    const { dispatchDrag, setClock } = await loadHarness();
    setClock(CLOCK_T0);
    const target = makeTarget('seg-0');
    const captured = captureEvents(target, ['pointerdown', 'pointermove', 'pointerup']);
    const startRect = target.getBoundingClientRect();
    const startX = startRect.x + startRect.width / 2;
    const startY = startRect.y + startRect.height / 2;

    dispatchDrag('seg-0', 100, 25);

    const down = captured.find((e) => e.type === 'pointerdown');
    const up = captured.find((e) => e.type === 'pointerup');
    expect(down).toBeDefined();
    expect(up).toBeDefined();
    expect(down!.clientX).toEqual(startX);
    expect(down!.clientY).toEqual(startY);
    expect(up!.clientX).toEqual(startX + 100);
    expect(up!.clientY).toEqual(startY + 25);
  });

  test('all dispatched events share the same pointerId and pointerType="mouse", and are primary', async () => {
    const { dispatchDrag, setClock } = await loadHarness();
    setClock(CLOCK_T0);
    const target = makeTarget('seg-0');
    const captured = captureEvents(target, ['pointerdown', 'pointermove', 'pointerup']);

    dispatchDrag('seg-0', 50, 0);

    expect(captured.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(captured.map((e) => e.pointerId));
    const types = new Set(captured.map((e) => e.pointerType));
    expect(ids.size).toEqual(1);
    expect(types).toEqual(new Set(['mouse']));
    expect(captured.every((e) => e.isPrimary === true)).toEqual(true);
  });

  test('throws an error mentioning the unknown target name when no element matches', async () => {
    const { dispatchDrag, setClock } = await loadHarness();
    setClock(CLOCK_T0);
    // Error message must include the target name so spec failures point at
    // the missing data-segment-id rather than a generic "not implemented".
    expect(() => dispatchDrag('does-not-exist', 10, 0)).toThrow(/does-not-exist/);
  });
});

describe('getStateSnapshot', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns the object produced by the registered provider, with the same keys and values', async () => {
    const { getStateSnapshot, registerStateSnapshot } = await loadHarness();
    const provider: SnapshotProvider = () => ({ 'segments[0].x': 0, 'segments[1].x': 200 });
    registerStateSnapshot(provider);

    const snap = getStateSnapshot();

    expect(snap).toEqual({ 'segments[0].x': 0, 'segments[1].x': 200 });
  });

  test('reflects provider state changes between calls — provider is invoked per call', async () => {
    const { getStateSnapshot, registerStateSnapshot } = await loadHarness();
    let x = 0;
    registerStateSnapshot(() => ({ 'segments[0].x': x }));

    const before = getStateSnapshot();
    x = 100;
    const after = getStateSnapshot();

    expect(before).toEqual({ 'segments[0].x': 0 });
    expect(after).toEqual({ 'segments[0].x': 100 });
  });

  test('throws a snapshot-not-registered error (not "not implemented") when no provider is registered', async () => {
    const { getStateSnapshot } = await loadHarness();
    // No registerStateSnapshot call — the harness must refuse to silently
    // return an empty snapshot, since that would hide wiring bugs.
    // The error must mention "snapshot" so the failure is actionable.
    expect(() => getStateSnapshot()).toThrow(/snapshot/i);
  });
});

describe('registerStateSnapshot', () => {
  test('throws an "already registered" error when a second provider is registered, enforcing a single source of truth', async () => {
    const { registerStateSnapshot } = await loadHarness();
    const a: SnapshotProvider = () => ({ source: 'a' } as StateSnapshot);
    const b: SnapshotProvider = () => ({ source: 'b' } as StateSnapshot);
    registerStateSnapshot(a);

    expect(() => registerStateSnapshot(b)).toThrow(/already.*regist|regist.*already|single|duplicate/i);
  });
});
