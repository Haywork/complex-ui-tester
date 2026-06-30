import type { GeneratedSpec, StateSnapshotEvent } from '@haywork/cuit-types';
import { ok, wrap, type AxEnvelope } from '../envelope.js';

export type StateSnapshot = Record<string, unknown>;

export type SnapshotProvider = () => StateSnapshot;

export type StateMismatch = {
  path: string;
  expected: unknown;
  actual: unknown;
};

export type RunSpecData = {
  passed: boolean;
  mismatches: StateMismatch[];
  finalSnapshot: StateSnapshot;
};

export type RunSpecInput = {
  spec: GeneratedSpec;
  /** Recorded state-snapshot events for the replay-oracle (default path). */
  sessionStateSnapshots?: StateSnapshotEvent[];
  /** Override the snapshot source entirely for tests. */
  snapshotProvider?: SnapshotProvider;
};

/**
 * Build a replay-oracle snapshotProvider from recorded state-snapshot events.
 * Multiple snapshots for the same path: last one wins (Datomic-style append log).
 * This is the zero-network oracle for OSS use — no external calls are made.
 */
function buildReplayOracle(snapshots: StateSnapshotEvent[]): SnapshotProvider {
  const map: StateSnapshot = {};
  for (const snap of snapshots) {
    map[snap.path] = snap.value;
  }
  return () => ({ ...map });
}

/**
 * Execute a generated spec's expectedFinalState assertions against an injected
 * (or replay-based) snapshotProvider.
 *
 * - outcome:'ok' is returned for both GREEN (passed=true) and RED (passed=false).
 * - outcome:'error' is reserved for execution faults (provider throws, etc.).
 * - A spec with empty expectedFinalState passes vacuously (zero mismatches).
 */
export async function runSpecTool(
  input: RunSpecInput,
): Promise<AxEnvelope<RunSpecData>> {
  return wrap(() => {
    const { spec, sessionStateSnapshots, snapshotProvider } = input;

    // Resolve the snapshot source:
    // 1. Explicit injected provider wins (used in tests + close_loop).
    // 2. sessionStateSnapshots builds a replay oracle.
    // 3. Empty fallback — every expectedFinalState path becomes a mismatch.
    let resolvedProvider: SnapshotProvider;
    if (snapshotProvider !== undefined) {
      resolvedProvider = snapshotProvider;
    } else if (sessionStateSnapshots !== undefined && sessionStateSnapshots.length > 0) {
      resolvedProvider = buildReplayOracle(sessionStateSnapshots);
    } else {
      // No provider and no snapshot events — return empty snapshot.
      resolvedProvider = () => ({});
    }

    const finalSnapshot = resolvedProvider();
    const mismatches: StateMismatch[] = [];

    for (const { path, value: expectedValue } of spec.expectedFinalState) {
      const actualValue = finalSnapshot[path];
      if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
        mismatches.push({ path, expected: expectedValue, actual: actualValue });
      }
    }

    const passed = mismatches.length === 0;
    const summary = passed
      ? `Spec PASSED — all ${spec.expectedFinalState.length} assertion(s) satisfied.`
      : `Spec FAILED — ${mismatches.length} mismatch(es): ${mismatches.map((m) => m.path).join(', ')}`;

    const next_actions = passed
      ? [
          'Commit the generated spec as a GREEN regression gate.',
          'Run in CI to protect against future regressions.',
        ]
      : [
          'Inspect the mismatch detail in data.mismatches.',
          'Fix the interaction or adjust the snapshot, then re-run cuit__run_spec.',
        ];

    return ok(summary, { passed, mismatches, finalSnapshot }, next_actions);
  });
}
