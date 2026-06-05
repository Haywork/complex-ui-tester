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

export type SessionEvent = PointerEvent | StateSnapshotEvent | NavEvent;

export type Primitive =
  | { kind: 'goto'; url: string }
  | { kind: 'setClock'; t: number }
  | { kind: 'getStateSnapshot' }
  | { kind: 'dispatchDrag'; targetName: string; dx: number; dy: number }
  | { kind: 'assertStateEquals'; path: string; value: unknown };

export type GeneratedSpec = {
  testName: string;
  url: string;
  primitives: Primitive[];
  expectedFinalState: Array<{ path: string; value: unknown }>;
};
