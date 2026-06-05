import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROOF_ROOT = path.resolve(__dirname, '../../..');
const OUT_DIR = path.join(PROOF_ROOT, 'out');
const LOG_PATH = path.join(PROOF_ROOT, 'agent-loop-output.log');
const RECORDED_PATH = path.join(OUT_DIR, 'recorded-session.json');

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
        x: styleLeft, y: 8, left: styleLeft, top: 8,
        right: styleLeft + width, bottom: 56, width, height: 48,
        toJSON: () => ({}),
      }) as DOMRect;
  });
}

type ReactAct = { act: (cb: () => void | Promise<void>) => Promise<void> };

async function main(): Promise<void> {
  const startedAt = performance.now();
  installJsdom();
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  const [
    { App },
    React,
    ReactDOM,
    harness,
    { Recorder, cuitDebugProvider },
    { generateSpec, serializeSpec },
  ] = await Promise.all([
    import('@cuit/demo-app'),
    import('react'),
    import('react-dom/client'),
    import('@cuit/harness'),
    import('@cuit/recorder'),
    import('@cuit/spec-gen'),
  ]);
  const reactAct = React as unknown as ReactAct;
  const { dispatchDrag, registerStateSnapshot, getStateSnapshot, setClock } = harness;

  const win = globalThis as unknown as { window: Window & { __cuitDebug?: CuitDebug } };
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('jsdom root not found');

  const lines: string[] = [];
  const emit = (s: string): void => { lines.push(s); process.stdout.write(`${s}\n`); };

  // --------------- 1. CAPTURE ---------------
  emit('[step 1/5] Capture — recorder runs while a developer reproduces the bug');
  let reactRoot = ReactDOM.createRoot(rootEl);
  await reactAct.act(async () => {
    reactRoot.render(React.createElement(App as React.FC<{ fixSegmentCollision?: boolean }>, { fixSegmentCollision: false }));
  });
  stubLayout(rootEl);

  registerStateSnapshot(() => {
    const dbg = win.window.__cuitDebug;
    if (!dbg) throw new Error('demo-app not mounted: window.__cuitDebug missing');
    return flatten(dbg.getState());
  });

  const recorder = new Recorder({
    sessionId: 'rec-agent-001',
    vendor: 'cuit',
    snapshotProvider: cuitDebugProvider,
  });
  recorder.start();

  await reactAct.act(async () => {
    setClock(1_716_800_000_000);
    dispatchDrag('seg-0', 100, 0);
  });
  await reactAct.act(async () => { await Promise.resolve(); });
  recorder.stop();

  const recorded = recorder.export();
  const pointerCount = recorded.events.filter((e) => e.type === 'pointer').length;
  const snapCount = recorded.events.filter((e) => e.type === 'state-snapshot').length;
  emit(`              -> recorder captured ${recorded.events.length} events (${pointerCount} pointer, ${snapCount} snapshot)`);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(RECORDED_PATH, JSON.stringify(recorded, null, 2), 'utf-8');
  emit(`              -> wrote ${path.relative(PROOF_ROOT, RECORDED_PATH)}`);

  // --------------- 2. GENERATE ---------------
  emit('[step 2/5] Generate — spec-gen produces a deterministic Playwright/Vitest spec');
  const spec = generateSpec(recorded.events);
  const serialized = serializeSpec(spec);
  const specPath = path.join(OUT_DIR, 'agent-loop.spec.ts');
  await writeFile(specPath, serialized, 'utf-8');
  emit(`              -> ${spec.primitives.length} primitives: ${spec.primitives.map(p => p.kind).join(' -> ')}`);
  emit(`              -> wrote ${path.relative(PROOF_ROOT, specPath)} (${serialized.split('\n').length} lines)`);

  // --------------- 3. VERIFY RED ---------------
  emit('[step 3/5] Verify - run the spec against the buggy app');
  await reactAct.act(async () => { reactRoot.unmount(); });
  delete win.window.__cuitDebug;

  reactRoot = ReactDOM.createRoot(rootEl);
  await reactAct.act(async () => {
    reactRoot.render(React.createElement(App as React.FC<{ fixSegmentCollision?: boolean }>, { fixSegmentCollision: false }));
  });
  stubLayout(rootEl);

  await reactAct.act(async () => {
    setClock(spec.primitives.find(p => p.kind === 'setClock')!.kind === 'setClock' ? (spec.primitives.find(p => p.kind === 'setClock') as Extract<typeof spec.primitives[number], { kind: 'setClock' }>).t : 0);
    const drag = spec.primitives.find(p => p.kind === 'dispatchDrag') as Extract<typeof spec.primitives[number], { kind: 'dispatchDrag' }>;
    dispatchDrag(drag.targetName, drag.dx, drag.dy);
  });
  await reactAct.act(async () => { await Promise.resolve(); });

  const bugSnapshot = getStateSnapshot();
  const expected = spec.expectedFinalState[0];
  const bugActual = bugSnapshot[expected!.path];
  const bugIsRed = bugActual !== expected!.value;
  emit(`              -> ${expected!.path}: expected=${expected!.value}, actual=${bugActual}`);
  emit(`              -> ${bugIsRed ? 'RED [bug reproduced - this is the success state]' : 'GREEN (unexpected - bug not present)'}`);

  if (!bugIsRed) {
    process.exitCode = 1;
    throw new Error('expected RED on bug-mode but got GREEN — agent loop pre-condition failed');
  }

  // --------------- 4. AGENT DECISION ---------------
  emit('[step 4/5] Decide - agent reads RED output, identifies the fix');
  emit('              [agent] observation: segments[0].x stayed at ' + bugActual + ' (expected ' + expected!.value + ')');
  emit('              [agent] hypothesis : the collision short-circuit in onPointerMove blocked the move');
  emit('              [agent] action     : enable FIX_SEGMENT_COLLISION=1 (in the SaaS this is a code-change PR; in the PoC it is a flag)');

  // --------------- 5. VERIFY GREEN ---------------
  emit('[step 5/5] Verify GREEN - re-run the same spec against the fixed app');
  await reactAct.act(async () => { reactRoot.unmount(); });
  delete win.window.__cuitDebug;

  reactRoot = ReactDOM.createRoot(rootEl);
  await reactAct.act(async () => {
    reactRoot.render(React.createElement(App as React.FC<{ fixSegmentCollision?: boolean }>, { fixSegmentCollision: true }));
  });
  stubLayout(rootEl);

  await reactAct.act(async () => {
    setClock((spec.primitives.find(p => p.kind === 'setClock') as Extract<typeof spec.primitives[number], { kind: 'setClock' }>).t);
    const drag = spec.primitives.find(p => p.kind === 'dispatchDrag') as Extract<typeof spec.primitives[number], { kind: 'dispatchDrag' }>;
    dispatchDrag(drag.targetName, drag.dx, drag.dy);
  });
  await reactAct.act(async () => { await Promise.resolve(); });

  const fixedSnapshot = getStateSnapshot();
  const fixedActual = fixedSnapshot[expected!.path];
  const fixedIsGreen = fixedActual === expected!.value;
  emit(`              -> ${expected!.path}: expected=${expected!.value}, actual=${fixedActual}`);
  emit(`              -> ${fixedIsGreen ? 'GREEN [fix verified - regression locked in]' : 'STILL RED (agent fix did not resolve)'}`);

  const durationS = ((performance.now() - startedAt) / 1000).toFixed(2);
  emit('');
  if (fixedIsGreen) {
    emit(`AGENT LOOP CLOSED - capture -> generate -> RED -> agent-fix -> GREEN in ${durationS}s`);
  } else {
    emit('AGENT LOOP FAILED - fix did not take');
    process.exitCode = 1;
  }

  await writeFile(LOG_PATH, lines.join('\n') + '\n', 'utf-8');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
