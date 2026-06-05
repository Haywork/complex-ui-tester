export type StateSnapshot = Record<string, unknown>;

export type SnapshotProvider = () => StateSnapshot;

type RafCallback = (time: number) => void;

let currentTime: number | null = null;
let rafQueue: RafCallback[] = [];
let rafHandleSeq = 0;
let rafInstalled = false;
let snapshotProvider: SnapshotProvider | null = null;

const originalDateNow = Date.now.bind(Date);

function installRafIfNeeded(): void {
  if (rafInstalled) return;
  rafInstalled = true;

  Date.now = (): number => (currentTime !== null ? currentTime : originalDateNow());

  globalThis.requestAnimationFrame = ((cb: RafCallback): number => {
    rafHandleSeq += 1;
    rafQueue.push(cb);
    return rafHandleSeq;
  }) as typeof globalThis.requestAnimationFrame;

  globalThis.cancelAnimationFrame = ((_handle: number): void => {
    // Handles are not individually tracked; the queue is flushed on every
    // clock advance. Cancel is a no-op for the deterministic harness.
  }) as typeof globalThis.cancelAnimationFrame;
}

export function setClock(t: number): void {
  installRafIfNeeded();
  currentTime = t;
  // Drain only the callbacks already queued — anything scheduled during
  // a callback runs on the NEXT advance.
  const toRun = rafQueue;
  rafQueue = [];
  for (const cb of toRun) {
    cb(t);
  }
}

const POINTER_ID = 1;
const POINTER_TYPE = 'mouse';
const DRAG_STEPS = 4;

function createPointerEvent(
  type: string,
  clientX: number,
  clientY: number,
): Event {
  const PE = (globalThis as { PointerEvent?: typeof PointerEvent }).PointerEvent;
  if (typeof PE === 'function') {
    return new PE(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX,
      clientY,
      pointerId: POINTER_ID,
      pointerType: POINTER_TYPE,
      isPrimary: true,
    });
  }
  // jsdom may not implement PointerEvent — fall back to MouseEvent and
  // augment it with the pointer-specific properties the tests inspect.
  const ev = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX,
    clientY,
  });
  Object.defineProperty(ev, 'pointerId', { value: POINTER_ID, enumerable: true });
  Object.defineProperty(ev, 'pointerType', { value: POINTER_TYPE, enumerable: true });
  Object.defineProperty(ev, 'isPrimary', { value: true, enumerable: true });
  return ev;
}

export function dispatchDrag(targetName: string, dx: number, dy: number): void {
  const target = document.querySelector<HTMLElement>(
    `[data-segment-id="${targetName}"]`,
  );
  if (!target) {
    throw new Error(`dispatchDrag: no element with data-segment-id="${targetName}"`);
  }

  const rect = target.getBoundingClientRect();
  const startX = rect.x + rect.width / 2;
  const startY = rect.y + rect.height / 2;

  target.dispatchEvent(createPointerEvent('pointerdown', startX, startY));

  for (let i = 1; i <= DRAG_STEPS; i += 1) {
    const fraction = i / DRAG_STEPS;
    const x = startX + dx * fraction;
    const y = startY + dy * fraction;
    target.dispatchEvent(createPointerEvent('pointermove', x, y));
  }

  target.dispatchEvent(createPointerEvent('pointerup', startX + dx, startY + dy));
}

export function getStateSnapshot(): StateSnapshot {
  if (snapshotProvider === null) {
    throw new Error('getStateSnapshot: no snapshot provider registered');
  }
  return snapshotProvider();
}

export function registerStateSnapshot(provider: SnapshotProvider): void {
  if (snapshotProvider !== null) {
    throw new Error('registerStateSnapshot: a snapshot provider is already registered (single source of truth)');
  }
  snapshotProvider = provider;
}
