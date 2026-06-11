import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeJamSession, type RawJamSession } from '@cuit/adapter-jam';
import { normalizeCuitSession, type RawCuitSession } from '@cuit/adapter-cuit';
import {
  assertNoConsoleErrors,
  captureConsoleErrors,
  dispatchDrag,
  getStateSnapshot,
  setClock,
} from '@cuit/harness';
import { generateSpec, serializeSpec } from '@cuit/spec-gen';
import type { GeneratedSpec, Primitive, SessionEvent } from '@cuit/types';

export type ProofLoopStep =
  | 'load'
  | 'normalize'
  | 'generate'
  | 'run-bug-RED'
  | 'run-fixed-GREEN'
  | 'write-ci-yaml';

export type ProofLoopMode = 'bug' | 'fixed';

/**
 * Optional surface provider injected by callers that need real DOM mounting.
 * navigate(url, mode) mounts the demo-app for the given mode and registers
 * the window.__cuitDebug snapshot provider.
 * flush() drains React batched updates after a dispatchDrag.
 * runInteraction(fn) wraps fn in act() so pointer events do not trigger
 * "update not wrapped in act" React warnings.
 * When absent, goto is a no-op and execution relies on whatever the caller
 * has already mounted (used by the mocked test suite).
 */
export type SurfaceProvider = {
  navigate(url: string, mode: ProofLoopMode): Promise<void> | void;
  flush?(): Promise<void> | void;
  /**
   * Optional wrapper that runs fn inside the test framework async boundary
   * (e.g. React.act()) so that pointer events dispatched inside fn are not
   * flagged as update not wrapped in act. When absent fn is called directly
   * and a flush is performed afterward.
   */
  runInteraction?(fn: () => void): Promise<void>;
};

export type ProofLoopOptions = {
  fixturePath: string;
  outDir: string;
  prepareRun?: (mode: ProofLoopMode) => Promise<void> | void;
  finalizeRun?: (mode: ProofLoopMode) => Promise<void> | void;
  runSpec?: (mode: ProofLoopMode, exec: () => Record<string, unknown>) =>
    | Record<string, unknown>
    | Promise<Record<string, unknown>>;
  ciYamlPath?: string;
  surfaceProvider?: SurfaceProvider;
  spec?: GeneratedSpec;
  skipBugMode?: boolean;
};

export type SpecExecutedVia = 'vitest' | 'primitive-exec';

export type ProofLoopResult = {
  steps: ProofLoopStep[];
  redReproduced: boolean;
  greenAfterFix: boolean;
  durationMs: number;
  specPath: string;
  ciYamlPath: string;
  spec: GeneratedSpec;
  bugSnapshot: Record<string, unknown>;
  fixedSnapshot: Record<string, unknown>;
  normalizedEventCount: number;
  spec_executed_via: SpecExecutedVia;
};

type RawSession = RawJamSession | RawCuitSession;

function selectAdapter(vendor: string): (raw: RawSession) => SessionEvent[] {
  if (vendor === 'jam') {
    return (raw) => normalizeJamSession(raw as RawJamSession);
  }
  if (vendor === 'cuit') {
    return (raw) => normalizeCuitSession(raw as RawCuitSession);
  }
  throw new Error(
    `No adapter registered for unknown vendor: "${vendor}". Supported vendors: jam, cuit.`,
  );
}

export async function executeSpec(
  spec: GeneratedSpec,
  provider: SurfaceProvider | undefined,
  mode: ProofLoopMode,
): Promise<void> {
  captureConsoleErrors();

  for (const primitive of spec.primitives) {
    await runPrimitive(primitive, provider, mode);
  }
}

