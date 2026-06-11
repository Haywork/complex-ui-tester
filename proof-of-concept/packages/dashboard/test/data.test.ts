/**
 * packages/dashboard/test/data.test.ts
 *
 * Tests for the dashboard entity data layer: source resolution, fixture
 * loading, the read queries, and the loop-telemetry aggregation.
 *
 * Aggregate expectations are pre-computed by hand from the fixture below, so
 * the assertions use an independent oracle rather than re-running the
 * implementation.
 *
 * FAILING tests (TDD red phase) are grouped at the bottom of each describe
 * block and test API surface that does not yet exist in src/data.ts:
 *   - getSpec(source, id) — a per-spec lookup missing from the current exports
 *   - listRuns(source, specId?, flow?) — flow-filter overload not yet accepted
 *   - loopStats over a flow-filtered slice
 *   - apiSource with no token — no Authorization header
 *   - resolveSource reading CUIT_API_URL / CUIT_API_TOKEN from process.env
 */
import { describe, expect, test, vi } from 'vitest';

import {
  DEMO_DATA,
  apiSource,
  fixturesSource,
  getSession,
  listRuns,
  listSessions,
  listSpecs,
  loopStats,
  resolveSource,
  // getSpec does not yet exist — importing it will cause a compile-time / runtime
  // failure that forces the RED phase.
  // @ts-expect-error — intentional: getSpec is not yet exported from data.ts
  getSpec,
  type DashboardPayload,
  type Run,
} from '../src/data.js';

// ---------------------------------------------------------------------------
// Shared hand-computed payload.
//   runs: g1 green t=2 baseline, g2 green t=4 bug-repro,
//         r1 red bug-repro, f1 flake baseline
//   green  = 2/4 = 0.5 ; flake = 1/4 = 0.25
//   avgTurnsToGreen = (2+4)/2 = 3
//   baseline runs: g1 (green t=2), f1 (flake) => passRate 0.5, flakeRate 0.5
// ---------------------------------------------------------------------------
const PAYLOAD: DashboardPayload = {
  generatedAt: '2026-06-11T00:00:00.000Z',
  sessions: [
    { id: 's-old', title: 'Older', vendor: 'cuit', recordedAt: '2026-06-01T08:00:00.000Z', eventCount: 10, url: 'http://x/a' },
    { id: 's-new', title: 'Newer', vendor: 'jam',  recordedAt: '2026-06-02T08:00:00.000Z', eventCount: 20, url: 'http://x/b' },
  ],
  specs: [
    { id: 'spec-a', sessionId: 's-new', testName: 'a', primitiveCount: 3, generatedAt: '2026-06-02T09:00:00.000Z' },
    { id: 'spec-b', sessionId: 's-old', testName: 'b', primitiveCount: 5, generatedAt: '2026-06-01T09:00:00.000Z' },
  ],
  runs: [
    { id: 'g1', specId: 'spec-a', status: 'green', flow: 'baseline',  turnsToGreen: 2,    durationMs: 100, startedAt: '2026-06-02T10:00:00.000Z' },
    { id: 'g2', specId: 'spec-a', status: 'green', flow: 'bug-repro', turnsToGreen: 4,    durationMs: 200, startedAt: '2026-06-02T11:00:00.000Z' },
    { id: 'r1', specId: 'spec-b', status: 'red',   flow: 'bug-repro', turnsToGreen: null, durationMs: 50,  startedAt: '2026-06-02T12:00:00.000Z' },
    { id: 'f1', specId: 'spec-b', status: 'flake', flow: 'baseline',  turnsToGreen: null, durationMs: 60,  startedAt: '2026-06-02T13:00:00.000Z' },
  ],
};

