import { describe, expect, test } from 'vitest';
import {
  dispatchDrag,
  getStateSnapshot,
  setClock,
} from '@haywork/harness';

describe('drag seg-0 by +100px updates segments[0].x', () => {
  test('drag seg-0 by +100px updates segments[0].x', () => {
    setClock(1716800000000);

    dispatchDrag('seg-0', 100, 0);

    const snapshot = getStateSnapshot();
    expect(snapshot['segments[0].x']).toEqual(100);
  });
});
