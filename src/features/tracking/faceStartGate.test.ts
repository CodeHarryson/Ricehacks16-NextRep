import assert from 'node:assert/strict';
import test from 'node:test';
import type { PoseFrame, PoseLandmark } from '../../contracts/pose';
import { assessFaceStart } from './faceStartGate';

function frame(overrides: Partial<Record<number, Partial<PoseLandmark>>> = {}): PoseFrame {
  const landmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, index) => ({
    index, x: 0.5, y: 0.32, z: 0, visibility: 0,
  }));
  const face = {
    0: { x: 0.5, y: 0.34 }, 2: { x: 0.46, y: 0.3 }, 5: { x: 0.54, y: 0.3 },
    7: { x: 0.42, y: 0.32 }, 8: { x: 0.58, y: 0.32 },
  } as const;
  for (const [key, position] of Object.entries(face)) {
    const index = Number(key); landmarks[index] = { ...landmarks[index]!, ...position, visibility: 0.95, ...overrides[index] };
  }
  return { timestamp: 1, timestampUnit: 'milliseconds', clock: 'monotonic-session', image: { width: 480, height: 640 }, coordinateSpace: 'normalized-image', landmarks };
}

test('face start accepts a visible centered face and does not identify a person', () => {
  assert.equal(assessFaceStart(frame()).ready, true);
});

test('face start rejects low visibility, off-center placement, and a distant face', () => {
  assert.equal(assessFaceStart(frame({ 0: { visibility: 0.2 } })).ready, false);
  assert.match(assessFaceStart(frame({ 2: { x: 0.8 }, 5: { x: 0.88 }, 7: { x: 0.76 }, 8: { x: 0.92 } })).guidance, /Center/);
  assert.match(assessFaceStart(frame({ 7: { x: 0.48 }, 8: { x: 0.52 } })).guidance, /closer/);
});
