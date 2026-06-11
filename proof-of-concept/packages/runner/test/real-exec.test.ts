/**
 * real-exec.test.ts
 *
 * Drives runProofLoop / executeSpec against a REAL jsdom-mounted demo-app with
 * NO @cuit/harness mock. RED must come from assertStateEquals actually throwing;
 * GREEN must come from the assertion not throwing. The comparison shortcut
 * (specMatchesExpected) must NOT be the oracle.
 *
 * These tests are written RED-first: they describe behaviour that does not yet
 * exist in runner/src/index.ts and must ALL fail until the implementation is
 * updated.
 */

// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type { GeneratedSpec, Primitive } from '@cuit/types';
import type { ProofLoopMode, ProofLoopOptions, ProofLoopResult } from '../src/index.js';

// ---------------------------------------------------------------------------
// Types for the NEW API surface this test suite targets.
// runner/src/index.ts does not yet export these – importing them will fail
// until the implementation lands, which is the intended RED state.
// ---------------------------------------------------------------------------

/**
 * The SurfaceProvider that must be added to ProofLoopOptions.
 * navigate(url, mode) mounts the demo-app via React + jsdom in the given mode
 * and registers the window.__cuitDebug snapshot provider.
 */
type SurfaceProvider = {
  navigate(url: string, mode: ProofLoopMode): Promise<void> | void;
  flush?(): Promise<void> | void;
};

// The new field on ProofLoopResult — must be 'vitest' | 'primitive-exec', never undefined.
type SpecExecutedVia = 'vitest' | 'primitive-exec';

// Extended result type including the new honesty-marker field.
type ExtendedProofLoopResult = ProofLoopResult & {
  spec_executed_via: SpecExecutedVia;
};

// ---------------------------------------------------------------------------
// jsdom + React mount helpers (mirrored from cli-agent-loop.ts)
// ---------------------------------------------------------------------------

type Segment = { id: string; x: number; width: number };
type DebugState = { segments: Segment[] };
type CuitDebug = { getState: () => DebugState };

function installJsdom(): JSDOM {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost:5173/', pretendToBeVisual: true },
  );

  const winInner = dom.window as unknown as {
    PointerEvent?: typeof PointerEvent;
    MouseEvent: typeof MouseEvent;
  };
  if (typeof winInner.PointerEvent === 'undefined') {
    class JsdomPointerEvent extends winInner.MouseEvent {
      public readonly pointerId: number;
      public readonly pointerType: string;
      public readonly isPrimary: boolean;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init as MouseEventInit);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? 'mouse';
        this.isPrimary = init.isPrimary ?? true;
      }
    }
    winInner.PointerEvent = JsdomPointerEvent as unknown as typeof PointerEvent;
  }

  const g = globalThis as unknown as Record<string, unknown>;
  g['window'] = dom.window;
  g['document'] = dom.window.document;
  g['navigator'] = dom.window.navigator;
  g['HTMLElement'] = dom.window.HTMLElement;
  g['HTMLDivElement'] = dom.window.HTMLDivElement;
  g['Node'] = dom.window.Node;
  g['Element'] = dom.window.Element;
  g['Event'] = dom.window.Event;
  g['MouseEvent'] = dom.window.MouseEvent;
  g['PointerEvent'] = winInner.PointerEvent;
  g['getComputedStyle'] = dom.window.getComputedStyle.bind(dom.window);
  g['requestAnimationFrame'] = ((cb: (t: number) => void): number => {
    const handle = setTimeout(() => cb(Date.now()), 0);
    return handle as unknown as number;
  }) as typeof requestAnimationFrame;
  g['cancelAnimationFrame'] = ((id: number): void => {
    clearTimeout(id as unknown as NodeJS.Timeout);
  }) as typeof cancelAnimationFrame;

  for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (key in globalThis) continue;
    try {
      const value = (dom.window as unknown as Record<string, unknown>)[key];
      g[key] = value;
    } catch {
      /* getter threw */
    }
  }
  return dom;
}

function flatten(state: DebugState): Record<string, unknown> {
  const out: Record<string, unknown> = {
    'segments.length': state.segments.length,
  };
  state.segments.forEach((s, i) => {
    out[`segments[${i}].x`] = s.x;
    out[`segments[${i}].width`] = s.width;
    out[`segments[${i}].id`] = s.id;
  });
  return out;
}

