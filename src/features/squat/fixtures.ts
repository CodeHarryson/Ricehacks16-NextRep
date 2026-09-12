import type { PoseFrame, PoseLandmark } from '../../contracts/pose';

export const testRubric = {
  calibrationFrames: 5,
  descentPersistenceMs: 100,
  minimumPersistenceMs: 100,
  standingPersistenceMs: 100,
  smoothingTimeConstantMs: 1,
  maxFrameGapMs: 500,
  attemptTimeoutMs: 3000,
  reacquisitionStandingFrames: 2,
};

/** Synthetic logic fixture only. It is not a camera or accuracy claim. */
export function frame(timestamp: number, rangeDeg: number, overrides: Partial<PoseLandmark> = {}): PoseFrame {
  const angle = rangeDeg * Math.PI / 180;
  const hip = { x: 0.5, y: 0.4 };
  const knee = { x: hip.x + Math.sin(angle) * 0.18, y: hip.y + Math.cos(angle) * 0.18 };
  const landmarks: PoseLandmark[] = [
    { index: 11, x: 0.5, y: 0.2, z: 0, visibility: 1 },
    { index: 23, ...hip, z: 0, visibility: 1 },
    { index: 25, ...knee, z: 0, visibility: 1, ...overrides },
    { index: 27, x: knee.x, y: Math.min(0.98, knee.y + 0.18), z: 0, visibility: 1 },
  ];
  return { timestamp, timestampUnit: 'milliseconds', clock: 'monotonic-session', image: { width: 1000, height: 1000 }, coordinateSpace: 'normalized-image', view: 'left', landmarks };
}

export function standingFrames(start = 0, count = 5, step = 100): PoseFrame[] {
  return Array.from({ length: count }, (_, i) => frame(start + i * step, 0));
}

/** One complete attempt; the values are range deltas in degrees. */
export function oneSquat(start: number, depth = 60, step = 100): PoseFrame[] {
  return [10, 14, 30, 45, depth, depth, Math.max(12, depth - 18), 5, 2, 0].map((range, i) => frame(start + i * step, range));
}

export function cleanFiveSquats(): PoseFrame[] {
  const output = standingFrames();
  for (let i = 0; i < 5; i++) output.push(...oneSquat(500 + i * 1000));
  return output;
}
