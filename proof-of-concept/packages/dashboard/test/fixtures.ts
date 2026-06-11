import type {
  DashboardData,
  FlakySpec,
  LoopStats,
  RunRecord,
} from '../src/data.js';

/**
 * A small, hand-computed dataset used to ground the chat tests. The aggregate
 * fixtures ({@link FIXTURE_FLAKY_SPECS}, {@link FIXTURE_LOOP_STATS}) are derived
 * by hand from {@link FIXTURE_RUNS} so tests assert against an independent
 * oracle, not the implementation's own output.
 */
export const FIXTURE_RUNS: readonly RunRecord[] = [
  { id: 'r1', spec: 'segment-collision', status: 'passed', durationMs: 1200, startedAt: '2026-06-01T10:00:00.000Z' },
  { id: 'r2', spec: 'segment-collision', status: 'failed', durationMs: 1400, startedAt: '2026-06-01T11:00:00.000Z' },
  { id: 'r3', spec: 'segment-collision', status: 'passed', durationMs: 1300, startedAt: '2026-06-01T12:00:00.000Z' },
  { id: 'r4', spec: 'timeline-zoom', status: 'passed', durationMs: 800, startedAt: '2026-06-01T13:00:00.000Z' },
  { id: 'r5', spec: 'timeline-zoom', status: 'passed', durationMs: 900, startedAt: '2026-06-01T14:00:00.000Z' },
  { id: 'r6', spec: 'export-dialog', status: 'failed', durationMs: 2000, startedAt: '2026-06-01T15:00:00.000Z' },
  { id: 'r7', spec: 'export-dialog', status: 'passed', durationMs: 1800, startedAt: '2026-06-01T16:00:00.000Z' },
] as const;

/** Hand-derived from FIXTURE_RUNS: specs with >=1 pass AND >=1 fail. */
export const FIXTURE_FLAKY_SPECS: readonly FlakySpec[] = [
  { spec: 'segment-collision', totalRuns: 3, failures: 1, flakeRate: 1 / 3 },
  { spec: 'export-dialog', totalRuns: 2, failures: 1, flakeRate: 1 / 2 },
] as const;

/** Hand-derived from FIXTURE_RUNS: 7 runs, 5 passed, 2 failed. */
export const FIXTURE_LOOP_STATS: LoopStats = {
  totalRuns: 7,
  passed: 5,
  failed: 2,
  passRate: 5 / 7,
  avgDurationMs: (1200 + 1400 + 1300 + 800 + 900 + 2000 + 1800) / 7,
};

/** An in-memory {@link DashboardData} backed by the fixtures above. */
export function makeFixtureData(): DashboardData {
  return {
    async queryRuns(filter) {
      let rows = [...FIXTURE_RUNS];
      if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
      if (filter?.spec) rows = rows.filter((r) => r.spec === filter.spec);
      if (typeof filter?.limit === 'number') rows = rows.slice(0, filter.limit);
      return rows;
    },
    async getFlakySpecs() {
      return [...FIXTURE_FLAKY_SPECS];
    },
    async getLoopStats() {
      return { ...FIXTURE_LOOP_STATS };
    },
  };
}
