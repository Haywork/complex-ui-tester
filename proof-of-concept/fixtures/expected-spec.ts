import { describe, expect, test } from 'vitest';
import {
  dispatchDrag,
  getStateSnapshot,
  setClock,
} from '@cuit/harness';

describe('issue-2014 — segment 0 drag must not collide-noop', () => {
  test('drags segment 0 right by 100px and asserts state moves', () => {
    setClock(1716800000000);

    dispatchDrag('seg-0', 100, 0);

    const snapshot = getStateSnapshot();
    expect(snapshot['segments[0].x']).toEqual(100);
  });
});
