import type {
  NavEvent,
  PointerEvent,
  SessionEvent,
  StateSnapshotEvent,
} from '@cuit/types';

export type RawJamSession = {
  sessionId: string;
  vendor: string;
  createdAt: string;
  browser?: Record<string, unknown>;
  viewport?: Record<string, unknown>;
  url: string;
  events: unknown[];
};

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  if (value === null || typeof value !== 'object') {
    throw new Error('Jam event is not an object');
  }
  return value as RawRecord;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Jam event field "${field}" is not a finite number`);
  }
  return value;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Jam event field "${field}" is not a string`);
  }
  return value;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Jam event field "${field}" is not a string`);
  }
  return value;
}

function asPointerPhase(value: unknown): 'down' | 'move' | 'up' {
  if (value === 'down' || value === 'move' || value === 'up') {
    return value;
  }
  throw new Error(`Jam pointer event has invalid phase: ${String(value)}`);
}

function normalizeOne(raw: unknown): SessionEvent {
  const record = asRecord(raw);
  const seq = asNumber(record.seq, 'seq');
  const ts = asNumber(record.ts, 'ts');
  const wallClockRaw = record.wallClock;
  const wallClock =
    typeof wallClockRaw === 'number' && Number.isFinite(wallClockRaw)
      ? wallClockRaw
      : 0;
  const vendorEventId = asString(record.vendorEventId, 'vendorEventId');
  const type = asString(record.type, 'type');

  const base = {
    seq,
    ts,
    wallClock,
    vendor: 'jam' as const,
    vendorEventId,
  };

  if (type === 'nav') {
    const event: NavEvent = {
      ...base,
      type: 'nav',
      url: asString(record.url, 'url'),
    };
    return event;
  }

  if (type === 'state-snapshot') {
    const event: StateSnapshotEvent = {
      ...base,
      type: 'state-snapshot',
      path: asString(record.path, 'path'),
      value: record.value,
    };
    return event;
  }

  if (type === 'pointer') {
    const event: PointerEvent = {
      ...base,
      type: 'pointer',
      phase: asPointerPhase(record.phase),
      targetSelector: asString(record.targetSelector, 'targetSelector'),
      targetName: asOptionalString(record.targetName, 'targetName'),
      x: asNumber(record.x, 'x'),
      y: asNumber(record.y, 'y'),
      pointerId: asNumber(record.pointerId, 'pointerId'),
    };
    return event;
  }

  throw new Error(`Unknown Jam event type: ${type}`);
}

export function normalizeJamSession(raw: RawJamSession): SessionEvent[] {
  const normalized = raw.events.map(normalizeOne);
  normalized.sort((a, b) => a.seq - b.seq);
  return normalized;
}
