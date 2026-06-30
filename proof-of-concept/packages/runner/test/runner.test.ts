import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { GeneratedSpec, SessionEvent } from '@haywork/types';

const FIXTURE_PATH = '/abs/fixtures/segment-collision.json';
const OUT_DIR = '/abs/out';

const RAW_SESSION = {
  sessionId: 'jam-sess-2014',
  vendor: 'jam',
  createdAt: '2026-05-20T14:13:00.000Z',
  url: 'http://localhost:5173/',
  events: [
    {
      seq: 0,
      vendor: 'jam',
      vendorEventId: 'jam-sess-2014-1',
      ts: 1716800000000,
      wallClock: 1716800000000,
      type: 'nav',
      url: 'http://localhost:5173/',
    },
  ],
};

const NORMALIZED_EVENTS: SessionEvent[] = [
  {
    seq: 0,
    vendor: 'jam',
    vendorEventId: 'jam-sess-2014-1',
    ts: 1716800000000,
    wallClock: 1716800000000,
    type: 'nav',
    url: 'http://localhost:5173/',
  },
];

const GENERATED_SPEC: GeneratedSpec = {
  testName: 'issue-2014 — segment 0 drag must not collide-noop',
  url: 'http://localhost:5173/',
  primitives: [
    { kind: 'goto', url: 'http://localhost:5173/' },
    { kind: 'setClock', t: 1716800000000 },
    { kind: 'dispatchDrag', targetName: 'seg-0', dx: 100, dy: 0 },
    { kind: 'assertStateEquals', path: 'segments[0].x', value: 100 },
  ],
  expectedFinalState: [{ path: 'segments[0].x', value: 100 }],
};

const SERIALIZED_SPEC = `import { describe, expect, test } from 'vitest';
import { dispatchDrag, getStateSnapshot, setClock } from '@haywork/harness';

describe('issue-2014 — segment 0 drag must not collide-noop', () => {
  test('drags segment 0 right by 100px and asserts state moves', () => {
    setClock(1716800000000);
    dispatchDrag('seg-0', 100, 0);
    const snapshot = getStateSnapshot();
    expect(snapshot['segments[0].x']).toEqual(100);
  });
});
`;

const fsMocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

const adapterMocks = vi.hoisted(() => ({
  normalizeJamSession: vi.fn(),
}));

const specGenMocks = vi.hoisted(() => ({
  generateSpec: vi.fn(),
  serializeSpec: vi.fn(),
}));

const harnessMocks = vi.hoisted(() => ({
  setClock: vi.fn(),
  dispatchDrag: vi.fn(),
  getStateSnapshot: vi.fn(),
  registerStateSnapshot: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: fsMocks.readFile,
  writeFile: fsMocks.writeFile,
  mkdir: fsMocks.mkdir,
  default: {
    readFile: fsMocks.readFile,
    writeFile: fsMocks.writeFile,
    mkdir: fsMocks.mkdir,
  },
}));

vi.mock('@haywork/adapter-jam', () => ({
  normalizeJamSession: adapterMocks.normalizeJamSession,
}));

vi.mock('@haywork/spec-gen', () => ({
  generateSpec: specGenMocks.generateSpec,
  serializeSpec: specGenMocks.serializeSpec,
}));

vi.mock('@haywork/harness', () => ({
  setClock: harnessMocks.setClock,
  dispatchDrag: harnessMocks.dispatchDrag,
  getStateSnapshot: harnessMocks.getStateSnapshot,
  registerStateSnapshot: harnessMocks.registerStateSnapshot,
}));

const CANONICAL_STEPS = [
  'load',
  'normalize',
  'generate',
  'run-bug-RED',
  'run-fixed-GREEN',
  'write-ci-yaml',
] as const;

