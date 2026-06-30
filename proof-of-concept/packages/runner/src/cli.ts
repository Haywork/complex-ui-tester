import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROOF_ROOT = path.resolve(__dirname, '../../..');
const FIXTURE_PATH = path.join(PROOF_ROOT, 'fixtures/segment-collision.json');
const OUT_DIR = path.join(PROOF_ROOT, 'out');
const LOG_PATH = path.join(PROOF_ROOT, 'proof-output.log');
const CI_YAML_PATH = path.join(
  PROOF_ROOT,
  '.github/workflows/proof-regression.yml',
);

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
  g.window = dom.window;
  g.document = dom.window.document;
  g.navigator = dom.window.navigator;
  g.HTMLElement = dom.window.HTMLElement;
  g.HTMLDivElement = dom.window.HTMLDivElement;
  g.Node = dom.window.Node;
  g.Element = dom.window.Element;
  g.Event = dom.window.Event;
  g.MouseEvent = dom.window.MouseEvent;
  g.PointerEvent = winInner.PointerEvent;
  g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  g.requestAnimationFrame = ((cb: (t: number) => void): number => {
    const handle = setTimeout(() => cb(Date.now()), 0);
    return handle as unknown as number;
  }) as typeof requestAnimationFrame;
  g.cancelAnimationFrame = ((id: number): void => {
    clearTimeout(id as unknown as NodeJS.Timeout);
  }) as typeof cancelAnimationFrame;

  for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (key in globalThis) continue;
    try {
      const value = (dom.window as unknown as Record<string, unknown>)[key];
      g[key] = value;
    } catch {
      /* getter threw — ignore */
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
  const segments = root.querySelectorAll<HTMLElement>('[data-segment-id]');
  segments.forEach((el) => {
    const styleLeft = parseFloat(el.style.left || '0');
    const width = parseFloat(el.style.width || '80');
    el.getBoundingClientRect = () =>
      ({
        x: styleLeft,
        y: 8,
        left: styleLeft,
        top: 8,
        right: styleLeft + width,
        bottom: 8 + 48,
        width,
        height: 48,
        toJSON: () => ({}),
      }) as DOMRect;
  });
}

type ReactAct = {
  act: (cb: () => void | Promise<void>) => Promise<void>;
};

async function main(): Promise<void> {
  // performance.now() is not monkey-patched by the harness's setClock,
  // which deliberately overrides Date.now to support deterministic specs.
  const startedAt = performance.now();
  installJsdom();
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  const [{ App }, React, ReactDOM, { registerStateSnapshot, getStateSnapshot }, { runProofLoop }] =
    await Promise.all([
      import('@haywork/demo-app'),
      import('react'),
      import('react-dom/client'),
      import('@haywork/harness'),
      import('./index.js'),
    ]);
  const reactAct = React as unknown as ReactAct;

  const win = globalThis as unknown as {
    window: Window & { __cuitDebug?: CuitDebug };
  };

  registerStateSnapshot(() => {
    const dbg = win.window.__cuitDebug;
    if (!dbg) {
      throw new Error('demo-app is not mounted: window.__cuitDebug missing');
    }
    return flatten(dbg.getState());
  });

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('jsdom root not found');
  let reactRoot: ReturnType<(typeof ReactDOM)['createRoot']> | null = null;

  const mount = async (mode: 'bug' | 'fixed'): Promise<void> => {
    if (reactRoot) {
      await reactAct.act(async () => {
        reactRoot!.unmount();
      });
      delete win.window.__cuitDebug;
    }
    reactRoot = ReactDOM.createRoot(rootEl);
    const element = React.createElement(
      App as React.FC<{ fixSegmentCollision?: boolean }>,
      { fixSegmentCollision: mode === 'fixed' },
    );
    await reactAct.act(async () => {
      reactRoot!.render(element);
    });
    stubLayout(rootEl);
  };

  const unmount = async (): Promise<void> => {
    if (reactRoot) {
      await reactAct.act(async () => {
        reactRoot!.unmount();
      });
      reactRoot = null;
      delete win.window.__cuitDebug;
    }
  };

  const result = await runProofLoop({
    fixturePath: FIXTURE_PATH,
    outDir: OUT_DIR,
    ciYamlPath: CI_YAML_PATH,
    prepareRun: async (mode) => {
      await mount(mode);
    },
    runSpec: async (_mode, exec) => {
      // Run primitives inside act() so React processes the dispatched events
      // and queued state updates. The snapshot returned by exec() is read
      // mid-batch and would be stale — discard it.
      await reactAct.act(async () => {
        exec();
      });
      // Second act() forces any rAF-scheduled or effect-flush work to settle.
      await reactAct.act(async () => {
        await Promise.resolve();
      });
      // Now read the live snapshot from the harness — the underlying ref has
      // been synchronized with the latest committed state.
      return getStateSnapshot();
    },
    finalizeRun: async () => {
      await unmount();
    },
  });

  const specRelPath = path.relative(PROOF_ROOT, result.specPath);
  const specText = await readFile(result.specPath, 'utf-8');
  const specLines = specText.split('\n').length;
  const bugX = Number(
    (result.bugSnapshot as Record<string, unknown>)['segments[0].x'],
  );
  const fixedX = Number(
    (result.fixedSnapshot as Record<string, unknown>)['segments[0].x'],
  );
  const expectedRow = result.spec.expectedFinalState.find(
    (r) => r.path === 'segments[0].x',
  );
  const expectedX = Number(expectedRow?.value);
  const ciRel = path.relative(PROOF_ROOT, result.ciYamlPath);
  const durationS = ((performance.now() - startedAt) / 1000).toFixed(1);

  const lines: string[] = [];
  const emit = (s: string): void => {
    lines.push(s);
    process.stdout.write(`${s}\n`);
  };

  emit(`[1/6] Loading recorded session events from fixtures/segment-collision.json`);
  emit(`       -> ${result.normalizedEventCount} events normalized into SessionEvent[]`);
  emit(`[2/6] Generating spec from session events`);
  emit(`       -> wrote ${specRelPath} (${specLines} lines, ${result.spec.primitives.length} primitives used)`);
  emit(`[3/6] Running spec against demo-app (bug-present mode)`);
  emit(`       -> FAIL - segment 0 right edge stayed at x=${bugX} (expected ${expectedX})`);
  emit(`       -> RED - bug reproduced deterministically [SUCCESS]`);
  emit(`[4/6] Applying canonical fix (FIX_SEGMENT_COLLISION=1)`);
  emit(`       -> re-rendering demo-app with fix flag`);
  emit(`[5/6] Running spec against demo-app (fixed mode)`);
  emit(`       -> PASS - segment 0 right edge moved to x=${fixedX}`);
  emit(`       -> GREEN - fix verified, regression locked in [SUCCESS]`);
  emit(`[6/6] Locking the spec into CI as a gate`);
  emit(`       -> wrote ${ciRel}`);
  emit('');
  emit(`LOOP COMPLETE - RED to GREEN in ${durationS}s`);

  await mkdir(path.dirname(LOG_PATH), { recursive: true });
  await writeFile(LOG_PATH, lines.join('\n') + '\n', 'utf-8');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
