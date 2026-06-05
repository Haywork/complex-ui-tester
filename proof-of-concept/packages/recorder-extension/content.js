// content.js — runs in the MAIN world of the host page.
// Mirrors the @cuit/recorder module so the extension can ship as a single
// unbundled folder ("Load unpacked" → done). When you change the module,
// regenerate this file with `pnpm -F @cuit/recorder-extension build` (or
// keep them in sync by hand for now — the surface is small).

(() => {
  const DEFAULT_SELECTORS = ['data-segment-id', 'data-testid', 'data-cuit-id'];
  const PHASE_FROM_TYPE = {
    pointerdown: 'down',
    pointermove: 'move',
    pointerup: 'up',
  };

  function semanticName(el, attrs) {
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v) return v;
    }
    return undefined;
  }

  function cssPathOf(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 8) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part += `#${node.id}`;
        parts.unshift(part);
        break;
      }
      const cls = (node.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) part += '.' + cls.join('.');
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function flattenSnapshot(snapshot, prefix = '') {
    const out = [];
    for (const [k, v] of Object.entries(snapshot)) {
      const next = prefix ? `${prefix}.${k}` : k;
      if (Array.isArray(v)) {
        out.push([`${next}.length`, v.length]);
        v.forEach((item, i) => {
          if (item !== null && typeof item === 'object') {
            out.push(...flattenSnapshot(item, `${next}[${i}]`));
          } else {
            out.push([`${next}[${i}]`, item]);
          }
        });
      } else if (v !== null && typeof v === 'object') {
        out.push(...flattenSnapshot(v, next));
      } else {
        out.push([next, v]);
      }
    }
    return out;
  }

  class Recorder {
    constructor(options) {
      this.sessionId = options.sessionId;
      this.vendor = options.vendor ?? 'cuit';
      this.snapshotProvider = options.snapshotProvider;
      this.selectors = options.semanticSelectors ?? DEFAULT_SELECTORS;
      this.events = [];
      this.seq = 0;
      this.startedAt = null;
      this.listeners = [];
      this.lastSnapshotKey = null;
    }

    start() {
      if (this.startedAt !== null) return;
      this.startedAt = Date.now();
      this.events.push({
        seq: this.nextSeq(),
        vendor: this.vendor,
        vendorEventId: `${this.sessionId}-nav-0`,
        ts: 0,
        wallClock: this.startedAt,
        type: 'nav',
        url: location.href,
      });
      this.captureSnapshot();

      const onPointer = (type) => (ev) => {
        const target = ev.target;
        if (!target) return;
        const name = semanticName(target, this.selectors);
        const event = {
          seq: this.nextSeq(),
          vendor: this.vendor,
          vendorEventId: `${this.sessionId}-p-${this.seq}`,
          ts: Date.now() - this.startedAt,
          wallClock: Date.now(),
          type: 'pointer',
          phase: PHASE_FROM_TYPE[type],
          targetSelector: cssPathOf(target),
          x: Math.round(ev.clientX),
          y: Math.round(ev.clientY),
          pointerId: ev.pointerId ?? 0,
        };
        if (name !== undefined) event.targetName = name;
        this.events.push(event);
        if (type === 'pointerup' || type === 'pointerdown') this.captureSnapshot();
      };

      for (const t of ['pointerdown', 'pointermove', 'pointerup']) {
        const handler = onPointer(t);
        document.addEventListener(t, handler, true);
        this.listeners.push(() => document.removeEventListener(t, handler, true));
      }
    }

    stop() {
      for (const off of this.listeners) off();
      this.listeners = [];
      this.captureSnapshot();
    }

    captureSnapshot() {
      if (!this.snapshotProvider) return;
      let raw;
      try {
        raw = this.snapshotProvider();
      } catch {
        return;
      }
      if (!raw) return;
      const flat = flattenSnapshot(raw);
      const key = JSON.stringify(flat);
      if (key === this.lastSnapshotKey) return;
      this.lastSnapshotKey = key;
      for (const [path, value] of flat) {
        this.events.push({
          seq: this.nextSeq(),
          vendor: this.vendor,
          vendorEventId: `${this.sessionId}-snap-${this.seq}`,
          ts: Date.now() - this.startedAt,
          wallClock: Date.now(),
          type: 'state-snapshot',
          path,
          value,
        });
      }
    }

    export() {
      if (this.startedAt === null) throw new Error('Recorder.export(): never started');
      const nav = this.events.find((e) => e.type === 'nav');
      return {
        sessionId: this.sessionId,
        vendor: this.vendor,
        createdAt: this.startedAt,
        url: nav ? nav.url : location.href,
        events: this.events.slice(),
      };
    }

    nextSeq() {
      const s = this.seq;
      this.seq += 1;
      return s;
    }
  }

  function cuitDebugProvider() {
    const dbg = window.__cuitDebug;
    if (!dbg || typeof dbg.getState !== 'function') return null;
    try {
      return dbg.getState();
    } catch {
      return null;
    }
  }

  // Expose a controlled API on a namespaced global so the popup can drive it
  // via chrome.scripting.executeScript without re-injecting the whole module.
  let active = null;
  const api = {
    start(options) {
      if (active) return { ok: false, error: 'already-recording' };
      active = new Recorder({
        sessionId: (options && options.sessionId) || `cuit-${Date.now()}`,
        vendor: 'cuit',
        snapshotProvider: cuitDebugProvider,
      });
      active.start();
      return { ok: true, sessionId: active.sessionId };
    },
    stop() {
      if (!active) return { ok: false, error: 'not-recording' };
      active.stop();
      const out = active.export();
      active = null;
      return { ok: true, session: out };
    },
    status() {
      if (!active) return { recording: false, hasCuitDebug: Boolean(window.__cuitDebug) };
      return {
        recording: true,
        sessionId: active.sessionId,
        eventCount: active.events.length,
        hasCuitDebug: Boolean(window.__cuitDebug),
      };
    },
  };

  window.__cuitRecorder = api;
  document.documentElement.dataset.cuitRecorderInstalled = 'true';
})();