async function runPrimitive(
  primitive: Primitive,
  provider: SurfaceProvider | undefined,
  mode: ProofLoopMode,
): Promise<void> {
  switch (primitive.kind) {
    case 'goto': {
      if (provider) {
        await provider.navigate(primitive.url, mode);
      }
      return;
    }

    case 'setClock': {
      setClock(primitive.t);
      return;
    }

    case 'dispatchDrag': {
      if (provider?.runInteraction) {
        await provider.runInteraction(() => {
          dispatchDrag(primitive.targetName, primitive.dx, primitive.dy);
        });
      } else {
        dispatchDrag(primitive.targetName, primitive.dx, primitive.dy);
        if (provider?.flush) {
          await provider.flush();
        }
      }
      return;
    }

    case 'getStateSnapshot': {
      getStateSnapshot();
      return;
    }

    case 'assertStateEquals': {
      const currentSnap = getStateSnapshot();
      if (currentSnap[primitive.path] !== primitive.value) {
        throw new Error(
          `assertStateEquals failed at ${primitive.path}: expected ${String(primitive.value)}, got ${String(currentSnap[primitive.path])}`,
        );
      }
      return;
    }

    case 'assertNoConsoleErrors': {
      assertNoConsoleErrors();
      return;
    }

    case 'dispatchClick':
    case 'dispatchType':
      return;
  }
}

function buildCiYaml(spec: GeneratedSpec, specFileName: string): string {
  return `name: ${spec.testName}
on:
  push:
  pull_request:
jobs:
  cuit-proof-loop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm vitest run ${specFileName}
`;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'spec';
}

function executeSpecLegacy(spec: GeneratedSpec): Record<string, unknown> {
  for (const primitive of spec.primitives) {
    runPrimitiveLegacy(primitive);
  }
  return getStateSnapshot();
}

function runPrimitiveLegacy(primitive: Primitive): void {
  switch (primitive.kind) {
    case 'setClock':
      setClock(primitive.t);
      return;
    case 'dispatchDrag':
      dispatchDrag(primitive.targetName, primitive.dx, primitive.dy);
      return;
    case 'goto':
    case 'getStateSnapshot':
    case 'assertStateEquals':
    case 'assertNoConsoleErrors':
    case 'dispatchClick':
    case 'dispatchType':
      return;
  }
}

function specMatchesExpected(
  snapshot: Record<string, unknown>,
  expected: GeneratedSpec['expectedFinalState'],
): boolean {
  for (const { path: key, value } of expected) {
    if (snapshot[key] !== value) {
      return false;
    }
  }
  return true;
}

