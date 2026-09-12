import assert from 'node:assert/strict';
import test from 'node:test';
import { SquatAnalyzer } from './engine';
import { cleanFiveSquats, frame, oneSquat, standingFrames, testRubric } from './fixtures';
import { deserializeReplay, serializeReplay } from './replayFormat';

function analyzer(overrides = {}) {
  return new SquatAnalyzer({ sessionId: 'session', setId: 'set', selectedSide: 'left', rubric: { ...testRubric, ...overrides } });
}
function run(a: SquatAnalyzer, frames: ReturnType<typeof standingFrames>) {
  return frames.flatMap((item) => a.process(item).attempts);
}
function prepare(a: SquatAnalyzer) { run(a, standingFrames()); }

test('one clean squat emits one completed yellow attempt', () => {
  const a = analyzer(); prepare(a); const results = run(a, oneSquat(500, 40));
  assert.equal(results.length, 1); assert.equal(results[0]!.rating, 'yellow'); assert.equal(results[0]!.countDelta, 1); assert.ok(results[0]!.peakRange >= 40);
});

test('five clean squats emit exactly five reps', () => {
  const a = analyzer(); const results = run(a, cleanFiveSquats());
  assert.equal(results.length, 5); assert.equal(results.filter((r) => r.countDelta === 1).length, 5);
});

test('shallow partial and small standing movements do not count', () => {
  const a = analyzer(); prepare(a); const results = run(a, [10, 14, 18, 18, 10, 5, 0, 0].map((r, i) => frame(500 + i * 100, r)));
  assert.equal(results.length, 1); assert.equal(results[0]!.rating, 'red'); assert.equal(results[0]!.countDelta, 0);
  const b = analyzer(); prepare(b); assert.equal(run(b, [frame(500, 4), frame(600, 2), frame(700, 0)]).length, 0);
});

test('bottom bounce and bottom hold remain one attempt', () => {
  const a = analyzer(); prepare(a); const bounce = [10, 14, 30, 45, 60, 60, 48, 58, 45, 20, 0, 0].map((r, i) => frame(500 + i * 100, r));
  assert.equal(run(a, bounce).filter((r) => r.countDelta === 1).length, 1);
  const b = analyzer(); prepare(b); const hold = [10, 14, 30, 45, 60, 60, 60, 60, 20, 0, 0].map((r, i) => frame(500 + i * 100, r));
  assert.equal(run(b, hold).length, 1);
});

test('noisy landmarks near start/minimum thresholds require persistence', () => {
  const a = analyzer(); prepare(a);
  const samples = [7, 9, 7, 9, 30, 31, 33, 31, 30, 8, 6, 0, 0].map((r, i) => frame(500 + i * 100, r));
  const results = run(a, samples);
  assert.equal(results.length, 1); assert.equal(results[0]!.rating, 'red'); assert.equal(results[0]!.countDelta, 0);
});

test('duplicate callbacks and repeated standing frames cannot emit twice', () => {
  const a = analyzer(); prepare(a); const squat = oneSquat(500, 60); const results = squat.flatMap((f) => [...a.process(f).attempts, ...a.process(f).attempts]);
  assert.equal(results.length, 1); assert.equal(results[0]!.attemptId, 'session:set:attempt-1'); assert.equal(run(a, standingFrames(1500, 8)).length, 0);
});

test('two distinct attempts produce two distinct exactly-once events', () => {
  const a = analyzer(); prepare(a); const results = run(a, [...oneSquat(500, 60), ...oneSquat(1500, 60)]);
  assert.equal(results.length, 2); assert.deepEqual(results.map((r) => r.attemptId), ['session:set:attempt-1', 'session:set:attempt-2']);
});

test('tracking loss at descent, bottom, and ascent emits neutral and requires standing reacquisition', () => {
  for (const lossAt of [600, 800, 1000]) {
    const a = analyzer(); prepare(a); const squat = oneSquat(500, 60); const before = squat.filter((f) => f.timestamp <= lossAt);
    run(a, before); const neutral = a.updateTracking(null); assert.equal(neutral.length, 1); assert.equal(neutral[0]!.rating, null); assert.equal(neutral[0]!.assessable, false);
    const after = run(a, [frame(lossAt + 100, 0), frame(lossAt + 200, 0), ...oneSquat(lossAt + 300, 60)]);
    assert.equal(after.filter((r) => r.countDelta === 1).length, 1);
  }
});

test('poor visibility, framing, wrong side, jumps, and gaps are rejected neutrally', () => {
  const cases = [
    (f: ReturnType<typeof frame>) => frame(f.timestamp, 0, { visibility: 0.1 }),
    (f: ReturnType<typeof frame>) => ({ ...f, confidence: 0.1 }),
    (f: ReturnType<typeof frame>) => ({ ...f, view: 'right' as const }),
    (f: ReturnType<typeof frame>) => ({ ...f, landmarks: f.landmarks.map((p) => p.index === 25 ? { ...p, x: 1.2 } : p) }),
  ];
  for (const make of cases) { const a = analyzer(); prepare(a); const out = a.process(make(frame(500, 20))); assert.equal(out.trackingInterrupted, true); assert.equal(out.attempts.length, 0); }
  const a = analyzer(); prepare(a); const jump = a.process(frame(500, 10)); assert.equal(jump.attempts.length, 0); const rejected = a.process(frame(600, 60)); assert.match(rejected.rejectedReason ?? '', /jump|reacquir/i);
  const b = analyzer(); prepare(b); const gap = b.process(frame(2000, 0)); assert.match(gap.rejectedReason ?? '', /gap/i);
});

test('timeout emits one assessable red incomplete attempt', () => {
  const a = analyzer({ attemptTimeoutMs: 500 }); prepare(a); const results = run(a, [frame(500, 10), frame(600, 14), frame(700, 20), frame(1100, 20)]);
  assert.equal(results.length, 1); assert.equal(results[0]!.rating, 'red'); assert.equal(results[0]!.completed, false);
});

test('frame-rate changes preserve clean rep count', () => {
  const make = (step: number) => { const a = analyzer(); const frames = standingFrames(0, 5, step); frames.push(...oneSquat(step * 5, 60, step)); return run(a, frames); };
  assert.equal(make(50).filter((r) => r.countDelta === 1).length, 1); assert.equal(make(100).filter((r) => r.countDelta === 1).length, 1); assert.equal(make(200).filter((r) => r.countDelta === 1).length, 1);
});

test('landmark replay fixtures serialize and round-trip without video', () => {
  const fixture = deserializeReplay(serializeReplay(oneSquat(0), 'synthetic logic validation only'));
  assert.equal(fixture.schemaVersion, 1); assert.equal(fixture.description, 'synthetic logic validation only'); assert.equal(fixture.frames.length, 10);
});
