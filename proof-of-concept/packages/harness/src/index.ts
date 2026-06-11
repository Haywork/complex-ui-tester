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

/**
 * Remove the currently registered snapshot provider.
 * Use in test teardown to allow re-registration across test boundaries.
 * No-op when no provider is registered.
 */
export function resetStateSnapshot(): void {
  snapshotProvider = null;
}

let capturedConsoleErrors: unknown[][] = [];
let originalConsoleError: typeof console.error | null = null;

/**
 * Start intercepting `console.error` so a later `assertNoConsoleErrors()` can
 * fail the test if any were emitted during the interaction.
 * Idempotent: if already intercepting, does NOT reset the buffer (preserves
 * any errors captured since the first call). Only a fresh install resets.
 */
export function captureConsoleErrors(): void {
  if (originalConsoleError !== null) return;
  capturedConsoleErrors = [];
  originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]): void => {
    capturedConsoleErrors.push(args);
  };
}

/** Stop intercepting and restore the original `console.error`. */
export function restoreConsoleErrors(): void {
  if (originalConsoleError === null) return;
  console.error = originalConsoleError;
  originalConsoleError = null;
  capturedConsoleErrors = [];
}

/** The console.error calls captured since the last `captureConsoleErrors()`. */
export function getCapturedConsoleErrors(): unknown[][] {
  return [...capturedConsoleErrors];
}

/**
 * Returns true when the given console.error args are a React test-environment
 * `act()` warning. These are framework noise that should never count as
 * application regressions in the CUIT signal.
 */
function isReactActWarning(args: unknown[]): boolean {
  const msg = args.map((a) => String(a)).join(' ');
  // React emits: "Warning: An update to %s inside a test was not wrapped in act(...)."
  return (
    msg.includes('not wrapped in act(') ||
    msg.includes('inside a test was not wrapped')
  );
}

/**
 * Throw if any `console.error` was captured during the interaction. A console
 * error during a UI action is a regression signal even when state looks right.
 * React's internal `act()` warnings are filtered out because they are test-env
 * noise rather than application bugs.
 */
export function assertNoConsoleErrors(): void {
  const appErrors = capturedConsoleErrors.filter(
    (args) => !isReactActWarning(args),
  );
  if (appErrors.length === 0) return;
  const rendered = appErrors
    .map((args) => args.map((a) => String(a)).join(' '))
    .join('\n');
  throw new Error(
    `assertNoConsoleErrors: ${appErrors.length} console error(s) ` +
      `during interaction:\n${rendered}`,
  );
}
