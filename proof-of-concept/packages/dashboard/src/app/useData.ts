/**
 * React hook — loads the dashboard entity data from the local fixtures source.
 *
 * No backend required. To switch to the API, set VITE_CUIT_API_URL (and
 * optionally VITE_CUIT_API_TOKEN) in a .env file; the hook will pick them up
 * automatically via resolveSource.
 *
 * This module imports from dataLayer.ts (browser-safe) rather than data.ts
 * (which uses Node.js readFileSync for fixture loading).
 */
import { useEffect, useState } from 'react';
import {
  fixturesSource,
  apiSource,
  listSessions,
  listSpecs,
  listRuns,
  loopStats,
  type Session,
  type Spec,
  type Run,
  type LoopTelemetry,
} from './dataLayer.js';
import type { DashboardData, QueryRunsFilter } from './dataLayer.js';

export type DashboardState = {
  loading: boolean;
  error: string | null;
  sessions: Session[];
  specs: Spec[];
  runs: Run[];
  telemetry: LoopTelemetry;
};

const EMPTY_TELEMETRY: LoopTelemetry = {
  totalRuns: 0,
  avgTurnsToGreen: null,
  passRate: 0,
  flakeRate: 0,
};

function resolveViteSource() {
  const apiUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta.env as Record<string, string | undefined>).VITE_CUIT_API_URL
      : undefined;
  const apiToken =
    typeof import.meta !== 'undefined'
      ? (import.meta.env as Record<string, string | undefined>).VITE_CUIT_API_TOKEN
      : undefined;

  if (apiUrl && apiUrl.length > 0) {
    return apiSource(apiUrl, apiToken);
  }
  return fixturesSource();
}

export function useDashboardData(): DashboardState {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    sessions: [],
    specs: [],
    runs: [],
    telemetry: EMPTY_TELEMETRY,
  });

  useEffect(() => {
    let cancelled = false;
    const source = resolveViteSource();

    async function load() {
      try {
        const [sessions, specs, runs] = await Promise.all([
          listSessions(source),
          listSpecs(source),
          listRuns(source),
        ]);
        const telemetry = loopStats(runs);
        if (!cancelled) {
          setState({ loading: false, error: null, sessions, specs, runs, telemetry });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          }));
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return state;
}

/**
 * Derive the chat-oriented DashboardData implementation from the raw payload.
 * This adapter maps the entity data layer onto the chat tool interface so both
 * features share a single data load.
 */
export function makeChatData(payload: {
  sessions: Session[];
  specs: Spec[];
  runs: Run[];
}): DashboardData {
  // Build RunRecord objects (the chat layer uses the simpler RunRecord type).
  const runRecords = payload.runs.map((r) => ({
    id: r.id,
    spec: r.specId,
    status: r.status === 'green' ? ('passed' as const) : ('failed' as const),
    durationMs: r.durationMs,
    startedAt: r.startedAt,
  }));

  // Build flaky specs: specs with at least one green AND one non-green run.
  const specRunMap = new Map<string, typeof runRecords[number][]>();
  for (const r of runRecords) {
    const arr = specRunMap.get(r.spec) ?? [];
    arr.push(r);
    specRunMap.set(r.spec, arr);
  }

  const flakySpecs = Array.from(specRunMap.entries())
    .filter(([, runs]) => {
      const hasPassed = runs.some((r) => r.status === 'passed');
      const hasFailed = runs.some((r) => r.status === 'failed');
      return hasPassed && hasFailed;
    })
    .map(([spec, runs]) => {
      const failures = runs.filter((r) => r.status === 'failed').length;
      return {
        spec,
        totalRuns: runs.length,
        failures,
        flakeRate: failures / runs.length,
      };
    });

  const passed = runRecords.filter((r) => r.status === 'passed');
  const failed = runRecords.filter((r) => r.status === 'failed');
  const avgDurationMs =
    runRecords.length === 0
      ? 0
      : runRecords.reduce((s, r) => s + r.durationMs, 0) / runRecords.length;

  const loopStatsSummary = {
    totalRuns: runRecords.length,
    passed: passed.length,
    failed: failed.length,
    passRate: runRecords.length === 0 ? 0 : passed.length / runRecords.length,
    avgDurationMs,
  };

  return {
    async queryRuns(filter?: QueryRunsFilter) {
      let rows = [...runRecords];
      if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
      if (filter?.spec) rows = rows.filter((r) => r.spec === filter.spec);
      if (typeof filter?.limit === 'number') rows = rows.slice(0, filter.limit);
      return rows;
    },
    async getFlakySpecs() {
      return [...flakySpecs];
    },
    async getLoopStats() {
      return { ...loopStatsSummary };
    },
  };
}
