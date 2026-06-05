import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react';

type Segment = { id: string; x: number; width: number };
type DebugState = { segments: Segment[] };
type CuitDebug = { getState: () => DebugState };

declare global {
  interface Window {
    __cuitDebug?: CuitDebug;
  }
}

const SEGMENT_WIDTH = 80;
const SEGMENT_GAP = 40;
const SEGMENT_COUNT = 3;

function initialSegments(): Segment[] {
  return Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
    id: `seg-${i}`,
    x: i === 0 ? 0 : i * (SEGMENT_WIDTH + SEGMENT_GAP),
    width: SEGMENT_WIDTH,
  }));
}

function readFixFlag(fixProp: boolean | undefined): boolean {
  if (fixProp !== undefined) return fixProp;
  const viteFlag =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, string | undefined>).VITE_FIX_SEGMENT_COLLISION
      : undefined;
  if (viteFlag === '1') return true;
  if (typeof process !== 'undefined' && process.env && process.env.FIX_SEGMENT_COLLISION === '1') {
    return true;
  }
  return false;
}

export type AppProps = {
  fixSegmentCollision?: boolean;
};

type DragState = {
  segmentId: string;
  pointerId: number;
  originX: number;
  startClientX: number;
};

export function App({ fixSegmentCollision }: AppProps = {}): ReactElement {
  const [segments, setSegments] = useState<Segment[]>(() => initialSegments());
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const fixEnabled = useMemo(() => readFixFlag(fixSegmentCollision), [fixSegmentCollision]);
  const fixEnabledRef = useRef(fixEnabled);
  fixEnabledRef.current = fixEnabled;

  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const api: CuitDebug = {
      getState: () => ({
        segments: segmentsRef.current.map((s) => ({ ...s })),
      }),
    };
    window.__cuitDebug = api;
    return () => {
      if (window.__cuitDebug === api) {
        delete window.__cuitDebug;
      }
    };
  }, []);

  // Attach native pointer listeners directly on segment elements. React's
  // synthetic event delegation is unreliable when events are dispatched from
  // outside React (e.g. by the @cuit/harness), so we bypass it entirely.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const dragState = { current: null as DragState | null };

    const findSegmentElement = (target: EventTarget | null): HTMLElement | null => {
      let node: Node | null = target as Node | null;
      while (node && node.nodeType === 1) {
        const el = node as HTMLElement;
        if (el.dataset && el.dataset.segmentId) return el;
        node = node.parentNode;
      }
      return null;
    };

    const onDown = (ev: Event): void => {
      const pe = ev as PointerEvent;
      const el = findSegmentElement(pe.target);
      if (!el) return;
      const segmentId = el.dataset.segmentId ?? '';
      const seg = segmentsRef.current.find((s) => s.id === segmentId);
      if (!seg) return;
      dragState.current = {
        segmentId,
        pointerId: pe.pointerId,
        originX: seg.x,
        startClientX: pe.clientX,
      };
    };

    const onMove = (ev: Event): void => {
      const pe = ev as PointerEvent;
      const drag = dragState.current;
      if (!drag || drag.pointerId !== pe.pointerId) return;
      const dx = pe.clientX - drag.startClientX;
      const proposedX = drag.originX + dx;

      setSegments((prev) => {
        const next = prev.map((s) => ({ ...s }));
        const idx = next.findIndex((s) => s.id === drag.segmentId);
        if (idx < 0) return prev;
        const moving = next[idx];
        if (!moving) return prev;

        if (!fixEnabledRef.current) {
          const collides = next.some((other, j) => {
            if (j === idx) return false;
            const aStart = proposedX;
            const aEnd = proposedX + moving.width;
            const bStart = other.x;
            const bEnd = other.x + other.width;
            return aStart < bEnd && bStart < aEnd;
          });
          if (collides) return prev;
        }

        moving.x = proposedX;
        return next;
      });
    };

    const onUp = (ev: Event): void => {
      const pe = ev as PointerEvent;
      const drag = dragState.current;
      if (!drag || drag.pointerId !== pe.pointerId) return;
      dragState.current = null;
    };

    track.addEventListener('pointerdown', onDown, true);
    track.addEventListener('pointermove', onMove, true);
    track.addEventListener('pointerup', onUp, true);
    return () => {
      track.removeEventListener('pointerdown', onDown, true);
      track.removeEventListener('pointermove', onMove, true);
      track.removeEventListener('pointerup', onUp, true);
    };
  }, []);

  const trackStyle: CSSProperties = {
    position: 'relative',
    width: 800,
    height: 64,
    background: '#0f172a',
    borderRadius: 8,
  };

  return (
    <div data-testid="demo-app-root">
      <div data-testid="waveform-track" ref={trackRef} style={trackStyle}>
        {segments.map((s) => (
          <div
            key={s.id}
            data-segment-id={s.id}
            data-testid={`segment-${s.id}`}
            style={{
              position: 'absolute',
              left: s.x,
              top: 8,
              width: s.width,
              height: 48,
              background: '#38bdf8',
              borderRadius: 4,
              cursor: 'grab',
              touchAction: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
