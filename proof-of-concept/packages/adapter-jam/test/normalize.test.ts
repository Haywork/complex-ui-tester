import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type {
  PointerEvent,
  SessionEvent,
  StateSnapshotEvent,
  NavEvent,
} from '@cuit/types';
import { normalizeJamSession, type RawJamSession } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(
  here,
  '../../../fixtures/segment-collision.json',
);

const TOTAL_FIXTURE_EVENTS = 47;
const POINTER_DOWN_SEQ = 4;
const POINTER_UP_SEQ = 45;
const FINAL_SNAPSHOT_SEQ = 46;

function loadFixture(): RawJamSession {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as RawJamSession;
  return raw;
}

function makeRawSession(events: unknown[]): RawJamSession {
  return {
    sessionId: 'jam-test-session',
    vendor: 'jam',
    createdAt: '2026-05-20T14:13:00.000Z',
    url: 'http://localhost:5173/',
    events,
  };
}

describe('normalizeJamSession', () => {
  test('emits exactly one SessionEvent per fixture event', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    expect(normalized).toHaveLength(TOTAL_FIXTURE_EVENTS);
    expect(raw.events).toHaveLength(TOTAL_FIXTURE_EVENTS);
  });

  test('stamps every event with vendor "jam"', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const vendors = new Set(normalized.map((e) => e.vendor));
    expect(vendors).toEqual(new Set(['jam']));
  });

  test('preserves the original ts and wallClock for the first nav event', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const first = normalized[0];
    expect(first).toBeDefined();
    expect(first?.type).toBe('nav');
    expect(first?.seq).toBe(0);
    expect(first?.ts).toBe(1716800000000);
    expect(first?.wallClock).toBe(1716800000000);
    expect((first as NavEvent).url).toBe('http://localhost:5173/');
  });

  test('returns events sorted by seq ascending', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const seqs = normalized.map((e) => e.seq);
    const sorted = [...seqs].sort((a, b) => a - b);
    expect(seqs).toEqual(sorted);
    expect(seqs[0]).toBe(0);
    expect(seqs[seqs.length - 1]).toBe(TOTAL_FIXTURE_EVENTS - 1);
  });

  test('classifies events into pointer / state-snapshot / nav buckets with the correct counts', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const counts = {
      nav: 0,
      pointer: 0,
      'state-snapshot': 0,
    };
    for (const e of normalized) {
      counts[e.type] = counts[e.type] + 1;
    }
    expect(counts.nav).toBe(1);
    expect(counts['state-snapshot']).toBe(4);
    expect(counts.pointer).toBe(42);
  });

  test('normalizes the pointer-down event with the correct fields', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const down = normalized.find(
      (e): e is PointerEvent =>
        e.type === 'pointer' && e.seq === POINTER_DOWN_SEQ,
    );
    expect(down).toBeDefined();
    expect(down?.phase).toBe('down');
    expect(down?.targetSelector).toBe('[data-segment-id="seg-0"]');
    expect(down?.targetName).toBe('seg-0');
    expect(down?.x).toBe(50);
    expect(down?.y).toBe(60);
    expect(down?.pointerId).toBe(1);
    expect(down?.ts).toBe(1716800000100);
  });

  test('normalizes the pointer-up event at the end of the drag', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const up = normalized.find(
      (e): e is PointerEvent =>
        e.type === 'pointer' && e.seq === POINTER_UP_SEQ,
    );
    expect(up).toBeDefined();
    expect(up?.phase).toBe('up');
    expect(up?.x).toBe(150);
    expect(up?.y).toBe(60);
  });

  test('normalizes the final state-snapshot recording the bug (segments[0].x stays at 0)', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    const finalSnapshot = normalized.find(
      (e): e is StateSnapshotEvent =>
        e.type === 'state-snapshot' && e.seq === FINAL_SNAPSHOT_SEQ,
    );
    expect(finalSnapshot).toBeDefined();
    expect(finalSnapshot?.path).toBe('segments[0].x');
    expect(finalSnapshot?.value).toBe(0);
    expect(finalSnapshot?.ts).toBe(1716800000510);
  });

  test('falls back to wallClock=0 when the source event omits wallClock', () => {
    const raw = makeRawSession([
      {
        seq: 0,
        vendor: 'jam',
        vendorEventId: 'no-wallclock-1',
        ts: 1000,
        type: 'nav',
        url: 'http://localhost:5173/',
      },
    ]);
    const normalized = normalizeJamSession(raw);
    expect(normalized).toHaveLength(1);
    const only = normalized[0];
    expect(only?.wallClock).toBe(0);
    expect(only?.ts).toBe(1000);
  });

  test('sorts out-of-order events by seq before returning them', () => {
    const raw = makeRawSession([
      {
        seq: 2,
        vendor: 'jam',
        vendorEventId: 'oo-3',
        ts: 300,
        wallClock: 300,
        type: 'state-snapshot',
        path: 'segments[0].x',
        value: 42,
      },
      {
        seq: 0,
        vendor: 'jam',
        vendorEventId: 'oo-1',
        ts: 100,
        wallClock: 100,
        type: 'nav',
        url: 'http://localhost:5173/',
      },
      {
        seq: 1,
        vendor: 'jam',
        vendorEventId: 'oo-2',
        ts: 200,
        wallClock: 200,
        type: 'pointer',
        phase: 'down',
        targetSelector: '[data-segment-id="seg-0"]',
        targetName: 'seg-0',
        x: 10,
        y: 20,
        pointerId: 1,
      },
    ]);
    const normalized = normalizeJamSession(raw);
    expect(normalized.map((e) => e.seq)).toEqual([0, 1, 2]);
    expect(normalized.map((e) => e.type)).toEqual([
      'nav',
      'pointer',
      'state-snapshot',
    ]);
    expect(normalized.map((e) => e.vendorEventId)).toEqual([
      'oo-1',
      'oo-2',
      'oo-3',
    ]);
  });

  test('returns an empty array when given a session with no events', () => {
    const raw = makeRawSession([]);
    const normalized = normalizeJamSession(raw);
    expect(normalized).toEqual([]);
  });

  test('produces results that satisfy the SessionEvent discriminated union', () => {
    const raw = loadFixture();
    const normalized = normalizeJamSession(raw);
    for (const event of normalized) {
      const typed: SessionEvent = event;
      expect(typeof typed.seq).toBe('number');
      expect(typeof typed.ts).toBe('number');
      expect(typeof typed.wallClock).toBe('number');
      expect(typeof typed.vendorEventId).toBe('string');
      expect(typed.vendor).toBe('jam');
      if (typed.type === 'pointer') {
        expect(['down', 'move', 'up']).toContain(typed.phase);
        expect(typeof typed.x).toBe('number');
        expect(typeof typed.y).toBe('number');
        expect(typeof typed.pointerId).toBe('number');
        expect(typeof typed.targetSelector).toBe('string');
      } else if (typed.type === 'state-snapshot') {
        expect(typeof typed.path).toBe('string');
      } else {
        expect(typed.type).toBe('nav');
        expect(typeof typed.url).toBe('string');
      }
    }
  });
});
