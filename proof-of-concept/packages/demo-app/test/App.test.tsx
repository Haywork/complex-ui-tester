import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { App } from '../src/index.js';

type Segment = { id: string; x: number; width: number };
type DebugState = { segments: Segment[] };
type CuitDebug = { getState: () => DebugState };

declare global {
  interface Window {
    __cuitDebug?: CuitDebug;
  }
}

const DRAG_DX = 100;
const INITIAL_SEG0_X = 0;
const SEG_COUNT = 3;

function readDebugState(): DebugState {
  const debugApi = window.__cuitDebug;
  if (!debugApi) throw new Error('window.__cuitDebug not registered');
  return debugApi.getState();
}

function findSegmentHandle(segmentId: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-segment-id="${segmentId}"]`);
  if (!el) throw new Error(`segment element not found: ${segmentId}`);
  return el;
}

function dragSegment(segmentId: string, dx: number, dy: number): void {
  const handle = findSegmentHandle(segmentId);
  const rect = handle.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  const pointerId = 7;

  act(() => {
    handle.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: startX,
        clientY: startY,
        pointerId,
        pointerType: 'mouse',
        button: 0,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: startX + dx,
        clientY: startY + dy,
        pointerId,
        pointerType: 'mouse',
      }),
    );
    handle.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: startX + dx,
        clientY: startY + dy,
        pointerId,
        pointerType: 'mouse',
        button: 0,
      }),
    );
  });
}

const ORIGINAL_FIX_FLAG = process.env.FIX_SEGMENT_COLLISION;

function setFixFlag(value: '0' | '1'): void {
  process.env.FIX_SEGMENT_COLLISION = value;
}

function restoreFixFlag(): void {
  if (ORIGINAL_FIX_FLAG === undefined) delete process.env.FIX_SEGMENT_COLLISION;
  else process.env.FIX_SEGMENT_COLLISION = ORIGINAL_FIX_FLAG;
}

beforeEach(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class JsdomPointerEvent extends MouseEvent {
      public readonly pointerId: number;
      public readonly pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
      JsdomPointerEvent as unknown as typeof PointerEvent;
  }
});

afterEach(() => {
  cleanup();
  delete window.__cuitDebug;
  restoreFixFlag();
});

describe('App — bug-present mode', () => {
  test('renders exactly three segments with stable ids seg-0, seg-1, seg-2', () => {
    setFixFlag('0');
    render(<App />);
    const state = readDebugState();
    expect(state.segments).toHaveLength(SEG_COUNT);
    expect(state.segments.map((s) => s.id)).toEqual(['seg-0', 'seg-1', 'seg-2']);
  });

  test('initial seg-0.x equals 0', () => {
    setFixFlag('0');
    render(<App />);
    const state = readDebugState();
    expect(state.segments[0]?.x).toBe(INITIAL_SEG0_X);
  });

  test('dragging seg-0 by 100px leaves seg-0.x at 0 (collision bug reproduces)', () => {
    setFixFlag('0');
    render(<App />);
    dragSegment('seg-0', DRAG_DX, 0);
    const state = readDebugState();
    expect(state.segments[0]?.x).toBe(0);
  });

  test('dragging seg-0 by 100px does not mutate seg-1 or seg-2 positions', () => {
    setFixFlag('0');
    render(<App />);
    const before = readDebugState();
    const seg1Before = before.segments[1]?.x;
    const seg2Before = before.segments[2]?.x;
    dragSegment('seg-0', DRAG_DX, 0);
    const after = readDebugState();
    expect(after.segments[1]?.x).toBe(seg1Before);
    expect(after.segments[2]?.x).toBe(seg2Before);
  });

  test('window.__cuitDebug.getState returns a fresh snapshot, not a shared mutable reference', () => {
    setFixFlag('0');
    render(<App />);
    const first = readDebugState();
    const second = readDebugState();
    expect(first).not.toBe(second);
    expect(first.segments).not.toBe(second.segments);
    expect(first.segments).toEqual(second.segments);
  });

  test('exposes a debug api shape with a callable getState', () => {
    setFixFlag('0');
    render(<App />);
    expect(typeof window.__cuitDebug?.getState).toBe('function');
  });
});

describe('App — bug-fixed mode (FIX_SEGMENT_COLLISION=1)', () => {
  test('dragging seg-0 by 100px sets seg-0.x to 100', () => {
    setFixFlag('1');
    render(<App />);
    dragSegment('seg-0', DRAG_DX, 0);
    const state = readDebugState();
    expect(state.segments[0]?.x).toBe(DRAG_DX);
  });

  test('dragging seg-0 by 100px does not displace seg-1 or seg-2', () => {
    setFixFlag('1');
    render(<App />);
    const before = readDebugState();
    const seg1Before = before.segments[1]?.x;
    const seg2Before = before.segments[2]?.x;
    dragSegment('seg-0', DRAG_DX, 0);
    const after = readDebugState();
    expect(after.segments[1]?.x).toBe(seg1Before);
    expect(after.segments[2]?.x).toBe(seg2Before);
  });

  test('still renders three segments after a drag', () => {
    setFixFlag('1');
    render(<App />);
    dragSegment('seg-0', DRAG_DX, 0);
    const state = readDebugState();
    expect(state.segments).toHaveLength(SEG_COUNT);
    expect(state.segments.map((s) => s.id)).toEqual(['seg-0', 'seg-1', 'seg-2']);
  });

  test('drag of zero pixels leaves seg-0.x at its initial value', () => {
    setFixFlag('1');
    render(<App />);
    dragSegment('seg-0', 0, 0);
    const state = readDebugState();
    expect(state.segments[0]?.x).toBe(INITIAL_SEG0_X);
  });
});

describe('App — mode toggle behavior', () => {
  test('bug-mode and fixed-mode produce divergent seg-0.x for the same 100px drag', () => {
    setFixFlag('0');
    const buggy = render(<App />);
    dragSegment('seg-0', DRAG_DX, 0);
    const buggyX = readDebugState().segments[0]?.x;
    buggy.unmount();
    delete window.__cuitDebug;

    setFixFlag('1');
    render(<App />);
    dragSegment('seg-0', DRAG_DX, 0);
    const fixedX = readDebugState().segments[0]?.x;

    expect(buggyX).toBe(0);
    expect(fixedX).toBe(DRAG_DX);
    expect(buggyX).not.toBe(fixedX);
  });
});
