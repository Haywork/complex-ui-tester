/**
 * The dashboard data layer.
 *
 * The chat module is intentionally decoupled from *where* the data comes from
 * (SQLite, JSON artifacts, an HTTP API …). It only depends on this read-only
 * interface, which the LLM's tools are mapped onto one-to-one. Tests provide a
 * fixture implementation; production wires in the real store.
 */

/** A single recorded run of a CUIT spec / proof loop. */
export type RunRecord = {
  /** Stable run identifier. */
  id: string;
  /** The spec / flow this run exercised. */
  spec: string;
  /** Outcome of the run. */
  status: 'passed' | 'failed';
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** ISO-8601 timestamp of when the run started. */
  startedAt: string;
};

/**
 * A spec the system considers flaky: it has both passes and failures across
 * the queried window. `flakeRate` is in `[0, 1]` — the fraction of runs that
 * failed.
 */
export type FlakySpec = {
  spec: string;
  totalRuns: number;
  failures: number;
  /** failures / totalRuns, in [0, 1]. */
  flakeRate: number;
};

/** Aggregate health of the proof loop over the queried window. */
export type LoopStats = {
  totalRuns: number;
  passed: number;
  failed: number;
  /** passed / totalRuns, in [0, 1]; 0 when there are no runs. */
  passRate: number;
  /** Mean `durationMs` across all runs; 0 when there are no runs. */
  avgDurationMs: number;
};

/** Filters accepted by {@link DashboardData.queryRuns}. */
export type QueryRunsFilter = {
  status?: RunRecord['status'];
  spec?: string;
  /** Cap on the number of rows returned. */
  limit?: number;
};

/**
 * Read-only view of dashboard data. Every method is what a chat tool maps to,
 * so each is deterministic and side-effect free.
 */
export type DashboardData = {
  queryRuns(filter?: QueryRunsFilter): Promise<RunRecord[]>;
  getFlakySpecs(): Promise<FlakySpec[]>;
  getLoopStats(): Promise<LoopStats>;
};

// ===========================================================================
// Entity data layer (sessions / specs / loop runs + telemetry)
//
// The types and functions above back the LLM-native chat tools. The layer
// below backs the dashboard's list/detail views and loop-telemetry widgets.
// It reads its four entities — recorded sessions, generated specs, loop runs,
// and aggregate loop telemetry — from a pluggable SOURCE.
//
// The default source is the bundled local demo fixtures, so the OSS dashboard
// runs standalone with zero backend. Set `CUIT_API_URL` (and optionally
// `CUIT_API_TOKEN`) to point the same functions at the SaaS API instead.
//
// Every query function is pure with respect to its `DataSource` argument:
// given the same source it returns the same result and performs no hidden
// global I/O.
// ===========================================================================

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Origin vendor of a recorded session. */
export type SessionVendor =
  | 'cuit'
  | 'jam'
  | 'logrocket'
  | 'sentry-replay'
  | 'fullstory'
  | 'datadog-rum';

/** A recorded user session, as surfaced to the dashboard list/detail views. */
export type Session = {
  id: string;
  title: string;
  vendor: SessionVendor;
  /** ISO-8601 timestamp. */
  recordedAt: string;
  eventCount: number;
  url: string;
};

/** A spec generated from a recorded session. */
export type Spec = {
  id: string;
  sessionId: string;
  testName: string;
  primitiveCount: number;
  /** ISO-8601 timestamp. */
  generatedAt: string;
};

/** Terminal status of a single loop run. */
export type RunStatus = 'green' | 'red' | 'flake';

/** Which arm of the loop produced the run. */
export type RunFlow = 'baseline' | 'bug-repro';

/** A single execution of a spec through the close-the-loop harness. */
export type Run = {
  id: string;
  specId: string;
  status: RunStatus;
  flow: RunFlow;
  /** Turns the agent needed to reach green; `null` when never reached green. */
  turnsToGreen: number | null;
  durationMs: number;
  /** ISO-8601 timestamp. */
  startedAt: string;
};

/**
 * Aggregate loop telemetry derived from a set of {@link Run}s. Named distinctly
 * from the chat-oriented {@link LoopStats} above: this measures the agentic
 * loop (turns-to-green / pass / flake), not chat-tool run health.
 */