export async function runProofLoop(options: ProofLoopOptions): Promise<ProofLoopResult> {
  const start = Date.now();
  const steps: ProofLoopStep[] = [];

  const { surfaceProvider, skipBugMode } = options;
  const usePrimitiveExec = surfaceProvider !== undefined;

  let spec: GeneratedSpec;
  let normalizedEventCount = 0;
  let specPath = '';
  let specSlug = '';

  if (options.spec) {
    spec = options.spec;
    specSlug = slugify(spec.testName);
    steps.push('load');
    steps.push('normalize');
    steps.push('generate');

    await mkdir(options.outDir, { recursive: true });
    const specFileName = `${specSlug}.spec.ts`;
    specPath = path.join(options.outDir, specFileName);
    await writeFile(specPath, serializeSpec(spec), 'utf-8');
  } else {
    steps.push('load');
    const raw = await readFile(options.fixturePath, 'utf-8');
    const parsed = JSON.parse(raw as unknown as string) as RawSession;

    steps.push('normalize');
    const vendor = (parsed as Record<string, unknown>)['vendor'];
    const normalize = selectAdapter(typeof vendor === 'string' ? vendor : '');
    const normalized = normalize(parsed);
    normalizedEventCount = normalized.length;

    steps.push('generate');
    spec = generateSpec(normalized);
    const serialized = serializeSpec(spec);

    await mkdir(options.outDir, { recursive: true });
    specSlug = slugify(spec.testName);
    const specFileName = `${specSlug}.spec.ts`;
    specPath = path.join(options.outDir, specFileName);
    await writeFile(specPath, serialized, 'utf-8');
  }

  let bugSnapshot: Record<string, unknown> = {};
  let redReproduced = false;

  if (!skipBugMode) {
    steps.push('run-bug-RED');

    if (usePrimitiveExec) {
      if (options.prepareRun) await options.prepareRun('bug');
      let threw = false;
      try {
        await executeSpec(spec, surfaceProvider, 'bug');
      } catch (_err) {
        threw = true;
      }
      try {
        bugSnapshot = getStateSnapshot();
      } catch {
        bugSnapshot = {};
      }
      if (options.finalizeRun) await options.finalizeRun('bug');
      redReproduced = threw;
    } else {
      if (options.prepareRun) await options.prepareRun('bug');
      bugSnapshot = options.runSpec
        ? await options.runSpec('bug', () => executeSpecLegacy(spec))
        : executeSpecLegacy(spec);
      if (options.finalizeRun) await options.finalizeRun('bug');

      redReproduced = !specMatchesExpected(bugSnapshot, spec.expectedFinalState);
      if (!redReproduced) {
        throw new Error(
          `bug not reproduced in bug-mode: red expected but spec passed (snapshot=${JSON.stringify(bugSnapshot)})`,
        );
      }
    }
  }

  let fixedSnapshot: Record<string, unknown> = {};
  let greenAfterFix = false;

  steps.push('run-fixed-GREEN');

  if (usePrimitiveExec) {
    if (options.prepareRun) await options.prepareRun('fixed');
    try {
      await executeSpec(spec, surfaceProvider, 'fixed');
      greenAfterFix = true;
    } catch (err) {
      greenAfterFix = false;
      try {
        fixedSnapshot = getStateSnapshot();
      } catch {
        fixedSnapshot = {};
      }
      if (options.finalizeRun) await options.finalizeRun('fixed');
      throw new Error(
        `fix not verified in fixed-mode: green expected but spec failed (${String(err)}) (snapshot=${JSON.stringify(fixedSnapshot)})`,
      );
    }
    try {
      fixedSnapshot = getStateSnapshot();
    } catch {
      fixedSnapshot = {};
    }
    if (options.finalizeRun) await options.finalizeRun('fixed');
  } else {
    if (options.prepareRun) await options.prepareRun('fixed');
    fixedSnapshot = options.runSpec
      ? await options.runSpec('fixed', () => executeSpecLegacy(spec))
      : executeSpecLegacy(spec);
    if (options.finalizeRun) await options.finalizeRun('fixed');

    greenAfterFix = specMatchesExpected(fixedSnapshot, spec.expectedFinalState);
    if (!greenAfterFix) {
      throw new Error(
        `fix not verified in fixed-mode: green expected but spec failed (snapshot=${JSON.stringify(fixedSnapshot)})`,
      );
    }
  }

  steps.push('write-ci-yaml');
  const ciYamlPath =
    options.ciYamlPath ?? path.join(options.outDir, `${specSlug}.yml`);
  await mkdir(path.dirname(ciYamlPath), { recursive: true });
  const specFileName = path.basename(specPath);
  await writeFile(ciYamlPath, buildCiYaml(spec, specFileName), 'utf-8');

  const durationMs = Date.now() - start;

  return {
    steps,
    redReproduced,
    greenAfterFix,
    durationMs,
    specPath,
    ciYamlPath,
    spec,
    bugSnapshot,
    fixedSnapshot,
    normalizedEventCount,
    spec_executed_via: 'primitive-exec',
  };
}

export {
  minimalDiff,
  stepState,
  listPrimitives,
  replayPlan,
} from './ax-debug.js';
export type {
  MinimalDiffResult,
  RedResult,
  StepStateDelta,
  StepStateResult,
  PrimitiveEntry,
  ReplayPlan,
} from './ax-debug.js';
