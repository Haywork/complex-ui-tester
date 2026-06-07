import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mountTranslateUiReactBridge } from '../src/translate-ui-react-bridge';

interface WaveformDebugAPI {
  getState(): { activeSegmentIndex: number; playheadSeconds: number; scrollLeft: number; segments: Array<{ id: string; index: number; startTime: number; endTime: number; x: number; width: number; speaker: string }>; clockFrozen: boolean; clockMs: number };
  setClock(ms: number): void;
  tick(deltaMs: number): void;
  dispatchDrag(segmentIndex: number, dxPx: number): void;
  dispatchResize(segmentIndex: number, edge: 'left' | 'right', dxPx: number): void;
  seekTo(seconds: number): void;
}

function mountFakeWaveformDebug(): WaveformDebugAPI {
  let state = {
    activeSegmentIndex: 0,
    playheadSeconds: 0,
    scrollLeft: 0,
    segments: [
      { id: 'seg-0', index: 0, startTime: 0, endTime: 2, x: 0, width: 132, speaker: 'A' },
      { id: 'seg-1', index: 1, startTime: 4.32, endTime: 7.81, x: 288, width: 232, speaker: 'B' },
    ],
    clockFrozen: false,
    clockMs: 0,
  };
  const api: WaveformDebugAPI = {
    getState: () => JSON.parse(JSON.stringify(state)),
    setClock: (ms: number) => { state = { ...state, clockFrozen: true, clockMs: ms }; },
    tick: () => {},
    dispatchDrag: (segmentIndex: number, dxPx: number) => {
      const segs = state.segments.map((s, i) =>
        i === segmentIndex ? { ...s, x: s.x + dxPx, startTime: s.startTime + dxPx / 66.67 } : s,
      );
      state = { ...state, segments: segs };
    },
    dispatchResize: () => {},
    seekTo: (seconds: number) => { state = { ...state, playheadSeconds: seconds }; },
  };
  (window as unknown as { __waveformDebug: WaveformDebugAPI }).__waveformDebug = api;
  return api;
}

beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({ id: 'srv-uuid-001', tenant: 'speechlab', event_count: 99 }),
    text: async () => '',
  } as unknown as Response)) as unknown as typeof fetch;
});

afterEach(() => {
  delete (window as unknown as { __waveformDebug?: unknown }).__waveformDebug;
  vi.restoreAllMocks();
});

describe('translate-ui-react bridge', () => {
  test('mount returns a handle exposing size/peek/stop', () => {
    mountFakeWaveformDebug();
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'tur-test-001',
      pollMs: 10,
    });
    expect(typeof handle.stop).toBe('function');
    expect(typeof handle.size).toBe('function');
    expect(typeof handle.peek).toBe('function');
    expect(handle.size()).toBeGreaterThan(0);
  });

  test('wraps __waveformDebug.dispatchDrag to capture before/after state', async () => {
    const api = mountFakeWaveformDebug();
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'tur-test-002',
      pollMs: 50,
    });
    // Give the poll loop a tick to install the wrapper.
    await new Promise((r) => setTimeout(r, 80));
    api.dispatchDrag(1, 20);
    // Wait for the post-drag snapshot to land.
    await new Promise((r) => setTimeout(r, 80));
    const session = handle.peek();
    const seg1x = session.events
      .filter((e) => e.type === 'state-snapshot' && (e as { path: string }).path === 'segments[1].x')
      .map((e) => (e as { value: number }).value);
    expect(seg1x.length).toBeGreaterThanOrEqual(2);
    // Last snapshot must reflect the +20px drag.
    expect(seg1x[seg1x.length - 1]).toBeGreaterThan(seg1x[0]!);
    await handle.stop();
  });

  test('stop() POSTs the session to the API and returns the server id', async () => {
    mountFakeWaveformDebug();
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'tur-test-003',
      pollMs: 10,
      gitSha: 'abc1234',
      gitBranch: 'developNoWaveFormFinal',
    });
    await new Promise((r) => setTimeout(r, 30));
    const id = await handle.stop();
    expect(id).toBe('srv-uuid-001');
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://localhost:7710/v1/sessions');
    expect((init as { method: string }).method).toBe('POST');
    const body = JSON.parse((init as { body: string }).body);
    expect(body.sessionId).toBe('tur-test-003');
    expect(body.gitSha).toBe('abc1234');
    expect(body.gitBranch).toBe('developNoWaveFormFinal');
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThan(0);
    expect((init as { headers: Record<string, string> }).headers.authorization).toBe('Bearer dev-token-speechlab');
  });

  test('onError fires when the POST fails', async () => {
    mountFakeWaveformDebug();
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
      text: async () => 'boom',
      json: async () => ({}),
    } as unknown as Response));
    const onError = vi.fn();
    const handle = mountTranslateUiReactBridge({
      apiUrl: 'http://localhost:7710',
      tenantToken: 'dev-token-speechlab',
      sessionId: 'tur-test-004',
      pollMs: 10,
      onError,
    });
    await new Promise((r) => setTimeout(r, 30));
    const id = await handle.stop();
    expect(id).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].message).toContain('cuit-api POST /v1/sessions 500');
  });

  test('throws if running without window (SSR safety)', () => {
    const originalWindow = global.window;
    // @ts-expect-error simulate Node SSR
    delete global.window;
    expect(() =>
      mountTranslateUiReactBridge({
        apiUrl: 'http://localhost:7710',
        tenantToken: 'x',
        sessionId: 'tur-ssr',
      }),
    ).toThrow(/SSR context detected/);
    global.window = originalWindow;
  });
});
