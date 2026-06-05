import type { SessionEvent } from '@cuit/types';

const URL = 'http://localhost:5173/';
const TARGET_SELECTOR = '[data-segment-id="seg-0"]';
const TARGET_NAME = 'seg-0';
const POINTER_ID = 1;
const START_TS = 1716800000000;

const pointer = (
  seq: number,
  tsOffset: number,
  phase: 'down' | 'move' | 'up',
  x: number,
): SessionEvent => ({
  seq,
  vendor: 'jam',
  vendorEventId: `jam-sess-2014-${seq + 1}`,
  ts: START_TS + tsOffset,
  wallClock: START_TS + tsOffset,
  type: 'pointer',
  phase,
  targetSelector: TARGET_SELECTOR,
  targetName: TARGET_NAME,
  x,
  y: 60,
  pointerId: POINTER_ID,
});

export const SEGMENT_COLLISION_EVENTS: SessionEvent[] = [
  {
    seq: 0,
    vendor: 'jam',
    vendorEventId: 'jam-sess-2014-1',
    ts: START_TS,
    wallClock: START_TS,
    type: 'nav',
    url: URL,
  },
  {
    seq: 1,
    vendor: 'jam',
    vendorEventId: 'jam-sess-2014-2',
    ts: START_TS + 10,
    wallClock: START_TS + 10,
    type: 'state-snapshot',
    path: 'segments[0].x',
    value: 0,
  },
  {
    seq: 2,
    vendor: 'jam',
    vendorEventId: 'jam-sess-2014-3',
    ts: START_TS + 11,
    wallClock: START_TS + 11,
    type: 'state-snapshot',
    path: 'segments[1].x',
    value: 200,
  },
  pointer(3, 100, 'down', 50),
  pointer(4, 200, 'move', 100),
  pointer(5, 300, 'move', 130),
  pointer(6, 400, 'up', 150),
  {
    seq: 7,
    vendor: 'jam',
    vendorEventId: 'jam-sess-2014-8',
    ts: START_TS + 500,
    wallClock: START_TS + 500,
    type: 'state-snapshot',
    path: 'segments[0].x',
    value: 0,
  },
];

export const SEGMENT_COLLISION_START_TS = START_TS;
export const SEGMENT_COLLISION_URL = URL;
