/**
 * Browser-compatible data layer for the Vite app.
 *
 * Contains all types and pure query functions from src/data.ts, PLUS a static
 * JSON import for the demo fixture. We intentionally do NOT re-export from
 * src/data.ts because that module uses Node.js built-ins (readFileSync,
 * fileURLToPath) that Vite cannot bundle for the browser.
 *
 * This module is ONLY used by the Vite app (src/app/*). The Node-based tests
 * continue to import from src/data.ts directly.
 */
import demoJson from '../fixtures/demo.json';

// ============================================================================
// Types (duplicated from src/data.ts to avoid Node.js imports)
// ============================================================================

export type SessionVendor =
  | 'cuit'
  | 'jam'
  | 'logrocket'
  | 'sentry-replay'
  | 'fullstory'
  | 'datadog-rum';

export type Session = {
  id: string;
  title: string;
  vendor: SessionVendor;
  recordedAt: string;
  eventCount: number;
  url: string;
};

export type Spec = {
  id: string;
  sessionId: string;
  testName: string;
  primitiveCount: number;
  generatedAt: string;
};

export type RunStatus = 'green' | 'red' | 'flake';
export type RunFlow = 'baseline' | 'bug-repro';

export type Run = {
  id: string;
  specId: string;
  status: RunStatus;
  flow: RunFlow;
  turnsToGreen: number | null;
  durationMs: number;
  startedAt: string;
};

export type LoopTelemetry = {
  totalRuns: number;
  avgTurnsToGreen: number | null;
  passRate: number;
  flakeRate: number;
};

export type DashboardPayload = {
  generatedAt: string;
  sessions: Session[];
  specs: Spec[];
  runs: Run[];
};

export type DataSource = {
  kind: 'fixtures' | 'api';
  load: () => Promise<DashboardPayload>;
};

// Chat-layer types (from src/data.ts)
export type RunRecord = {
  id: string;
  spec: string;
  status: 'passed' | 'failed';
  durationMs: number;
  startedAt: string;
};

export type FlakySpec = {
  spec: string;
  totalRuns: number;
  failures: number;
  flakeRate: number;
};

export type LoopStats = {
  totalRuns: number;
  passed: number;
  failed: number;
  passRate: number;
  avgDurationMs: number;
};

export type QueryRunsFilter = {
  status?: RunRecord['status'];
  spec?: string;
  limit?: number;
};

export type DashboardData = {
  queryRuns(filter?: QueryRunsFilter): Promise<RunRecord[]>;
  getFlakySpecs(): Promise<FlakySpec[]>;
  getLoopStats(): Promise<LoopStats>;
};

// ============================================================================
// Fixture source — browser-safe (static JSON import, no readFileSync)
// ============================================================================

export const DEMO_DATA: DashboardPayload = Object.freeze(demoJson as DashboardPayload);

export function fixturesSource(data: DashboardPayload = DEMO_DATA): DataSource {
  return {
    kind: 'fixtures',
    load: async () => data,
  };
}

export function apiSource(
  apiUrl: string,
  token?: string,
  fetchImpl: typeof fetch = fetch,
): DataSource {
  const base = apiUrl.replace(/\/+$/, '');
  return {
    kind: 'api',
    load: async () => {
      const headers: Record<string, string> = { accept: 'application/json' };
      if (token) headers.authorization = `Bearer ${token}`;
      const res = await fetchImpl(`${base}/dashboard`, { headers });
      if (!res.ok) {
        throw new Error(
          `dashboard API request failed: ${res.status} ${res.statusText}`,
        );
      }
      return (await res.json()) as DashboardPayload;
    },
  };
}

// ============================================================================
// Pure query functions (no Node I/O — safe to bundle for browser)
// ============================================================================

export async function listSessions(source: DataSource): Promise<Session[]> {
  const { sessions } = await source.load();
  return [...sessions].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export async function getSession(source: DataSource, id: string): Promise<Session | null> {
  const { sessions } = await source.load();
  return sessions.find((s) => s.id === id) ?? null;
}

export async function getSpec(source: DataSource, id: string): Promise<Spec | null> {
  const { specs } = await source.load();
  return specs.find((s) => s.id === id) ?? null;
}

export async function listSpecs(source: DataSource, sessionId?: string): Promise<Spec[]> {
  const { specs } = await source.load();
  const filtered =
    sessionId === undefined ? specs : specs.filter((s) => s.sessionId === sessionId);
  return [...filtered].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export async function listRuns(
  source: DataSource,
  specId?: string,
  flow?: RunFlow,
): Promise<Run[]> {
  const { runs } = await source.load();
  let filtered = specId === undefined ? runs : runs.filter((r) => r.specId === specId);
  if (flow !== undefined) {
    filtered = filtered.filter((r) => r.flow === flow);
  }
  return [...filtered].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function loopStats(runs: readonly Run[]): LoopTelemetry {
  const totalRuns = runs.length;
  if (totalRuns === 0) {
    return { totalRuns: 0, avgTurnsToGreen: null, passRate: 0, flakeRate: 0 };
  }
  let greenCount = 0;
  let flakeCount = 0;
  let turnsSum = 0;
  let turnsCount = 0;
  for (const run of runs) {
    if (run.status === 'green') greenCount += 1;
    if (run.status === 'flake') flakeCount += 1;
    if (run.turnsToGreen !== null) {
      turnsSum += run.turnsToGreen;
      turnsCount += 1;
    }
  }
  return {
    totalRuns,
    avgTurnsToGreen: turnsCount === 0 ? null : turnsSum / turnsCount,
    passRate: greenCount / totalRuns,
    flakeRate: flakeCount / totalRuns,
  };
}
