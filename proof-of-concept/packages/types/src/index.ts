export type SessionEventBase = {
  ts: number;
  wallClock: number;
  seq: number;
  vendor: 'cuit' | 'jam' | 'logrocket' | 'sentry-replay' | 'fullstory' | 'datadog-rum';
  vendorEventId: string;
  metadata?: Record<string, unknown>;
};

export type PointerEvent = SessionEventBase & {
  type: 'pointer';
  phase: 'down' | 'move' | 'up';
  targetSelector: string;
  targetName?: string;
  x: number;
  y: number;
  pointerId: number;
};

export type StateSnapshotEvent = SessionEventBase & {
  type: 'state-snapshot';
  path: string;
  value: unknown;
};

export type NavEvent = SessionEventBase & {
  type: 'nav';
  url: string;
};

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/** Runtime constant — all valid console levels, useful for iteration and guards. */
export const CONSOLE_LEVELS: readonly ConsoleLevel[] = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
] as const;

/** Returns true when `v` is a valid `ConsoleLevel` string. Accepts `unknown`. */
export const isConsoleLevel = (v: unknown): v is ConsoleLevel =>
  typeof v === 'string' && (CONSOLE_LEVELS as readonly string[]).includes(v);

/**
 * Sanitise and cap a `console.*` arguments array so it is always
 * JSON-safe and bounded in size.
 *
 * - Caps to `maxCount` entries (default 10).
 * - Returns a **new** array — never mutates the input.
 * - Replaces non-JSON-safe values (functions, undefined, Symbols, circular
 *   objects) with a descriptive placeholder string so the result round-trips
 *   through `JSON.stringify` without throwing.
 */
export function capArgs(args: unknown[], maxCount = 10): unknown[] {
  const capped = args.slice(0, maxCount);
  return capped.map((v) => sanitiseArg(v));
}

function sanitiseArg(v: unknown): unknown {
  if (v === undefined) return '[undefined]';
  if (typeof v === 'function') return `[Function: ${(v as { name?: string }).name ?? 'anonymous'}]`;
  if (typeof v === 'symbol') return `[Symbol: ${v.toString()}]`;
  if (v !== null && typeof v === 'object') {
    try {
      JSON.stringify(v);
      return v;
    } catch {
      return '[Circular/Non-serializable]';
    }
  }
  return v;
}

/**
 * A captured `console.*` call. `args` is JSON-safe (non-serializable values are
 * coerced to strings by the recorder) and capped to keep the trace bounded.
 * `message` is the space-joined string representation of all args.
 * `stack` is populated for `error`-level entries when one is available.
 */
export type ConsoleEvent = SessionEventBase & {
  type: 'console';
  level: ConsoleLevel;
  /** Space-joined string representation of all serialised args. */
  message: string;
  args: unknown[];
  stack?: string;
};

/**
 * An uncaught error (`window.onerror`) or an unhandled promise rejection
 * (`unhandledrejection`). `source` distinguishes the two origins.
 */
export type ErrorEvent = SessionEventBase & {
  type: 'error-event';
  message: string;
  stack?: string;
  source?: 'window.error' | 'unhandledrejection';
};

/**
 * A keyboard / text-entry event captured when the user types into a field.
 * `value` is the full committed text value of the input at the time of capture
 * (not a sequence of individual keystrokes).
 */
export type KeyboardEvent = SessionEventBase & {
  type: 'keyboard';
  targetSelector: string;
  targetName?: string;
  value: string;
};

export type SessionEvent =
  | PointerEvent
  | StateSnapshotEvent
  | NavEvent
  | ConsoleEvent
  | ErrorEvent
  | KeyboardEvent;

export const isConsoleEvent = (e: SessionEvent): e is ConsoleEvent =>
  e.type === 'console';

export const isErrorEvent = (e: SessionEvent): e is ErrorEvent =>
  e.type === 'error-event';

export const isKeyboardEvent = (e: SessionEvent): e is KeyboardEvent =>
  e.type === 'keyboard';

export type Primitive =
  | { kind: 'goto'; url: string }
  | { kind: 'setClock'; t: number }
  | { kind: 'getStateSnapshot' }
  | { kind: 'dispatchDrag'; targetName: string; dx: number; dy: number }
  | { kind: 'dispatchClick'; targetName: string }
  | { kind: 'dispatchType'; targetName: string; value: string }
  | { kind: 'assertStateEquals'; path: string; value: unknown }
  | { kind: 'assertNoConsoleErrors'; count: number };

export type GeneratedSpec = {
  testName: string;
  url: string;
  primitives: Primitive[];
  expectedFinalState: Array<{ path: string; value: unknown }>;
};
