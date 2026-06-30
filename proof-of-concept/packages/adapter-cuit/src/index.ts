import type {
  NavEvent,
  PointerEvent,
  SessionEvent,
  StateSnapshotEvent,
  ConsoleEvent,
  ErrorEvent,
} from '@haywork/cuit-types';
import { isConsoleLevel } from '@haywork/cuit-types';

export type RawCuitSession = {
  sessionId: string;
  vendor: string;
  /** ms-epoch number — differs from RawJamSession's ISO string createdAt. */
  createdAt: number;
  url: string;
  events: unknown[];
};

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  if (value === null || typeof value !== 'object') {
    throw new Error('Cuit event is not an object');
  }
  return value as RawRecord;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Cuit event field "${field}" is not a finite number`);
  }
  return value;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Cuit event field "${field}" is not a string`);
  }
  return value;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Cuit event field "${field}" is not a string`);
  }
  return value;
}

function asPointerPhase(value: unknown): 'down' | 'move' | 'up' {
  if (value === 'down' || value === 'move' || value === 'up') {
    return value;
  }
  throw new Error(`Cuit pointer event has invalid phase: ${String(value)}`);
}

function normalizeOne(raw: unknown): SessionEvent {
  const record = asRecord(raw);
  const seq = asNumber(record['seq'], 'seq');
  const ts = asNumber(record['ts'], 'ts');
  const wallClockRaw = record['wallClock'];
  const wallClock =
    typeof wallClockRaw === 'number' && Number.isFinite(wallClockRaw)
      ? wallClockRaw
      : 0;
  const vendorEventId = asString(record['vendorEventId'], 'vendorEventId');
  const type = asString(record['type'], 'type');

  const base = {
    seq,
    ts,
    wallClock,
    vendor: 'cuit' as const,
    vendorEventId,
  };

  if (type === 'nav') {
    const event: NavEvent = {
      ...base,
      type: 'nav',
      url: asString(record['url'], 'url'),
    };
    return event;
  }

  if (type === 'state-snapshot') {
    const event: StateSnapshotEvent = {
      ...base,
      type: 'state-snapshot',
      path: asString(record['path'], 'path'),
      value: record['value'],
    };
    return event;
  }

  if (type === 'pointer') {
    const event: PointerEvent = {
      ...base,
      type: 'pointer',
      phase: asPointerPhase(record['phase']),
      targetSelector: asString(record['targetSelector'], 'targetSelector'),
      targetName: asOptionalString(record['targetName'], 'targetName'),
      x: asNumber(record['x'], 'x'),
      y: asNumber(record['y'], 'y'),
      pointerId: asNumber(record['pointerId'], 'pointerId'),
    };
    return event;
  }

  if (type === 'console') {
    const level = record['level'];
    if (!isConsoleLevel(level)) {
      throw new Error(
        `Cuit console event has invalid level: ${String(level)}`,
      );
    }
    const message = asString(record['message'], 'message');
    const argsRaw = record['args'];
    const args = Array.isArray(argsRaw) ? argsRaw : [];
    const stack = asOptionalString(record['stack'], 'stack');
    const event: ConsoleEvent = {
      ...base,
      type: 'console',
      level,
      message,
      args,
      ...(stack !== undefined ? { stack } : {}),
    };
    return event;
  }

  if (type === 'error-event') {
    const message = asString(record['message'], 'message');
    const stack = asOptionalString(record['stack'], 'stack');
    const sourceRaw = record['source'];
    const source =
      sourceRaw === 'window.error' || sourceRaw === 'unhandledrejection'
        ? sourceRaw
        : undefined;
    const event: ErrorEvent = {
      ...base,
      type: 'error-event',
      message,
      ...(stack !== undefined ? { stack } : {}),
      ...(source !== undefined ? { source } : {}),
    };
    return event;
  }

  throw new Error(`Unknown Cuit event type: ${type}`);
}

export function normalizeCuitSession(raw: RawCuitSession): SessionEvent[] {
  const normalized = raw.events.map(normalizeOne);
  normalized.sort((a, b) => a.seq - b.seq);
  return normalized;
}
