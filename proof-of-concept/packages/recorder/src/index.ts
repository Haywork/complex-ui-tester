import type {
  NavEvent,
  PointerEvent as CuitPointerEvent,
  SessionEvent,
  StateSnapshotEvent,
} from '@cuit/types';

export type RecorderOptions = {
  sessionId: string;
  vendor?: 'cuit' | 'jam' | 'logrocket' | 'sentry-replay' | 'fullstory' | 'datadog-rum';
  /** Probe `window.__cuitDebug.getState()` and flatten into state-snapshot events. */
  snapshotProvider?: () => Record<string, unknown> | null;
  /** Override the time source (mostly for tests). Returns ms-since-epoch. */
  now?: () => number;
  /** Override the document used for listener installation. */
  document?: Document;
  /** Selectors whose targets should be captured as `targetName`. */
  semanticSelectors?: string[];
};

export type RecordedSession = {
  sessionId: string;
  vendor: NonNullable<RecorderOptions['vendor']>;
  createdAt: number;
  url: string;
  events: SessionEvent[];
};

const DEFAULT_SELECTORS = ['data-segment-id', 'data-testid', 'data-cuit-id'];

const POINTER_TYPES = ['pointerdown', 'pointermove', 'pointerup'] as const;
type PointerType = (typeof POINTER_TYPES)[number];

const PHASE_FROM_TYPE: Record<PointerType, CuitPointerEvent['phase']> = {
  pointerdown: 'down',
  pointermove: 'move',
  pointerup: 'up',
};

function semanticName(el: Element, attrs: string[]): string | undefined {
  for (const a of attrs) {
    const v = el.getAttribute(a);
    if (v) return v;
  }
  return undefined;
}

function cssPathOf(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
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

function flattenSnapshot(snapshot: Record<string, unknown>, path = ''): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  for (const [k, v] of Object.entries(snapshot)) {
    const next = path ? `${path}.${k}` : k;
    if (Array.isArray(v)) {
      out.push([`${next}.length`, v.length]);
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          out.push(...flattenSnapshot(item as Record<string, unknown>, `${next}[${i}]`));
        } else {
          out.push([`${next}[${i}]`, item]);
        }
      });
    } else if (v !== null && typeof v === 'object') {
      out.push(...flattenSnapshot(v as Record<string, unknown>, next));
    } else {
      out.push([next, v]);
    }
  }
  return out;
}

export class Recorder {
  private readonly sessionId: string;
  private readonly vendor: RecordedSession['vendor'];
  private readonly snapshotProvider: RecorderOptions['snapshotProvider'];
  private readonly now: () => number;
  private readonly doc: Document;
  private readonly selectors: string[];
  private readonly events: SessionEvent[] = [];
  private seq = 0;
  private startedAt: number | null = null;
  private listeners: Array<() => void> = [];
  private lastSnapshotKey: string | null = null;

  constructor(options: RecorderOptions) {
    this.sessionId = options.sessionId;
    this.vendor = options.vendor ?? 'cuit';
    this.snapshotProvider = options.snapshotProvider;
    this.now = options.now ?? ((): number => Date.now());
    if (options.document) {
      this.doc = options.document;
    } else if (typeof document !== 'undefined') {
      this.doc = document;
    } else {
      throw new Error('Recorder: no document available; pass options.document');
    }
    this.selectors = options.semanticSelectors ?? DEFAULT_SELECTORS;
  }

  start(): void {
    if (this.startedAt !== null) return;
    this.startedAt = this.now();

    const baseUrl = typeof this.doc.defaultView !== 'undefined' && this.doc.defaultView
      ? this.doc.defaultView.location.href
      : '';

    const nav: NavEvent = {
      seq: this.nextSeq(),
      vendor: this.vendor,
      vendorEventId: `${this.sessionId}-nav-0`,
      ts: 0,
      wallClock: this.startedAt,
      type: 'nav',
      url: baseUrl,
    };
    this.events.push(nav);
    this.captureSnapshot();

    const onPointer = (type: PointerType) => (ev: Event): void => {
      const pe = ev as globalThis.PointerEvent;
      const target = pe.target as Element | null;
      if (!target) return;
      const name = semanticName(target, this.selectors);
      const cssPath = cssPathOf(target);
      const event: CuitPointerEvent = {
        seq: this.nextSeq(),
        vendor: this.vendor,
        vendorEventId: `${this.sessionId}-p-${this.seq}`,
        ts: this.relativeTs(),
        wallClock: this.now(),
        type: 'pointer',
        phase: PHASE_FROM_TYPE[type],
        targetSelector: cssPath,
        ...(name !== undefined ? { targetName: name } : {}),
        x: Math.round(pe.clientX),
        y: Math.round(pe.clientY),
        pointerId: pe.pointerId ?? 0,
      };
      this.events.push(event);
      if (type === 'pointerup' || type === 'pointerdown') {
        this.captureSnapshot();
      }
    };

    for (const t of POINTER_TYPES) {
      const handler = onPointer(t);
      this.doc.addEventListener(t, handler, true);
      this.listeners.push(() => this.doc.removeEventListener(t, handler, true));
    }
  }

  stop(): void {
    for (const off of this.listeners) off();
    this.listeners = [];
    this.captureSnapshot();
  }

  /** Explicit snapshot — useful between manual interactions. */
  captureSnapshot(): void {
    if (!this.snapshotProvider) return;
    let raw: Record<string, unknown> | null;
    try {
      raw = this.snapshotProvider();
    } catch {
      return;
    }
    if (!raw) return;
    const flattened = flattenSnapshot(raw);
    // Skip identical consecutive snapshots to keep the trace tight.
    const key = JSON.stringify(flattened);
    if (key === this.lastSnapshotKey) return;
    this.lastSnapshotKey = key;
    for (const [path, value] of flattened) {
      const ev: StateSnapshotEvent = {
        seq: this.nextSeq(),
        vendor: this.vendor,
        vendorEventId: `${this.sessionId}-snap-${this.seq}`,
        ts: this.relativeTs(),
        wallClock: this.now(),
        type: 'state-snapshot',
        path,
        value,
      };
      this.events.push(ev);
    }
  }

  export(): RecordedSession {
    if (this.startedAt === null) {
      throw new Error('Recorder.export(): recorder was never started');
    }
    const url = this.events.find((e): e is NavEvent => e.type === 'nav')?.url ?? '';
    return {
      sessionId: this.sessionId,
      vendor: this.vendor,
      createdAt: this.startedAt,
      url,
      events: [...this.events],
    };
  }

  /** Number of events captured so far (useful for live dashboards). */
  size(): number {
    return this.events.length;
  }

  private nextSeq(): number {
    const s = this.seq;
    this.seq += 1;
    return s;
  }

  private relativeTs(): number {
    if (this.startedAt === null) return 0;
    return this.now() - this.startedAt;
  }
}

/** Convenience helper for the Chrome extension. */
export function isCuitDebugAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as unknown as { __cuitDebug?: unknown }).__cuitDebug);
}

/** Standard provider that reads from window.__cuitDebug.getState(). */
export function cuitDebugProvider(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const dbg = (window as unknown as { __cuitDebug?: { getState: () => Record<string, unknown> } }).__cuitDebug;
  if (!dbg || typeof dbg.getState !== 'function') return null;
  try {
    return dbg.getState();
  } catch {
    return null;
  }
}
