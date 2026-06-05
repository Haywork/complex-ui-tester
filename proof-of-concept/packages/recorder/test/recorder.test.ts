import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Recorder, cuitDebugProvider, isCuitDebugAvailable } from '../src/index';

function setupDom(html: string, url = 'http://localhost:5173/'): void {
  document.body.innerHTML = html;
  // jsdom keeps URL static; override location.href via getter for the recorder.
  Object.defineProperty(window, 'location', {
    value: { ...window.location, href: url },
    writable: true,
  });
}

function fireEvent(target: Element, type: string, init: PointerEventInit): void {
  const ev = new (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    ...init,
  });
  target.dispatchEvent(ev);
}

// jsdom 25 lacks PointerEvent — install a tiny shim.
beforeEach(() => {
  if (typeof (window as unknown as { PointerEvent?: unknown }).PointerEvent === 'undefined') {
    class JsdomPointerEvent extends MouseEvent {
      public readonly pointerId: number;
      public readonly pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init as MouseEventInit);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
      JsdomPointerEvent as unknown as typeof PointerEvent;
  }
});

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as unknown as { __cuitDebug?: unknown }).__cuitDebug;
});

describe('Recorder', () => {
  test('emits a nav event with the current URL on start()', () => {
    setupDom('<div></div>', 'http://localhost:5173/waveform');
    let t = 1_700_000_000_000;
    const rec = new Recorder({ sessionId: 'rec-001', now: () => (t += 1) });
    rec.start();
    const out = rec.export();
    expect(out.events[0]?.type).toBe('nav');
    expect(out.events[0]).toMatchObject({ url: 'http://localhost:5173/waveform' });
  });

  test('assigns monotonic seq numbers to every event', () => {
    setupDom('<div data-segment-id="seg-0"></div>');
    let t = 1_700_000_000_000;
    const rec = new Recorder({ sessionId: 'rec-002', now: () => (t += 1) });
    rec.start();
    const seg = document.querySelector('[data-segment-id="seg-0"]')!;
    fireEvent(seg, 'pointerdown', { clientX: 10, clientY: 20, pointerId: 1 });
    fireEvent(seg, 'pointermove', { clientX: 15, clientY: 20, pointerId: 1 });
    fireEvent(seg, 'pointerup', { clientX: 20, clientY: 20, pointerId: 1 });
    const out = rec.export();
    const seqs = out.events.map((e) => e.seq);
    for (let i = 1; i < seqs.length; i += 1) {
      expect(seqs[i]).toBe(seqs[i - 1]! + 1);
    }
  });

  test('captures pointer events with semantic targetName when data-segment-id exists', () => {
    setupDom('<div data-segment-id="seg-0"></div>');
    const rec = new Recorder({ sessionId: 'rec-003' });
    rec.start();
    const seg = document.querySelector('[data-segment-id="seg-0"]')!;
    fireEvent(seg, 'pointerdown', { clientX: 40, clientY: 32, pointerId: 1 });

    const out = rec.export();
    const pointer = out.events.find((e) => e.type === 'pointer');
    expect(pointer).toBeDefined();
    if (pointer && pointer.type === 'pointer') {
      expect(pointer.targetName).toBe('seg-0');
      expect(pointer.phase).toBe('down');
      expect(pointer.x).toBe(40);
      expect(pointer.y).toBe(32);
      expect(pointer.pointerId).toBe(1);
    }
  });

  test('falls back to data-testid when data-segment-id is absent', () => {
    setupDom('<div data-testid="row-3"></div>');
    const rec = new Recorder({ sessionId: 'rec-004' });
    rec.start();
    const el = document.querySelector('[data-testid="row-3"]')!;
    fireEvent(el, 'pointerdown', { clientX: 1, clientY: 1, pointerId: 1 });
    const out = rec.export();
    const p = out.events.find((e) => e.type === 'pointer');
    expect(p?.type).toBe('pointer');
    if (p && p.type === 'pointer') expect(p.targetName).toBe('row-3');
  });

  test('omits targetName when no semantic selector matches', () => {
    setupDom('<div class="plain"></div>');
    const rec = new Recorder({ sessionId: 'rec-005' });
    rec.start();
    const el = document.querySelector('.plain')!;
    fireEvent(el, 'pointerdown', { clientX: 1, clientY: 1, pointerId: 1 });
    const out = rec.export();
    const p = out.events.find((e) => e.type === 'pointer');
    expect(p?.type).toBe('pointer');
    if (p && p.type === 'pointer') {
      expect(p.targetName).toBeUndefined();
      expect(p.targetSelector).toContain('div');
    }
  });

  test('records state-snapshot events on start and on pointerup', () => {
    setupDom('<div data-segment-id="seg-0"></div>');
    const state: { segments: Array<{ id: string; x: number }> } = {
      segments: [{ id: 'seg-0', x: 0 }],
    };
    const rec = new Recorder({
      sessionId: 'rec-006',
      snapshotProvider: () => state,
    });
    rec.start();
    const initialSnaps = rec.export().events.filter((e) => e.type === 'state-snapshot').length;
    expect(initialSnaps).toBeGreaterThan(0);

    state.segments[0]!.x = 100;
    const seg = document.querySelector('[data-segment-id="seg-0"]')!;
    fireEvent(seg, 'pointerup', { clientX: 100, clientY: 32, pointerId: 1 });

    const out = rec.export();
    const segXSnaps = out.events.filter(
      (e) => e.type === 'state-snapshot' && e.path === 'segments[0].x',
    );
    expect(segXSnaps.length).toBeGreaterThanOrEqual(2);
    const last = segXSnaps[segXSnaps.length - 1];
    if (last && last.type === 'state-snapshot') expect(last.value).toBe(100);
  });

  test('skips identical consecutive snapshots to keep traces tight', () => {
    setupDom('<div data-segment-id="seg-0"></div>');
    const state = { segments: [{ id: 'seg-0', x: 0 }] };
    const rec = new Recorder({ sessionId: 'rec-007', snapshotProvider: () => state });
    rec.start();
    rec.captureSnapshot();
    rec.captureSnapshot();
    rec.captureSnapshot();
    const snaps = rec.export().events.filter((e) => e.type === 'state-snapshot');
    // Only the initial one — duplicates collapsed.
    expect(snaps.length).toBe(3); // segments.length, segments[0].id, segments[0].x
  });

  test('exports a stable RecordedSession schema usable by adapter-jam or spec-gen', () => {
    setupDom('<div data-segment-id="seg-0"></div>');
    const rec = new Recorder({ sessionId: 'rec-008', vendor: 'cuit' });
    rec.start();
    const seg = document.querySelector('[data-segment-id="seg-0"]')!;
    fireEvent(seg, 'pointerdown', { clientX: 1, clientY: 1, pointerId: 1 });
    rec.stop();
    const out = rec.export();
    expect(out.sessionId).toBe('rec-008');
    expect(out.vendor).toBe('cuit');
    expect(typeof out.createdAt).toBe('number');
    expect(out.events.length).toBeGreaterThan(1);
    expect(out.events[0]?.type).toBe('nav');
    expect(out.events.every((e) => typeof e.seq === 'number')).toBe(true);
  });

  test('throws when export is called before start', () => {
    setupDom('<div></div>');
    const rec = new Recorder({ sessionId: 'rec-009' });
    expect(() => rec.export()).toThrow(/never started/);
  });

  test('stop() removes listeners — subsequent events do not append', () => {
    setupDom('<div data-segment-id="seg-0"></div>');
    const rec = new Recorder({ sessionId: 'rec-010' });
    rec.start();
    const seg = document.querySelector('[data-segment-id="seg-0"]')!;
    fireEvent(seg, 'pointerdown', { clientX: 1, clientY: 1, pointerId: 1 });
    const sizeWhileRunning = rec.size();
    rec.stop();
    const sizeAfterStop = rec.size();
    fireEvent(seg, 'pointerdown', { clientX: 2, clientY: 2, pointerId: 1 });
    const sizeFinal = rec.size();
    expect(sizeWhileRunning).toBeGreaterThan(0);
    expect(sizeFinal).toBe(sizeAfterStop);
  });

  test('cuitDebugProvider reads from window.__cuitDebug.getState()', () => {
    (window as unknown as { __cuitDebug: { getState: () => Record<string, unknown> } }).__cuitDebug = {
      getState: () => ({ segments: [{ id: 'seg-0', x: 42 }] }),
    };
    expect(isCuitDebugAvailable()).toBe(true);
    const snap = cuitDebugProvider();
    expect(snap).toEqual({ segments: [{ id: 'seg-0', x: 42 }] });
  });

  test('cuitDebugProvider returns null when no debug hook is exposed', () => {
    expect(isCuitDebugAvailable()).toBe(false);
    expect(cuitDebugProvider()).toBeNull();
  });
});