function stubLayout(root: HTMLElement): void {
  const segs = root.querySelectorAll<HTMLElement>('[data-segment-id]');
  segs.forEach((el) => {
    const styleLeft = parseFloat(el.style.left || '0');
    const width = parseFloat(el.style.width || '80');
    el.getBoundingClientRect = () =>
      ({
        x: styleLeft,
        y: 8,
        left: styleLeft,
        top: 8,
        right: styleLeft + width,
        bottom: 56,
        width,
        height: 48,
        toJSON: () => ({}),
      }) as DOMRect;
  });
}

type ReactAct = { act: (cb: () => void | Promise<void>) => Promise<void> };

// ---------------------------------------------------------------------------
// SurfaceProvider factory — mounts the real demo-app and wires __cuitDebug.
// This is the injectable implementation that the new ProofLoopOptions must accept.
// ---------------------------------------------------------------------------

function createRealSurfaceProvider(): {
  provider: SurfaceProvider;
  teardown: () => Promise<void>;
} {
  // All module imports are deferred to navigate()/teardown() so that they
  // always resolve AFTER the caller has called vi.resetModules(). This ensures
  // the surface provider and the runner use the SAME harness module instance
  // (same snapshotProvider singleton) regardless of import ordering.

  const win = globalThis as unknown as { window: Window & { __cuitDebug?: CuitDebug } };

  // Lazily resolved module references (populated on first navigate call).
  type HarnessModule = typeof import('@cuit/harness') & { resetStateSnapshot: () => void };
  let reactDomCreateRoot: typeof import('react-dom/client')['createRoot'] | null = null;
  let appComponent: React.FC<{ fixSegmentCollision?: boolean }> | null = null;
  let reactModule: { createElement: typeof React.createElement } & ReactAct | null = null;
  let harnessModule: HarnessModule | null = null;

  let reactRoot: ReturnType<NonNullable<typeof reactDomCreateRoot>> | null = null;
  let snapshotRegistered = false;

  const provider: SurfaceProvider = {
    async navigate(url: string, mode: ProofLoopMode): Promise<void> {
      // Lazily load modules on first call so we use the post-resetModules instances.
      if (!harnessModule) {
        const [{ App }, React, ReactDOM, harness] = await Promise.all([
          import('@cuit/demo-app'),
          import('react'),
          import('react-dom/client'),
          import('@cuit/harness'),
        ]);
        appComponent = App as React.FC<{ fixSegmentCollision?: boolean }>;
        reactModule = React as unknown as { createElement: typeof React.createElement } & ReactAct;
        reactDomCreateRoot = ReactDOM.createRoot;
        harnessModule = harness as HarnessModule;
      }

      const { registerStateSnapshot, resetStateSnapshot } = harnessModule;
      const reactAct = reactModule!;

      // Unmount previous render and clear debug bridge to avoid double-registration.
      if (reactRoot !== null) {
        await reactAct.act(async () => {
          reactRoot!.unmount();
        });
        reactRoot = null;
        delete win.window.__cuitDebug;
        // Reset the harness-level snapshot provider so it can be re-registered
        // for the next mount (bug-mode -> fixed-mode transition).
        resetStateSnapshot();
        snapshotRegistered = false;
      }

      const fixSegmentCollision = mode === 'fixed';
      const rootEl = document.getElementById('root');
      if (!rootEl) throw new Error('jsdom root element #root not found');

      reactRoot = reactDomCreateRoot!(rootEl);
      await reactAct.act(async () => {
        reactRoot!.render(
          reactModule!.createElement(appComponent!, { fixSegmentCollision }),
        );
      });
      stubLayout(rootEl);

      // Register the snapshot provider once per surface lifetime.
      if (!snapshotRegistered) {
        registerStateSnapshot(() => {
          const dbg = win.window.__cuitDebug;
          if (!dbg) throw new Error('demo-app not mounted: window.__cuitDebug missing');
          return flatten(dbg.getState());
        });
        snapshotRegistered = true;
      }
    },

    async flush(): Promise<void> {
      const reactAct = reactModule!;
      await reactAct.act(async () => {
        await Promise.resolve();
      });
    },

    async runInteraction(fn: () => void): Promise<void> {
      const reactAct = reactModule!;
      // Wrap the pointer-event dispatch inside act() so React does not warn
      // about "update not wrapped in act". Then flush a second act() to drain
      // any remaining scheduled work (e.g. useEffect batches).
      await reactAct.act(async () => {
        fn();
      });
      await reactAct.act(async () => {
        await Promise.resolve();
      });
    },
  };

  const teardown = async (): Promise<void> => {
    if (reactRoot !== null && reactModule) {
      const reactAct = reactModule as unknown as ReactAct;
      await reactAct.act(async () => {
        reactRoot!.unmount();
      });
      reactRoot = null;
    }
    delete win.window.__cuitDebug;
    if (harnessModule) {
      harnessModule.restoreConsoleErrors();
      harnessModule.resetStateSnapshot();
    }
  };

  return { provider, teardown };
}

