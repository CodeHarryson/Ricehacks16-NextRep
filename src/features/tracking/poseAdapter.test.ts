import assert from 'node:assert/strict';
import test from 'node:test';
import type { PoseFrame, PoseLandmark } from '../../contracts/pose';
import { normalizePoseResult, selectVisibleSide } from './poseAdapter';

function poseFrame(landmarks: PoseLandmark[]): PoseFrame {
  return {
    timestamp: 1,
    timestampUnit: 'milliseconds',
    clock: 'monotonic-session',
    image: { width: 480, height: 640 },
    coordinateSpace: 'normalized-image',
    view: 'unknown',
    landmarks,
  };
}

const side = (indices: readonly number[], visibility: number): PoseLandmark[] =>
  indices.map((index, offset) => ({ index, x: 0.4, y: 0.2 + offset * 0.2, z: 0, visibility }));

test('normalization preserves only detector-supplied visibility and presence', () => {
  const frame = normalizePoseResult({
    inputImageWidth: 480,
    inputImageHeight: 640,
    results: [{ landmarks: [[
      { x: 0.1, y: 0.2, z: -0.1, visibility: 0.8 },
      { x: 0.3, y: 0.4, z: -0.2, presence: 0.7 },
      { x: 0.5, y: 0.6, z: -0.3 },
    ]] }],
  }, 'unknown', 12.5, { width: 640, height: 480 });

  assert.deepEqual(frame?.image, { width: 640, height: 480 });
  assert.equal(frame?.landmarks[0]?.visibility, 0.8);
  assert.equal(frame?.landmarks[1]?.presence, 0.7);
  assert.equal(frame?.landmarks[2]?.visibility, undefined);
  assert.equal(frame?.landmarks[2]?.presence, undefined);
});

test('visible-side selection chooses the usable side and rejects insufficient visibility', () => {
  const left = [11, 23, 25, 27] as const;
  const right = [12, 24, 26, 28] as const;
  assert.equal(selectVisibleSide(poseFrame([...side(left, 0.92), ...side(right, 0.7)])), 'left');
  assert.equal(selectVisibleSide(poseFrame([...side(left, 0.5), ...side(right, 0.88)])), 'right');
  assert.equal(selectVisibleSide(poseFrame([...side(left, 0.5), ...side(right, 0.4)])), null);
});
