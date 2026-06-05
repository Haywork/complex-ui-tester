import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeJamSession, type RawJamSession } from '@cuit/adapter-jam';
import { dispatchDrag, getStateSnapshot, setClock } from '@cuit/harness';
import { generateSpec, serializeSpec } from '@cuit/spec-gen';
import type { GeneratedSpec, Primitive } from '@cuit/types';

export type ProofLoopStep =
  | 'load'
  | 'normalize'
  | 'generate'
  | 'run-bug-RED'
  | 'run-fixed-GREEN'
  | 'write-ci-yaml';

export type ProofLoopMode = 'bug' | 'fixed';

export type ProofLoopOptions = {
  fixturePath: string;
  outDir: string;
  prepareRun?: (mode: ProofLoopMode) => Promise<void> | void;
  finalizeRun?: (mode: ProofLoopMode) => Promise<void> | void;
  /**
   * Optional wrapper around spec execution. Useful for callers that need to
   * flush asynchronous side-effects (e.g. React batched updates) before the
   * snapshot is read. Defaults to running the spec synchronously.
   */
  runSpec?: (mode: ProofLoopMode, exec: () => Record<string, unknown>) =>
    | Record<string, unknown>
    | Promise<Record<string, unknown>>;
  ciYamlPath?: string;
};

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
};

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

function executeSpec(spec: GeneratedSpec): Record<string, unknown> {
  for (const primitive of spec.primitives) {
    runPrimitive(primitive);
  }
  return getStateSnapshot();
}

function runPrimitive(primitive: Primitive): void {
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

export async function runProofLoop(options: ProofLoopOptions): Promise<ProofLoopResult> {
  const start = Date.now();
  const steps: ProofLoopStep[] = [];

  steps.push('load');
  const raw = await readFile(options.fixturePath, 'utf-8');
  const parsed = JSON.parse(raw as unknown as string) as RawJamSession;

  steps.push('normalize');
  const normalized = normalizeJamSession(parsed);

  steps.push('generate');
  const spec = generateSpec(normalized);
  const serialized = serializeSpec(spec);

  await mkdir(options.outDir, { recursive: true });
  const slug = slugify(spec.testName);
  const specFileName = `${slug}.spec.ts`;
  const specPath = path.join(options.outDir, specFileName);
  await writeFile(specPath, serialized, 'utf-8');

  steps.push('run-bug-RED');
  if (options.prepareRun) await options.prepareRun('bug');
  const bugSnapshot = options.runSpec
    ? await options.runSpec('bug', () => executeSpec(spec))
    : executeSpec(spec);
  if (options.finalizeRun) await options.finalizeRun('bug');
  const redReproduced = !specMatchesExpected(bugSnapshot, spec.expectedFinalState);
  if (!redReproduced) {
    throw new Error(
      `bug not reproduced in bug-mode: red expected but spec passed (snapshot=${JSON.stringify(
        bugSnapshot,
      )})`,
    );
  }

  steps.push('run-fixed-GREEN');
  if (options.prepareRun) await options.prepareRun('fixed');
  const fixedSnapshot = options.runSpec
    ? await options.runSpec('fixed', () => executeSpec(spec))
    : executeSpec(spec);
  if (options.finalizeRun) await options.finalizeRun('fixed');
  const greenAfterFix = specMatchesExpected(fixedSnapshot, spec.expectedFinalState);
  if (!greenAfterFix) {
    throw new Error(
      `fix not verified in fixed-mode: green expected but spec failed (snapshot=${JSON.stringify(
        fixedSnapshot,
      )})`,
    );
  }

  steps.push('write-ci-yaml');
  const ciYamlPath =
    options.ciYamlPath ?? path.join(options.outDir, `${slug}.yml`);
  await mkdir(path.dirname(ciYamlPath), { recursive: true });
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
    normalizedEventCount: normalized.length,
  };
}
