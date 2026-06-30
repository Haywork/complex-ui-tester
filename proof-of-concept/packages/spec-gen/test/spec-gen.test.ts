import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import type { GeneratedSpec, SessionEvent } from '@haywork/cuit-types';
import { generateSpec, serializeSpec } from '../src/index.js';
import {
  SEGMENT_COLLISION_EVENTS,
  SEGMENT_COLLISION_START_TS,
  SEGMENT_COLLISION_URL,
} from './fixtures/segment-collision-events.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_SPEC_PATH = resolve(
  __dirname,
  '../../../fixtures/expected-spec.ts',
);

const normalizeWhitespace = (s: string): string =>
  s.replace(/\s+/g, ' ').trim();

const primitiveKinds = (spec: GeneratedSpec): string[] =>
  spec.primitives.map((p) => p.kind);

describe('generateSpec', () => {
  test('emits canonical primitive sequence for segment-collision events', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(primitiveKinds(spec)).toEqual([
      'goto',
      'setClock',
      'getStateSnapshot',
      'dispatchDrag',
      'getStateSnapshot',
      'assertStateEquals',
    ]);
  });

  test('goto primitive carries the nav URL from the session', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives[0]).toEqual({
      kind: 'goto',
      url: SEGMENT_COLLISION_URL,
    });
    expect(spec.url).toEqual(SEGMENT_COLLISION_URL);
  });

  test('setClock primitive uses the first session timestamp', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives[1]).toEqual({
      kind: 'setClock',
      t: SEGMENT_COLLISION_START_TS,
    });
  });

  test('dispatchDrag primitive collapses pointer stream into target/dx/dy', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives[3]).toEqual({
      kind: 'dispatchDrag',
      targetName: 'seg-0',
      dx: 100,
      dy: 0,
    });
  });

  test('assertStateEquals uses pointer total dx as the expected segments[0].x', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(spec.primitives[5]).toEqual({
      kind: 'assertStateEquals',
      path: 'segments[0].x',
      value: 100,
    });

    expect(spec.expectedFinalState).toContainEqual({
      path: 'segments[0].x',
      value: 100,
    });
  });

  test('generated spec is deterministic for identical input', () => {
    const a = generateSpec(SEGMENT_COLLISION_EVENTS);
    const b = generateSpec(SEGMENT_COLLISION_EVENTS);

    expect(a).toEqual(b);
  });

  test('throws when no pointer-down event is present (cannot ground drag)', () => {
    const eventsWithoutDown: SessionEvent[] = SEGMENT_COLLISION_EVENTS.filter(
      (e) => !(e.type === 'pointer' && e.phase === 'down'),
    );

    expect(() => generateSpec(eventsWithoutDown)).toThrow(/pointer/i);
  });

  test('throws on empty event list', () => {
    expect(() => generateSpec([])).toThrow(/empty|no events/i);
  });
});

describe('serializeSpec', () => {
  test('serialized output matches fixtures/expected-spec.ts modulo whitespace', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);
    const serialized = serializeSpec(spec);
    const expected = readFileSync(EXPECTED_SPEC_PATH, 'utf8');

    expect(normalizeWhitespace(serialized)).toEqual(
      normalizeWhitespace(expected),
    );
  });

  test('serialized output imports the harness primitives it uses', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);
    const serialized = serializeSpec(spec);

    expect(serialized).toContain("from '@haywork/cuit-harness'");
    expect(serialized).toContain('dispatchDrag');
    expect(serialized).toContain('getStateSnapshot');
    expect(serialized).toContain('setClock');
  });

  test('serialized output embeds the setClock timestamp literally', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);
    const serialized = serializeSpec(spec);

    expect(serialized).toContain(`setClock(${SEGMENT_COLLISION_START_TS})`);
  });

  test('serialized output dispatches drag with the computed dx/dy', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);
    const serialized = serializeSpec(spec);

    expect(serialized).toContain("dispatchDrag('seg-0', 100, 0)");
  });

  test('serialized output asserts the post-drag segments[0].x value', () => {
    const spec = generateSpec(SEGMENT_COLLISION_EVENTS);
    const serialized = serializeSpec(spec);

    expect(serialized).toContain("snapshot['segments[0].x']");
    expect(serialized).toContain('toEqual(100)');
  });
});