// ---------------------------------------------------------------------------
// describe: resolveSource
// ---------------------------------------------------------------------------
describe('resolveSource', () => {
  test('defaults to the local fixtures source when no API URL is configured', () => {
    const source = resolveSource({ apiUrl: undefined });
    expect(source.kind).toBe('fixtures');
  });

  test('returns an api source when an explicit apiUrl is provided', () => {
    const source = resolveSource({ apiUrl: 'https://api.example.com' });
    expect(source.kind).toBe('api');
  });

  // --- FAILING: env-var paths not yet covered by any test ---

  test('reads CUIT_API_URL from process.env when no explicit apiUrl option is given', () => {
    const original = process.env['CUIT_API_URL'];
    try {
      process.env['CUIT_API_URL'] = 'https://env-api.example.com';
      // resolveSource called with NO options — must pick up the env var
      const source = resolveSource();
      expect(source.kind).toBe('api');
    } finally {
      if (original === undefined) {
        delete process.env['CUIT_API_URL'];
      } else {
        process.env['CUIT_API_URL'] = original;
      }
    }
  });

  test('passes CUIT_API_TOKEN from process.env as the bearer token when resolving an api source', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(PAYLOAD), { status: 200 }),
    ) as unknown as typeof fetch;

    const originalUrl   = process.env['CUIT_API_URL'];
    const originalToken = process.env['CUIT_API_TOKEN'];
    try {
      process.env['CUIT_API_URL']   = 'https://env-api.example.com';
      process.env['CUIT_API_TOKEN'] = 'env_tok_abc';
      const source = resolveSource({ fetchImpl });
      await source.load();
      expect(fetchImpl).toHaveBeenCalledWith(
        'https://env-api.example.com/dashboard',
        { headers: { accept: 'application/json', authorization: 'Bearer env_tok_abc' } },
      );
    } finally {
      if (originalUrl   === undefined) delete process.env['CUIT_API_URL'];
      else process.env['CUIT_API_URL']   = originalUrl;
      if (originalToken === undefined) delete process.env['CUIT_API_TOKEN'];
      else process.env['CUIT_API_TOKEN'] = originalToken;
    }
  });
});

// ---------------------------------------------------------------------------
// describe: fixturesSource
// ---------------------------------------------------------------------------
describe('fixturesSource', () => {
  test('the bundled DEMO_DATA loads with matching entity counts', async () => {
    const data = await fixturesSource().load();
    expect(data.sessions).toHaveLength(DEMO_DATA.sessions.length);
    expect(data.specs).toHaveLength(DEMO_DATA.specs.length);
    expect(data.runs).toHaveLength(DEMO_DATA.runs.length);
  });

  test('DEMO_DATA is frozen so consumers cannot mutate the shared fixture', () => {
    expect(Object.isFrozen(DEMO_DATA)).toBe(true);
  });

  test('every spec references a session that exists in the fixture', () => {
    const sessionIds = new Set(DEMO_DATA.sessions.map((s) => s.id));
    for (const spec of DEMO_DATA.specs) {
      expect(sessionIds).toContain(spec.sessionId);
    }
  });

  test('every run references a spec that exists in the fixture', () => {
    const specIds = new Set(DEMO_DATA.specs.map((s) => s.id));
    for (const run of DEMO_DATA.runs) {
      expect(specIds).toContain(run.specId);
    }
  });
});

// ---------------------------------------------------------------------------
// describe: apiSource
// ---------------------------------------------------------------------------
describe('apiSource', () => {
  test('fetches /dashboard with a bearer token and returns the parsed payload', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(PAYLOAD), { status: 200 }),
    ) as unknown as typeof fetch;

    const source = apiSource('https://api.example.com/', 'tok_123', fetchImpl);
    const data = await source.load();

    expect(source.kind).toBe('api');
    expect(data).toEqual(PAYLOAD);
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.com/dashboard', {
      headers: { accept: 'application/json', authorization: 'Bearer tok_123' },
    });
  });

  test('throws with the status text when the API responds non-2xx', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('nope', { status: 503, statusText: 'Service Unavailable' }),
    ) as unknown as typeof fetch;

    const source = apiSource('https://api.example.com', undefined, fetchImpl);
    await expect(source.load()).rejects.toThrow('503 Service Unavailable');
  });

  // --- FAILING: no-token path not yet covered ---

  test('omits the Authorization header entirely when no token is supplied', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(PAYLOAD), { status: 200 }),
    ) as unknown as typeof fetch;

    const source = apiSource('https://api.example.com', undefined, fetchImpl);
    await source.load();

    const [, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    // No Authorization key must be present when token is omitted.
    expect(Object.keys(headers)).not.toContain('authorization');
    expect(headers['accept']).toBe('application/json');
  });
});