beforeEach(() => {
  fsMocks.readFile.mockReset();
  fsMocks.writeFile.mockReset();
  fsMocks.mkdir.mockReset();
  adapterMocks.normalizeJamSession.mockReset();
  specGenMocks.generateSpec.mockReset();
  specGenMocks.serializeSpec.mockReset();
  harnessMocks.setClock.mockReset();
  harnessMocks.dispatchDrag.mockReset();
  harnessMocks.getStateSnapshot.mockReset();
  harnessMocks.registerStateSnapshot.mockReset();

  fsMocks.readFile.mockResolvedValue(JSON.stringify(RAW_SESSION));
  fsMocks.writeFile.mockResolvedValue(undefined);
  fsMocks.mkdir.mockResolvedValue(undefined);

  adapterMocks.normalizeJamSession.mockReturnValue(NORMALIZED_EVENTS);
  specGenMocks.generateSpec.mockReturnValue(GENERATED_SPEC);
  specGenMocks.serializeSpec.mockReturnValue(SERIALIZED_SPEC);

  // bug-mode: collision bug — segment 0 stayed at x=0
  // fixed-mode: drag worked — segment 0 ended at x=100
  harnessMocks.getStateSnapshot
    .mockReturnValueOnce({ 'segments[0].x': 0 })
    .mockReturnValueOnce({ 'segments[0].x': 100 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('runProofLoop', () => {
  test('emits the canonical 6-step lifecycle in order', async () => {
    const { runProofLoop } = await import('../src/index.js');

    const result = await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(result.steps).toEqual([...CANONICAL_STEPS]);
  });

  test('load step reads the fixture file from the provided path', async () => {
    const { runProofLoop } = await import('../src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(fsMocks.readFile).toHaveBeenCalledTimes(1);
    const firstCallArg = fsMocks.readFile.mock.calls[0]?.[0];
    expect(firstCallArg).toEqual(FIXTURE_PATH);
  });

  test('normalize step passes parsed JSON to the jam adapter', async () => {
    const { runProofLoop } = await import('../src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(adapterMocks.normalizeJamSession).toHaveBeenCalledTimes(1);
    expect(adapterMocks.normalizeJamSession).toHaveBeenCalledWith(RAW_SESSION);
  });

  test('generate step passes normalized events to the spec generator', async () => {
    const { runProofLoop } = await import('../src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(specGenMocks.generateSpec).toHaveBeenCalledTimes(1);
    expect(specGenMocks.generateSpec).toHaveBeenCalledWith(NORMALIZED_EVENTS);
    expect(specGenMocks.serializeSpec).toHaveBeenCalledWith(GENERATED_SPEC);
  });

  test('writes the generated spec file to outDir before running it', async () => {
    const { runProofLoop } = await import('../src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    const writeCalls = fsMocks.writeFile.mock.calls;
    const specWrite = writeCalls.find(([p]) => typeof p === 'string' && p.endsWith('.spec.ts'));
    expect(specWrite).toBeDefined();
    expect(specWrite?.[0]).toContain(OUT_DIR);
    expect(specWrite?.[1]).toEqual(SERIALIZED_SPEC);
  });

  test('bug-mode run reproduces the bug — redReproduced is true', async () => {
    const { runProofLoop } = await import('../src/index.js');

    const result = await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(result.redReproduced).toEqual(true);
  });

  test('fixed-mode run verifies the fix — greenAfterFix is true', async () => {
    const { runProofLoop } = await import('../src/index.js');

    const result = await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(result.greenAfterFix).toEqual(true);
  });

  test('runs the spec twice — once for bug-mode, once for fixed-mode', async () => {
    const { runProofLoop } = await import('../src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(harnessMocks.getStateSnapshot).toHaveBeenCalledTimes(2);
    expect(harnessMocks.dispatchDrag).toHaveBeenCalledTimes(2);
    expect(harnessMocks.dispatchDrag).toHaveBeenNthCalledWith(1, 'seg-0', 100, 0);
    expect(harnessMocks.dispatchDrag).toHaveBeenNthCalledWith(2, 'seg-0', 100, 0);
  });

  test('write-ci-yaml step writes a CI workflow file referencing the spec', async () => {
    const { runProofLoop } = await import('../src/index.js');

    await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    const writeCalls = fsMocks.writeFile.mock.calls;
    const yamlWrite = writeCalls.find(([p]) => typeof p === 'string' && p.endsWith('.yml'));
    expect(yamlWrite).toBeDefined();
    const yamlContents = yamlWrite?.[1];
    expect(typeof yamlContents).toEqual('string');
    expect(yamlContents as string).toContain('issue-2014');
  });

  test('returns a positive durationMs measured across the loop', async () => {
    const { runProofLoop } = await import('../src/index.js');

    const result = await runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR });

    expect(typeof result.durationMs).toEqual('number');
    expect(Number.isFinite(result.durationMs)).toEqual(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('throws a meaningful error when bug-mode unexpectedly passes', async () => {
    harnessMocks.getStateSnapshot.mockReset();
    // Both runs report fixed state — no bug reproduced.
    harnessMocks.getStateSnapshot
      .mockReturnValueOnce({ 'segments[0].x': 100 })
      .mockReturnValueOnce({ 'segments[0].x': 100 });

    const { runProofLoop } = await import('../src/index.js');

    await expect(
      runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR })
    ).rejects.toThrow(/bug.*not.*reproduced|red.*expected/i);
  });

  test('throws a meaningful error when fixed-mode fails to go green', async () => {
    harnessMocks.getStateSnapshot.mockReset();
    // Bug reproduces but fix also fails — no green.
    harnessMocks.getStateSnapshot
      .mockReturnValueOnce({ 'segments[0].x': 0 })
      .mockReturnValueOnce({ 'segments[0].x': 0 });

    const { runProofLoop } = await import('../src/index.js');

    await expect(
      runProofLoop({ fixturePath: FIXTURE_PATH, outDir: OUT_DIR })
    ).rejects.toThrow(/fix.*not.*verified|green.*expected/i);
  });

  test('propagates fs errors when the fixture file cannot be read', async () => {
    fsMocks.readFile.mockReset();
    fsMocks.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

    const { runProofLoop } = await import('../src/index.js');

    await expect(
      runProofLoop({ fixturePath: '/abs/missing.json', outDir: OUT_DIR })
    ).rejects.toThrow(/ENOENT/);
  });
});