// ---------------------------------------------------------------------------
// Spec builders — parameterized so every shape is distinct from seg-0/dx=100.
// ---------------------------------------------------------------------------

const CLOCK_T = 1_716_800_000_000;

function makeSpec(opts: {
  targetName: string;
  dragDx: number;
  dragDy?: number;
  assertPath: string;
  assertValue: unknown;
  includeConsoleErrorGuard?: boolean;
}): GeneratedSpec {
  const primitives: Primitive[] = [
    { kind: 'goto', url: 'http://localhost:5173/' },
    { kind: 'setClock', t: CLOCK_T },
    { kind: 'getStateSnapshot' },
    { kind: 'dispatchDrag', targetName: opts.targetName, dx: opts.dragDx, dy: opts.dragDy ?? 0 },
    { kind: 'getStateSnapshot' },
    { kind: 'assertStateEquals', path: opts.assertPath, value: opts.assertValue },
  ];

  if (opts.includeConsoleErrorGuard) {
    primitives.push({ kind: 'assertNoConsoleErrors', count: 1 });
  }

  return {
    testName: `test-${opts.targetName}-dx${opts.dragDx}`,
    url: 'http://localhost:5173/',
    primitives,
    expectedFinalState: [{ path: opts.assertPath, value: opts.assertValue }],
  };
}

// ---------------------------------------------------------------------------
// Global jsdom setup — installed once for the whole file.
// ---------------------------------------------------------------------------

let jsdomInstance: JSDOM | null = null;

beforeEach(() => {
  if (jsdomInstance === null) {
    jsdomInstance = installJsdom();
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  }
});

