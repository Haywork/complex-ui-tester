import type {
  ConsoleEvent,
  ConsoleLevel,
  ErrorEvent,
  KeyboardEvent as CuitKeyboardEvent,
  NavEvent,
  PointerEvent as CuitPointerEvent,
  SessionEvent,
  StateSnapshotEvent,
} from '@haywork/cuit-types';

// ─── Console capture constants ────────────────────────────────────────────────

/** Maximum number of serialised args stored per ConsoleEvent before an overflow marker. */
const MAX_ARGS = 10;
/** Maximum character length of a single serialised arg before truncation with '…'. */
const MAX_ARG_LEN = 2000;
/** All console levels the recorder wraps. */
const CONSOLE_LEVELS: readonly ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

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
  /**
   * Capture `console.log/info/warn/error/debug` calls during the session as
   * `ConsoleEvent` entries. Each call is also forwarded to the original method.
   * Default `true`.
   */
  captureConsole?: boolean;
  /**
   * Capture `window` `error` and `unhandledrejection` events during the session
   * as `ErrorEvent` entries (type:'error-event'). Default `true`.
   */
  captureErrors?: boolean;
  /**
   * Optional hook applied to every console arg before serialisation.  Use it
   * to strip secrets (e.g. API keys) from the trace.
   */
  redactConsoleArg?: (arg: unknown) => unknown;
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
  private readonly captureConsoleOpt: boolean;
  private readonly captureErrorsOpt: boolean;
  private readonly redactConsoleArg: ((arg: unknown) => unknown) | undefined;
  private readonly events: SessionEvent[] = [];
  private seq = 0;
  private startedAt: number | null = null;
  private listeners: Array<() => void> = [];
  private lastSnapshotKey: string | null = null;
  /** Re-entrancy guard: prevents recursive console calls from infinite-looping. */
  private consoleCapturing = false;

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
    this.captureConsoleOpt = options.captureConsole ?? true;
    this.captureErrorsOpt = options.captureErrors ?? true;
    this.redactConsoleArg = options.redactConsoleArg;
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

    // Install console and error capture AFTER pointer listeners so the LIFO
    // teardown order in stop() restores console before removing DOM listeners.
    this.installConsoleCapture();

    // Install keyboard / text-input capture so typed values are recorded.
    this.installKeyboardCapture();
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

  // ─── Keyboard / text-input capture ────────────────────────────────────────

  /**
   * Installs an `input` event listener on the document that captures text typed
   * into input fields as `KeyboardEvent` (type:'keyboard') entries.
   *
   * The captured `value` is the full current text value of the element at the
   * time of the event, not individual keystroke deltas.  This matches the
   * @haywork/cuit-types KeyboardEvent contract and what spec-gen needs to replay typing.
   *
   * Must be called inside `start()` after `startedAt` is set.
   */
  private installKeyboardCapture(): void {
    const onInput = (ev: Event): void => {
      const target = ev.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!target) return;
      // Only capture elements that have a `.value` property (inputs, textareas, etc.)
      const value = typeof (target as { value?: unknown }).value === 'string'
        ? (target as { value: string }).value
        : '';
      const name = semanticName(target as Element, this.selectors);
      const cssPath = cssPathOf(target as Element);
      const kbEvent: CuitKeyboardEvent = {
        seq: this.nextSeq(),
        vendor: this.vendor,
        vendorEventId: `${this.sessionId}-kb-${this.seq}`,
        ts: this.relativeTs(),
        wallClock: this.now(),
        type: 'keyboard',
        targetSelector: cssPath,
        ...(name !== undefined ? { targetName: name } : {}),
        value,
      };
      this.events.push(kbEvent);
    };

    this.doc.addEventListener('input', onInput, true);
    this.listeners.push(() => this.doc.removeEventListener('input', onInput, true));
  }

  // ─── Console / error capture ───────────────────────────────────────────────

  /**
   * Safely convert a single console argument to a string suitable for storage.
   * - Primitives are String()-coerced.
   * - Objects / functions are JSON.stringify'd; circular/non-serialisable values
   *   fall back to String(v).
   * - The result is capped at MAX_ARG_LEN with a '…' suffix.
   * Never throws.
   */
  private safeStringifyArg(v: unknown): string {
    let s: string;
    if (v === null) {
      s = 'null';
    } else if (typeof v === 'undefined') {
      s = 'undefined';
    } else if (typeof v === 'symbol') {
      s = v.toString();
    } else if (typeof v === 'object' || typeof v === 'function') {
      try {
        s = JSON.stringify(v) ?? String(v);
      } catch {
        s = String(v);
      }
    } else {
      s = String(v);
    }
    if (s.length > MAX_ARG_LEN) {
      return s.slice(0, MAX_ARG_LEN - 1) + '…';
    }
    return s;
  }

  /**
   * Serialise and cap a raw arguments array.
   * - Applies `redactConsoleArg` if provided.
   * - Caps to MAX_ARGS; appends an overflow marker for extras.
   * - Returns string[] so args are always JSON-serialisable.
   */
  private serialiseArgs(rawArgs: unknown[]): string[] {
    const overflow = rawArgs.length > MAX_ARGS ? rawArgs.length - MAX_ARGS : 0;
    const slice = rawArgs.slice(0, MAX_ARGS);
    const redact = this.redactConsoleArg;
    const serialised = slice.map((a) => {
      const v = redact ? redact(a) : a;
      return this.safeStringifyArg(v);
    });
    if (overflow > 0) {
      serialised.push(`+${overflow} more`);
    }
    return serialised;
  }

  /**
   * Wraps each console level and registers a teardown in `this.listeners`.
   * Also installs window 'error' and 'unhandledrejection' handlers when
   * `captureErrors` is true.
   *
   * Must be called inside `start()` after `startedAt` is set.
   */
  private installConsoleCapture(): void {
    // Resolve the console object via the document's window so tests using a
    // custom document / window (jsdom) work correctly.
    const win: (Window & typeof globalThis) | null =
      (this.doc.defaultView as (Window & typeof globalThis) | null) ?? null;
    const cons: Console = win?.console ?? globalThis.console;

    if (this.captureConsoleOpt) {
      for (const level of CONSOLE_LEVELS) {
        // Save the UNBOUND original so stop() restores the exact same reference
        // the caller held before start().  We bind only for the call-through so
        // `this` is correct inside the native console method.
        const originalUnbound = cons[level] as (...args: unknown[]) => void;
        const originalBound = originalUnbound.bind(cons) as (...args: unknown[]) => void;

        const wrapper = (...args: unknown[]): void => {
          // Always call through first so the original output is not suppressed.
          originalBound(...args);

          // Re-entrancy guard: if we are already inside the capture path (e.g.
          // redactConsoleArg or safeStringifyArg calls console.log), skip the
          // event push to prevent infinite recursion.
          if (this.consoleCapturing) return;
          this.consoleCapturing = true;
          try {
            const serialisedArgs = this.serialiseArgs(args);
            // message is the space-joined representation excluding overflow markers.
            const overflowRe = /^\+\d+ more$/;
            const message = serialisedArgs.filter((a) => !overflowRe.test(a)).join(' ');
            const ev: ConsoleEvent = {
              seq: this.nextSeq(),
              vendor: this.vendor,
              vendorEventId: `${this.sessionId}-con-${this.seq}`,
              ts: this.relativeTs(),
              wallClock: this.now(),
              type: 'console',
              level,
              message,
              args: serialisedArgs,
            };
            this.events.push(ev);
          } finally {
            this.consoleCapturing = false;
          }
        };

        // Replace the console method with our wrapper.
        (cons as unknown as Record<string, unknown>)[level] = wrapper;

        // Register restore teardown — puts back the UNBOUND original so the
        // caller's saved reference (e.g. `const savedLog = console.log`) matches.
        this.listeners.push(() => {
          (cons as unknown as Record<string, unknown>)[level] = originalUnbound;
        });
      }
    }

    if (this.captureErrorsOpt && win) {
      // window 'error' → ErrorEvent (source:'window.error')
      const onWindowError = (ev: Event): void => {
        const message = (ev as { message?: string }).message ?? String(ev);
        const err = (ev as { error?: unknown }).error;
        const stack =
          err instanceof Error && typeof err.stack === 'string'
            ? err.stack
            : undefined;

        const errorEvt: ErrorEvent = {
          seq: this.nextSeq(),
          vendor: this.vendor,
          vendorEventId: `${this.sessionId}-err-${this.seq}`,
          ts: this.relativeTs(),
          wallClock: this.now(),
          type: 'error-event',
          message,
          ...(stack !== undefined ? { stack } : {}),
          source: 'window.error',
        };
        this.events.push(errorEvt);

        // Also push a ConsoleEvent so bridge consumers that filter by
        // type:'console' / level:'error' see the window error.
        const consoleEv: ConsoleEvent = {
          seq: this.nextSeq(),
          vendor: this.vendor,
          vendorEventId: `${this.sessionId}-con-${this.seq}`,
          ts: this.relativeTs(),
          wallClock: this.now(),
          type: 'console',
          level: 'error',
          message,
          args: [message],
        };
        this.events.push(consoleEv);
      };

      win.addEventListener('error', onWindowError);
      this.listeners.push(() => win.removeEventListener('error', onWindowError));

      // window 'unhandledrejection' → ErrorEvent (source:'unhandledrejection')
      // + ConsoleEvent for bridge consumers.
      const onUnhandledRejection = (ev: Event): void => {
        const reason = (ev as { reason?: unknown }).reason;
        let message: string;
        let stack: string | undefined;
        if (reason instanceof Error) {
          message = reason.message;
          stack = reason.stack;
        } else {
          message = String(reason ?? 'unhandled rejection');
        }

        const errorEvt: ErrorEvent = {
          seq: this.nextSeq(),
          vendor: this.vendor,
          vendorEventId: `${this.sessionId}-rej-${this.seq}`,
          ts: this.relativeTs(),
          wallClock: this.now(),
          type: 'error-event',
          message,
          ...(stack !== undefined ? { stack } : {}),
          source: 'unhandledrejection',
        };
        this.events.push(errorEvt);

        const consoleEv: ConsoleEvent = {
          seq: this.nextSeq(),
          vendor: this.vendor,
          vendorEventId: `${this.sessionId}-con-${this.seq}`,
          ts: this.relativeTs(),
          wallClock: this.now(),
          type: 'console',
          level: 'error',
          message,
          args: [message],
        };
        this.events.push(consoleEv);
      };

      win.addEventListener('unhandledrejection', onUnhandledRejection);
      this.listeners.push(() => win.removeEventListener('unhandledrejection', onUnhandledRejection));
    }
  }

  // ─── Sequence / timing helpers ─────────────────────────────────────────────

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
