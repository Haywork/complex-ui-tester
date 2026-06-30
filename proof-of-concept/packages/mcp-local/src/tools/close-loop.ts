import { ok, wrap, type AxEnvelope } from '../envelope.js';
import {
  generateSpecTool,
  resolveSessionEvents,
  type CuitSession,
  type RawCuitSession,
  type RawJamSession,
} from './generate-spec.js';
import { runSpecTool, type SnapshotProvider, type StateMismatch } from './run-spec.js';

export type CloseLoopStep = 'normalize' | 'generate' | 'run' | 'report';

export type CloseLoopData = {
  steps: CloseLoopStep[];
  specGenerated: boolean;
  passed: boolean;
  normalizedEventCount: number;
  mismatches: StateMismatch[];
};

export type CloseLoopInput = {
  session: RawJamSession | RawCuitSession | CuitSession;
  snapshotProvider?: SnapshotProvider;
};

/**
 * Run the full normalize → generate → run → report pipeline locally.
 *
 * - Zero network I/O — the snapshot oracle is either the injected provider
 *   or the spec's own expectedFinalState replay.
 * - outcome:'ok' is returned for both GREEN (passed=true) and RED (passed=false).
 *   Reproducing a RED is a valid loop outcome (bug-reproduction flow).
 * - outcome:'error' is reserved for tool-level failures (e.g. spec-gen throws).
 */
export async function closeLoopTool(
  input: CloseLoopInput,
): Promise<AxEnvelope<CloseLoopData>> {
  return wrap(async () => {
    const steps: CloseLoopStep[] = [];

    steps.push('normalize');
    const { session, snapshotProvider } = input;
    const normalized = await resolveSessionEvents({ session });

    steps.push('generate');
    const genResult = await generateSpecTool({ session });

    if (genResult.outcome === 'error') {
      return {
        outcome: 'error' as const,
        summary: `close_loop failed at generate step: ${genResult.summary}`,
        data: null,
        next_actions: [
          'Check that the session contains at least one interaction (pointer-down) and state snapshots.',
          ...genResult.next_actions,
        ],
      };
    }

    const spec = genResult.data!.spec;

    steps.push('run');

    let resolvedProvider: SnapshotProvider;
    if (snapshotProvider !== undefined) {
      resolvedProvider = snapshotProvider;
    } else {
      const expectedSnapshot: Record<string, unknown> = {};
      for (const { path, value } of spec.expectedFinalState) {
        expectedSnapshot[path] = value;
      }
      resolvedProvider = () => ({ ...expectedSnapshot });
    }

    const runResult = await runSpecTool({ spec, snapshotProvider: resolvedProvider });

    if (runResult.outcome === 'error') {
      return {
        outcome: 'error' as const,
        summary: `close_loop failed at run step: ${runResult.summary}`,
        data: null,
        next_actions: runResult.next_actions,
      };
    }

    steps.push('report');

    const { passed, mismatches } = runResult.data!;

    const summaryText = passed
      ? `close_loop GREEN — spec "${spec.testName}" passed.`
      : `close_loop RED — spec "${spec.testName}" has ${mismatches.length} mismatch(es).`;

    const next_actions: string[] = passed
      ? [
          'Commit the GREEN spec as a regression gate.',
          'Add to CI with: pnpm -F @haywork/cuit-mcp-local test',
        ]
      : [
          'Inspect data.mismatches for field-level detail.',
          'Fix the app logic or update the session recording to reflect the new expected behavior.',
          'Re-run cuit__close_loop once the fix is applied.',
        ];

    return ok(
      summaryText,
      {
        steps,
        specGenerated: true,
        passed,
        normalizedEventCount: normalized.length,
        mismatches,
      },
      next_actions,
    );
  });
}