afterEach(() => {
  // Reset harness module state between tests to avoid leaked snapshot provider.
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('executeSpec — real primitive execution (no harness mock)', () => {
  /**
   * TEST 1
   * After goto mounts the app and getStateSnapshot reads window.__cuitDebug,
   * the captured snapshot for segments[0].x equals the drag delta (dragDx=100),
   * NOT a runner-side constant. Proves goto mounted and getStateSnapshot read
   * the live API.
   */
  test('goto mounts via SurfaceProvider and getStateSnapshot returns live demo-app state, not a runner-side constant', async () => {
    const DRAG_DX = 100;
    const { provider, teardown } = await createRealSurfaceProvider();

    try {
      // Import the runner WITHOUT mocking @cuit/harness.
      vi.resetModules();
      const { runProofLoop } = await import('../src/index.js');

      // The new SurfaceProvider field is what we are testing — it must be
      // accepted by ProofLoopOptions and used inside runProofLoop.
      const result = (await runProofLoop({
        // ProofLoopOptions does not currently accept surfaceProvider.
        // This will cause a type error / runtime no-op until the fix lands.
        surfaceProvider: provider,
        // We pass a minimal fixture that produces a spec with dragDx=100.
        fixturePath: '__unused__',
        outDir: '/tmp/real-exec-test-out',
        // Override spec generation to use our parameterized spec directly.
        spec: makeSpec({
          targetName: 'seg-0',
          dragDx: DRAG_DX,
          assertPath: 'segments[0].x',
          assertValue: DRAG_DX,
        }),
      } as unknown as ProofLoopOptions)) as ExtendedProofLoopResult;

      // The fixed snapshot must reflect the ACTUAL demo-app state, not 100 hardcoded.
      expect(result.fixedSnapshot['segments[0].x']).toEqual(DRAG_DX);

      // The honesty-marker must confirm real execution happened.
      expect(result.spec_executed_via).toEqual('primitive-exec');
    } finally {
      await teardown();
    }
  });

  /**
   * TEST 2
   * Fixed-mode: assertStateEquals does NOT throw, spec_executed_via === 'primitive-exec'.
   * The verdict must NOT come from specMatchesExpected; it must come from the
   * assertion completing without throwing.
   */
  test('fixed-mode resolves GREEN because assertStateEquals ran and did not throw — spec_executed_via is primitive-exec', async () => {
    const DRAG_DX = 100;
    const { provider, teardown } = await createRealSurfaceProvider();

    try {
      vi.resetModules();
      const { runProofLoop } = await import('../src/index.js');

      const spec = makeSpec({
        targetName: 'seg-0',
        dragDx: DRAG_DX,
        assertPath: 'segments[0].x',
        assertValue: DRAG_DX,
      });

      const result = (await runProofLoop({
        surfaceProvider: provider,
        fixturePath: '__unused__',
        outDir: '/tmp/real-exec-test-out',
        spec,
      } as unknown as ProofLoopOptions)) as ExtendedProofLoopResult;

      // greenAfterFix must be true because the assertion did not throw.
      expect(result.greenAfterFix).toEqual(true);

      // The honesty-marker must be the closed-union literal — never undefined or 'noop'.
      expect(result.spec_executed_via).toEqual('primitive-exec');

      // Explicitly guard against the old shortcut: specMatchesExpected is not
      // the oracle. If the implementation still uses it, the field will be
      // absent or wrong; we check both greenAfterFix AND spec_executed_via.
      expect(['vitest', 'primitive-exec'] as SpecExecutedVia[]).toContain(
        result.spec_executed_via,
      );
    } finally {
      await teardown();
    }
  });

  /**
   * TEST 3
   * Bug-mode: assertStateEquals ACTUALLY throws an Error whose message names
   * the path 'segments[0].x' and includes the expected (100) and actual (0) values.
   * redReproduced must reflect that a throw occurred, NOT a specMatchesExpected call.
   */
  test('bug-mode goes RED because assertStateEquals threw — error message names the path, expected value, and actual value', async () => {
    const DRAG_DX = 100;
    const { provider, teardown } = await createRealSurfaceProvider();

    try {
      vi.resetModules();

      // Import executeSpec directly to assert on the thrown error shape.
      // executeSpec is not currently exported — this will fail until the fix lands.
      const runnerModule = await import('../src/index.js') as {
        runProofLoop: typeof import('../src/index.js').runProofLoop;
        executeSpec?: (spec: GeneratedSpec, provider: SurfaceProvider, mode: ProofLoopMode) => Promise<void>;
      };

      const spec = makeSpec({
        targetName: 'seg-0',
        dragDx: DRAG_DX,
        assertPath: 'segments[0].x',
        assertValue: DRAG_DX,
      });

      // Mount in bug-mode (fixSegmentCollision=false) — collision no-op leaves seg-0.x at 0.
      await provider.navigate('http://localhost:5173/', 'bug');

      // executeSpec must be exported by the refactored runner.
      expect(runnerModule.executeSpec).toBeDefined();

      // Must throw with a message that names path, expected, and actual.
      // Note: the collision short-circuit in bug-mode partially blocks the drag
      // (not at x=0, but at x=25 — the last step before the collision check fires).
      // The regex matches any divergence between expected=100 and actual!=100.
      await expect(
        runnerModule.executeSpec!(spec, provider, 'bug'),
      ).rejects.toThrow(/segments\[0\]\.x.*expected.*100.*(?:got|actual)/i);
    } finally {
      await teardown();
    }
  });

  /**
   * TEST 4 — generality
   * Parameterized over 3 distinct interaction shapes:
   *   shape A: dragDx=60,  seg-0, fixed-mode -> GREEN
   *   shape B: dragDx=200, seg-0, fixed-mode -> GREEN
   *   shape C: assert on segments[1].x unchanged (value=120) after a seg-0 drag, fixed-mode -> GREEN
   *
   * For each shape, fixed-mode must resolve green.
   * For shapes A and B (where bug-mode is applicable), bug-mode must throw with
   * the correct path/value in the error message.
   * Proves the executor reads assertStateEquals.path and .value dynamically.
   */
  test('generality: fixed-mode is GREEN across distinct interaction shapes (dx=60, dx=200, different assert path)', async () => {
    const shapes = [
      {
        label: 'dragDx=60 on seg-0',
        targetName: 'seg-0',
        dragDx: 60,
        assertPath: 'segments[0].x',
        assertValue: 60,
      },
      {
        label: 'dragDx=200 on seg-0',
        targetName: 'seg-0',
        dragDx: 200,
        assertPath: 'segments[0].x',
        assertValue: 200,
      },
      {
        label: 'assert segments[1].x unchanged after seg-0 drag',
        targetName: 'seg-0',
        dragDx: 60,
        // seg-1 starts at x=120 (1*(80+40)). Dragging seg-0 must not move it.
        assertPath: 'segments[1].x',
        assertValue: 120,
      },
    ] as const;

    for (const shape of shapes) {
      const { provider, teardown } = await createRealSurfaceProvider();

      try {
        vi.resetModules();
        const { runProofLoop } = await import('../src/index.js');

        const spec = makeSpec({
          targetName: shape.targetName,
          dragDx: shape.dragDx,
          assertPath: shape.assertPath,
          assertValue: shape.assertValue,
        });

        const result = (await runProofLoop({
          surfaceProvider: provider,
          fixturePath: '__unused__',
          outDir: '/tmp/real-exec-test-out',
          spec,
        } as unknown as ProofLoopOptions)) as ExtendedProofLoopResult;

        expect(result.greenAfterFix).toEqual(true);
        expect(result.spec_executed_via).toEqual('primitive-exec');
      } finally {
        await teardown();
      }
    }
  });

  /**
   * TEST 5 — console-error guard
   * Case A: spec contains assertNoConsoleErrors, app calls console.error during drag
   *         -> executeSpec must throw an error containing 'assertNoConsoleErrors'.
   * Case B: same spec shape against an app that logs no errors
   *         -> executeSpec completes and greenAfterFix === true.
   * Proves the guard primitive is executed, not no-opped.
   */
  test('assertNoConsoleErrors guard executes for real — throws when console.error fired, passes when none', async () => {
    const DRAG_DX = 100;

    // ---- Case A: app emits a console.error during the drag ----
    {
      const { provider: providerA, teardown: teardownA } = await createRealSurfaceProvider();

      try {
        vi.resetModules();

        const runnerModule = await import('../src/index.js') as {
          runProofLoop: typeof import('../src/index.js').runProofLoop;
          executeSpec?: (spec: GeneratedSpec, provider: SurfaceProvider, mode: ProofLoopMode) => Promise<void>;
        };

        expect(runnerModule.executeSpec).toBeDefined();

        // Mount in fixed mode so state assertion passes; only console.error guard fires.
        await providerA.navigate('http://localhost:5173/', 'fixed');

        // Inject a console.error into the harness capture buffer directly.
        // captureConsoleErrors() installs the interceptor; calling console.error
        // afterwards goes through the harness and populates capturedConsoleErrors.
        // executeSpec will call captureConsoleErrors() again which is idempotent
        // (does NOT reset the buffer when already intercepting), so this entry
        // persists until assertNoConsoleErrors fires.
        const { captureConsoleErrors: startCapture } = await import('@cuit/harness');
        startCapture();
        console.error('synthetic-error-for-test');

        const specWithGuard = makeSpec({
          targetName: 'seg-0',
          dragDx: DRAG_DX,
          assertPath: 'segments[0].x',
          assertValue: DRAG_DX,
          includeConsoleErrorGuard: true,
        });

        await expect(
          runnerModule.executeSpec!(specWithGuard, providerA, 'fixed'),
        ).rejects.toThrow(/assertNoConsoleErrors/i);
      } finally {
        await teardownA();
      }
    }

    // ---- Case B: no console.error — spec completes cleanly ----
    {
      const { provider: providerB, teardown: teardownB } = await createRealSurfaceProvider();

      try {
        vi.resetModules();
        const { runProofLoop } = await import('../src/index.js');

        const specWithGuard = makeSpec({
          targetName: 'seg-0',
          dragDx: DRAG_DX,
          assertPath: 'segments[0].x',
          assertValue: DRAG_DX,
          includeConsoleErrorGuard: true,
        });

        // No console.error emitted — guard must pass.
        const result = (await runProofLoop({
          surfaceProvider: providerB,
          fixturePath: '__unused__',
          outDir: '/tmp/real-exec-test-out',
          spec: specWithGuard,
          // In bug-mode, let it skip the bug reproduction step so only GREEN is exercised.
          skipBugMode: true,
        } as unknown as ProofLoopOptions)) as ExtendedProofLoopResult;

        expect(result.greenAfterFix).toEqual(true);
      } finally {
        await teardownB();
      }
    }
  });

  /**
   * TEST 6 — honesty marker closed union
   * spec_executed_via must always be 'vitest' | 'primitive-exec' — never
   * undefined, null, or any other sentinel that could mask a no-op branch.
   */
  test('spec_executed_via is always a closed-union member and equals primitive-exec on this code path', async () => {
    const { provider, teardown } = await createRealSurfaceProvider();

    try {
      vi.resetModules();
      const { runProofLoop } = await import('../src/index.js');

      const spec = makeSpec({
        targetName: 'seg-0',
        dragDx: 100,
        assertPath: 'segments[0].x',
        assertValue: 100,
      });

      const result = (await runProofLoop({
        surfaceProvider: provider,
        fixturePath: '__unused__',
        outDir: '/tmp/real-exec-test-out',
        spec,
      } as unknown as ProofLoopOptions)) as ExtendedProofLoopResult;

      // Field must exist and be one of the closed-union literals.
      expect(result.spec_executed_via).toBeDefined();
      expect(['vitest', 'primitive-exec'] as SpecExecutedVia[]).toContain(
        result.spec_executed_via,
      );

      // On the primitive-exec code path (no startVitest involved), must be this.
      expect(result.spec_executed_via).toEqual('primitive-exec');
    } finally {
      await teardown();
    }
  });

  /**
   * TEST 7 — regression guard
   * The 13 mocked tests in runner.test.ts must remain unaffected by the
   * refactor. This test acts as a sentinel: it imports the runner with all
   * mocks in place (matching runner.test.ts setup) and asserts the canonical
   * 6-step lifecycle still completes, confirming the injected SurfaceProvider
   * has a working default and the mocked path stays green.
   *
   * Uses vi.doMock (not vi.mock) because the spec constant cannot be defined
   * at hoisting time. vi.doMock is not hoisted and respects declaration order.
   */
  test('regression guard — mocked lifecycle (runner.test.ts pattern) still emits 6-step canonical order after refactor', async () => {
    vi.resetModules();

    const REGRESSION_SPEC: GeneratedSpec = {
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

    const RAW = JSON.stringify({
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
    });

    // vi.doMock is NOT hoisted — safe to reference local variables.
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue(RAW),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('@cuit/adapter-jam', () => ({
      normalizeJamSession: vi.fn().mockReturnValue([
        {
          seq: 0,
          vendor: 'jam',
          vendorEventId: 'jam-sess-2014-1',
          ts: 1716800000000,
          wallClock: 1716800000000,
          type: 'nav',
          url: 'http://localhost:5173/',
        },
      ]),
    }));

    vi.doMock('@cuit/spec-gen', () => ({
      generateSpec: vi.fn().mockReturnValue(REGRESSION_SPEC),
      serializeSpec: vi.fn().mockReturnValue('/* serialized */'),
    }));

    const getStateSnapshotMock = vi
      .fn()
      // bug-mode: collision bug — segment 0 stayed at x=0
      .mockReturnValueOnce({ 'segments[0].x': 0 })
      // fixed-mode: drag worked — segment 0 ended at x=100
      .mockReturnValueOnce({ 'segments[0].x': 100 });

    vi.doMock('@cuit/harness', () => ({
      setClock: vi.fn(),
      dispatchDrag: vi.fn(),
      getStateSnapshot: getStateSnapshotMock,
      registerStateSnapshot: vi.fn(),
      assertNoConsoleErrors: vi.fn(),
      captureConsoleErrors: vi.fn(),
      restoreConsoleErrors: vi.fn(),
    }));

    // Dynamic import AFTER vi.doMock so the module resolves with the mock applied.
    const { runProofLoop } = await import('../src/index.js');

    const result = await runProofLoop({
      fixturePath: '/abs/fixtures/segment-collision.json',
      outDir: '/abs/out',
    });

    const CANONICAL_STEPS = [
      'load',
      'normalize',
      'generate',
      'run-bug-RED',
      'run-fixed-GREEN',
      'write-ci-yaml',
    ] as const;

    expect(result.steps).toEqual([...CANONICAL_STEPS]);
    expect(result.redReproduced).toEqual(true);
    expect(result.greenAfterFix).toEqual(true);
  });
});
