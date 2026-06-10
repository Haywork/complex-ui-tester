/**
 * Vitest setup for the recorder package.
 *
 * jsdom does not ship PromiseRejectionEvent; provide a minimal polyfill so
 * tests that dispatch `unhandledrejection` events on `window` can construct
 * the event object the same way a real browser would.
 */

if (typeof globalThis.PromiseRejectionEvent === 'undefined') {
  class PromiseRejectionEvent extends Event {
    readonly promise: Promise<unknown>;
    readonly reason: unknown;

    constructor(
      type: string,
      init: { promise: Promise<unknown>; reason?: unknown; bubbles?: boolean; cancelable?: boolean },
    ) {
      super(type, { bubbles: init.bubbles ?? false, cancelable: init.cancelable ?? false });
      this.promise = init.promise;
      this.reason = init.reason;
    }
  }

  // Assign to globalThis so `new PromiseRejectionEvent(...)` works in tests.
  Object.defineProperty(globalThis, 'PromiseRejectionEvent', {
    value: PromiseRejectionEvent,
    configurable: true,
    writable: true,
  });
}
