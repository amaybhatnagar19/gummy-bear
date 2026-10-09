import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoPrompt, reserveCall, validateResult } from '../convex/rules.ts';
test('JSON reply mode has the required JSON instruction in the input message', () => {
  assert.match(photoPrompt(4), /json/i);
  assert.match(photoPrompt(4), /4 years old/);
});
test('100 calls are allowed, the 101st is blocked, and only expired calls free capacity', () => {
  const now = 4000000;
  let calls: number[] = [];
  for (let i = 0; i < 100; i++) calls = reserveCall(calls, now)!;
  assert.equal(calls.length, 100);
  assert.equal(reserveCall(calls, now), null);
  assert.equal(reserveCall(calls, now + 3599999), null);
  assert.deepEqual(reserveCall(calls, now + 3600000), [now + 3600000]);
  assert.equal(reserveCall([now - 3600001, ...Array(99).fill(now)], now)?.length, 100);
});
test('a reply must contain three complete ideas, or no toys and no ideas', () => {
  assert.deepEqual(validateResult({ toys: [], ideas: [] }), { toys: [], ideas: [] });
  assert.throws(() => validateResult({ toys: ['teddy'], ideas: [] }));
  assert.throws(() => validateResult({ toys: [], ideas: [{ title: 'x', instructions: 'x' }] }));
  const result = { toys: ['teddy'], ideas: Array.from({ length: 3 }, () => ({ title: 'Bear rescue', instructions: 'Help the teddy get home.' })) };
  assert.deepEqual(validateResult(result), result);
  assert.throws(() => validateResult({ ...result, ideas: [{ title: '', instructions: '' }] }));
});
