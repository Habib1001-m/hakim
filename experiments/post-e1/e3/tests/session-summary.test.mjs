import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeSession } from '../src/session-summary.mjs';

test('formats a completed session summary', () => {
  assert.equal(
    summarizeSession({ id: 's-17', durationMs: 61_234, status: 'done' }),
    's-17 · 1m 01s · done',
  );
});

test('formats sub-minute durations consistently', () => {
  assert.equal(
    summarizeSession({ id: 's-18', durationMs: 9_999, status: 'running' }),
    's-18 · 0m 09s · running',
  );
});

test('preserves duration input validation', () => {
  assert.throws(
    () => summarizeSession({ id: 's-19', durationMs: -1, status: 'done' }),
    /durationMs must be a non-negative finite number/,
  );
});