export type LoopTelemetry = {
  /** Number of runs the aggregate was computed over. */
  totalRuns: number;
  /** Mean `turnsToGreen` across runs that reached green; `null` when none did. */
  avgTurnsToGreen: number | null;
  /** Fraction of runs with status `green`, in [0, 1]. */
  passRate: number;
  /** Fraction of runs with status `flake`, in [0, 1]. */
  flakeRate: number;
};

/** The full shape of a fixture / API payload backing the entity data layer. */
export type DashboardPayload = {
  generatedAt: string;
  sessions: Session[];
  specs: Spec[];
  runs: Run[];
};

/**
 * A resolved source of dashboard entity data. `kind` records provenance so
 * callers (and tests) can assert which backend answered without inspecting
 * URLs.
 */
export type DataSource = {
  kind: 'fixtures' | 'api';
  load: () => Promise<DashboardPayload>;
};

/** Options for {@link resolveSource}, defaulting to `process.env`. */
export type ResolveSourceOptions = {
  apiUrl?: string | undefined;
  apiToken?: string | undefined;
  /** Injected fetch, primarily for tests. Defaults to global `fetch`. */
  fetchImpl?: typeof fetch | undefined;
};

/** Absolute path to the bundled demo fixture JSON. */
export const DEMO_FIXTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'demo.json',
);

/** The bundled demo data, frozen so callers cannot mutate the shared fixture. */
export const DEMO_DATA: DashboardPayload = Object.freeze(
  JSON.parse(readFileSync(DEMO_FIXTURE_PATH, 'utf8')) as DashboardPayload,
);

/**
 * Source that serves the bundled demo fixtures. Zero backend required — this
 * is what the standalone OSS dashboard uses by default.
 */
export function fixturesSource(
  data: DashboardPayload = DEMO_DATA,
): DataSource {
  return {
    kind: 'fixtures',
    load: async () => data,
  };
}

/**
 * Source that fetches `${apiUrl}/dashboard` from the SaaS API. The optional
 * bearer `token` is sent as an `Authorization` header.
 */
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

/**
 * Resolve the active data source. Returns an {@link apiSource} when an API URL
 * is configured (explicit option or `CUIT_API_URL`), otherwise the local
 * {@link fixturesSource}.
 */
export function resolveSource(opts: ResolveSourceOptions = {}): DataSource {
  const apiUrl = opts.apiUrl ?? process.env.CUIT_API_URL;
  const apiToken = opts.apiToken ?? process.env.CUIT_API_TOKEN;
  if (apiUrl && apiUrl.length > 0) {
    return apiSource(apiUrl, apiToken, opts.fetchImpl ?? fetch);
  }
  return fixturesSource();
}

/** All sessions, newest first by `recordedAt`. */
export async function listSessions(source: DataSource): Promise<Session[]> {
  const { sessions } = await source.load();
  return [...sessions].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

/** A single session by id, or `null` when not found. */
export async function getSession(
  source: DataSource,
  id: string,
): Promise<Session | null> {
  const { sessions } = await source.load();
  return sessions.find((s) => s.id === id) ?? null;
}

/** A single spec by id, or `null` when not found. */
export async function getSpec(
  source: DataSource,
  id: string,
): Promise<Spec | null> {
  const { specs } = await source.load();
  return specs.find((s) => s.id === id) ?? null;
}

/**
 * All specs, newest first by `generatedAt`. When `sessionId` is supplied, only
 * specs derived from that session are returned.
 */
export async function listSpecs(
  source: DataSource,
  sessionId?: string,
): Promise<Spec[]> {
  const { specs } = await source.load();
  const filtered =
    sessionId === undefined
      ? specs
      : specs.filter((s) => s.sessionId === sessionId);
  return [...filtered].sort((a, b) =>
    b.generatedAt.localeCompare(a.generatedAt),
  );
}

/**
 * All runs, newest first by `startedAt`. When `specId` is supplied, only runs
 * of that spec are returned. When `flow` is supplied, only runs of that flow
 * are returned. Both filters may be combined.
 */
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

/**
 * Aggregate loop telemetry over the given runs.
 *
 * - `avgTurnsToGreen` averages only runs that actually reached green (a
 *   non-null `turnsToGreen`); `null` when no run reached green.
 * - `passRate` and `flakeRate` are fractions of *all* runs in [0, 1].
 * - An empty input yields `{ totalRuns: 0, avgTurnsToGreen: null, passRate: 0,
 *   flakeRate: 0 }`.
 */
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
