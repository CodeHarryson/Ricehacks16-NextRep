import assert from 'node:assert/strict';
import test from 'node:test';
import { completedSetCountAfterCompletion } from './sessionAccounting';

test('multi-set accounting increments between sets and completes the final set', () => {
  assert.equal(completedSetCountAfterCompletion(0, 3), 1);
  assert.equal(completedSetCountAfterCompletion(1, 3), 2);
  assert.equal(completedSetCountAfterCompletion(2, 3), 3);
  assert.equal(completedSetCountAfterCompletion(3, 3), 3);
});