// ---------------------------------------------------------------------------
// describe: listSessions
// ---------------------------------------------------------------------------
describe('listSessions', () => {
  test('returns sessions sorted newest-first by recordedAt', async () => {
    const sessions = await listSessions(fixturesSource(PAYLOAD));
    expect(sessions.map((s) => s.id)).toEqual(['s-new', 's-old']);
  });

  test('returns an empty array when the payload has no sessions', async () => {
    const empty: DashboardPayload = { ...PAYLOAD, sessions: [] };
    const sessions = await listSessions(fixturesSource(empty));
    expect(sessions).toEqual([]);
  });

  test('does not mutate the underlying payload sessions array', async () => {
    const payload: DashboardPayload = { ...PAYLOAD };
    const before = payload.sessions.map((s) => s.id);
    await listSessions(fixturesSource(payload));
    expect(payload.sessions.map((s) => s.id)).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// describe: getSession
// ---------------------------------------------------------------------------
describe('getSession', () => {
  test('returns the matching session by id', async () => {
    const session = await getSession(fixturesSource(PAYLOAD), 's-old');
    expect(session?.id).toBe('s-old');
  });

  test('returns null when no session matches', async () => {
    const session = await getSession(fixturesSource(PAYLOAD), 'does-not-exist');
    expect(session).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describe: getSpec  (FAILING — function not yet exported from src/data.ts)
// ---------------------------------------------------------------------------
describe('getSpec', () => {
  test('returns the matching spec by id', async () => {
    // getSpec is not yet implemented; this call will throw at runtime.
    const spec = await getSpec(fixturesSource(PAYLOAD), 'spec-a');
    expect(spec?.id).toBe('spec-a');
    expect(spec?.sessionId).toBe('s-new');
  });

  test('returns null when no spec matches the given id', async () => {
    const spec = await getSpec(fixturesSource(PAYLOAD), 'does-not-exist');
    expect(spec).toBeNull();
  });

  test('returns null from an empty-specs payload', async () => {
    const empty: DashboardPayload = { ...PAYLOAD, specs: [] };
    const spec = await getSpec(fixturesSource(empty), 'spec-a');
    expect(spec).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describe: listSpecs
// ---------------------------------------------------------------------------
describe('listSpecs', () => {
  test('returns all specs newest-first by generatedAt when unfiltered', async () => {
    const specs = await listSpecs(fixturesSource(PAYLOAD));
    expect(specs.map((s) => s.id)).toEqual(['spec-a', 'spec-b']);
  });

  test('returns only specs derived from the given sessionId', async () => {
    const specs = await listSpecs(fixturesSource(PAYLOAD), 's-old');
    expect(specs.map((s) => s.id)).toEqual(['spec-b']);
  });

  test('returns an empty array for a sessionId with no associated specs', async () => {
    const specs = await listSpecs(fixturesSource(PAYLOAD), 'session-with-no-specs');
    expect(specs).toEqual([]);
  });

  test('returns an empty array when the payload has no specs', async () => {
    const empty: DashboardPayload = { ...PAYLOAD, specs: [] };
    const specs = await listSpecs(fixturesSource(empty));
    expect(specs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// describe: listRuns
// ---------------------------------------------------------------------------
describe('listRuns', () => {
  test('returns all runs newest-first by startedAt when unfiltered', async () => {
    const runs = await listRuns(fixturesSource(PAYLOAD));
    expect(runs.map((r) => r.id)).toEqual(['f1', 'r1', 'g2', 'g1']);
  });

  test('returns only runs of the given specId', async () => {
    const runs = await listRuns(fixturesSource(PAYLOAD), 'spec-a');
    expect(runs.map((r) => r.id)).toEqual(['g2', 'g1']);
  });

  test('returns an empty array when specId has no runs', async () => {
    const runs = await listRuns(fixturesSource(PAYLOAD), 'spec-that-has-no-runs');
    expect(runs).toEqual([]);
  });

  test('does not mutate the underlying payload runs array', async () => {
    const payload: DashboardPayload = { ...PAYLOAD };
    const before = payload.runs.map((r) => r.id);
    await listRuns(fixturesSource(payload));
    expect(payload.runs.map((r) => r.id)).toEqual(before);
  });

  // --- FAILING: flow filter overload not yet implemented in listRuns ---

  test('filters by flow when a flow argument is supplied — returns only baseline runs', async () => {
    // listRuns currently accepts (source, specId?) only; a second positional
    // `flow` argument does not exist yet.  When implemented the signature
    // should be:  listRuns(source, specId?, flow?)
    // Baseline runs in PAYLOAD: g1 (spec-a), f1 (spec-b)
    const runs = await (listRuns as (s: unknown, specId: string | undefined, flow: string) => Promise<Run[]>)(
      fixturesSource(PAYLOAD),
      undefined,
      'baseline',
    );
    expect(runs.map((r) => r.id).sort()).toEqual(['f1', 'g1'].sort());
  });

  test('combines specId and flow filters so only matching runs are returned', async () => {
    // spec-a has two runs: g1 (baseline) and g2 (bug-repro).
    // With specId='spec-a' AND flow='bug-repro' only g2 should come back.
    const runs = await (listRuns as (s: unknown, specId: string, flow: string) => Promise<Run[]>)(
      fixturesSource(PAYLOAD),
      'spec-a',
      'bug-repro',
    );
    expect(runs.map((r) => r.id)).toEqual(['g2']);
  });
});

// ---------------------------------------------------------------------------
// describe: loopStats
// ---------------------------------------------------------------------------
describe('loopStats', () => {
  test('computes aggregates from the hand-computed payload oracle', () => {
    // Oracle (by hand from PAYLOAD.runs): 4 runs, 2 green, 1 flake,
    // turnsToGreen present on the 2 green runs => (2 + 4) / 2 = 3.
    expect(loopStats(PAYLOAD.runs)).toEqual({
      totalRuns: 4,
      avgTurnsToGreen: 3,
      passRate: 0.5,
      flakeRate: 0.25,
    });
  });

  test('returns the empty aggregate for no runs', () => {
    expect(loopStats([])).toEqual({
      totalRuns: 0,
      avgTurnsToGreen: null,
      passRate: 0,
      flakeRate: 0,
    });
  });

  test('avgTurnsToGreen is null when no run reached green', () => {
    const runs: Run[] = [
      { id: 'r', specId: 'spec-b', status: 'red',   flow: 'bug-repro', turnsToGreen: null, durationMs: 10, startedAt: '2026-06-02T12:00:00.000Z' },
      { id: 'f', specId: 'spec-b', status: 'flake', flow: 'baseline',  turnsToGreen: null, durationMs: 20, startedAt: '2026-06-02T13:00:00.000Z' },
    ];
    const stats = loopStats(runs);
    expect(stats.avgTurnsToGreen).toBeNull();
    expect(stats.passRate).toBe(0);
    expect(stats.flakeRate).toBe(0.5);
  });

  test('matches an independent reduce over the bundled DEMO_DATA', async () => {
    const runs = await listRuns(fixturesSource());
    const green     = runs.filter((r) => r.status === 'green');
    const flake     = runs.filter((r) => r.status === 'flake');
    const withTurns = runs.filter((r) => r.turnsToGreen !== null);
    const expectedAvg =
      withTurns.length === 0
        ? null
        : withTurns.reduce((sum, r) => sum + (r.turnsToGreen ?? 0), 0) /
          withTurns.length;

    expect(loopStats(runs)).toEqual({
      totalRuns:       runs.length,
      avgTurnsToGreen: expectedAvg,
      passRate:        green.length / runs.length,
      flakeRate:       flake.length / runs.length,
    });
  });

  test('returns passRate 1 and correct avgTurnsToGreen when every run is green', () => {
    // All-green oracle: 3 runs, turns = [1, 3, 5] => avg = 3.
    const runs: Run[] = [
      { id: 'a', specId: 's', status: 'green', flow: 'baseline',  turnsToGreen: 1, durationMs: 10, startedAt: '2026-06-01T00:00:00.000Z' },
      { id: 'b', specId: 's', status: 'green', flow: 'bug-repro', turnsToGreen: 3, durationMs: 20, startedAt: '2026-06-01T01:00:00.000Z' },
      { id: 'c', specId: 's', status: 'green', flow: 'baseline',  turnsToGreen: 5, durationMs: 30, startedAt: '2026-06-01T02:00:00.000Z' },
    ];
    expect(loopStats(runs)).toEqual({
      totalRuns:       3,
      avgTurnsToGreen: 3,
      passRate:        1,
      flakeRate:       0,
    });
  });

  test('result is invariant to the order of input runs (commutativity)', () => {
    // loopStats should produce the same result regardless of run ordering.
    const runs: Run[] = [...PAYLOAD.runs];
    const reversed     = [...runs].reverse();
    expect(loopStats(runs)).toEqual(loopStats(reversed));
  });

  test('a single green run produces avgTurnsToGreen equal to its own turnsToGreen', () => {
    const run: Run = {
      id: 'solo', specId: 'spec-a', status: 'green', flow: 'baseline',
      turnsToGreen: 7, durationMs: 100, startedAt: '2026-06-01T00:00:00.000Z',
    };
    const stats = loopStats([run]);
    expect(stats.totalRuns).toBe(1);
    expect(stats.avgTurnsToGreen).toBe(7);
    expect(stats.passRate).toBe(1);
    expect(stats.flakeRate).toBe(0);
  });

  // --- FAILING: loopStats over a flow-filtered subset requires the flow
  //     filter on listRuns which does not yet exist.  When listRuns gains
  //     a flow argument these should pass with no changes to the assertion. ---

  test('baseline-only telemetry matches a hand-computed oracle over PAYLOAD baseline runs', async () => {
    // Baseline runs in PAYLOAD: g1 (green t=2), f1 (flake)
    // Oracle: totalRuns=2, passRate=0.5, flakeRate=0.5, avgTurnsToGreen=2 (only g1)
    const baselineRuns = await (listRuns as (s: unknown, specId: string | undefined, flow: string) => Promise<Run[]>)(
      fixturesSource(PAYLOAD),
      undefined,
      'baseline',
    );
    expect(loopStats(baselineRuns)).toEqual({
      totalRuns:       2,
      avgTurnsToGreen: 2,
      passRate:        0.5,
      flakeRate:       0.5,
    });
  });
});
