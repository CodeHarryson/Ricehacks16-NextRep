import type { PoseFrame, PoseLandmark } from '../../contracts/pose';

const FACE_INDICES = [0, 2, 5, 7, 8] as const;

export interface FaceStartAssessment {
  ready: boolean;
  guidance: string;
}

function landmark(frame: PoseFrame, index: number): PoseLandmark | undefined {
  return frame.landmarks.find((candidate) => candidate.index === index);
}

/** A non-biometric start gesture. It checks face placement, not identity. */
export function assessFaceStart(frame: PoseFrame): FaceStartAssessment {
  const points = FACE_INDICES.map((index) => landmark(frame, index));
  if (points.some((point) => point === undefined || (point.visibility ?? point.presence ?? 0) < 0.65)) {
    return { ready: false, guidance: 'Move your face into the oval and look toward the camera.' };
  }
  const [nose, leftEye, rightEye, leftEar, rightEar] = points as PoseLandmark[];
  if (!nose || !leftEye || !rightEye || !leftEar || !rightEar) {
    return { ready: false, guidance: 'Move your face into the oval and look toward the camera.' };
  }
  const centerX = (leftEye.x + rightEye.x + leftEar.x + rightEar.x) / 4;
  const centerY = (leftEye.y + rightEye.y + leftEar.y + rightEar.y) / 4;
  if (Math.abs(centerX - 0.5) > 0.22 || Math.abs(centerY - 0.32) > 0.24) {
    return { ready: false, guidance: 'Center your face inside the oval.' };
  }
  const faceWidth = Math.hypot(leftEar.x - rightEar.x, leftEar.y - rightEar.y);
  if (faceWidth < 0.08) return { ready: false, guidance: 'Move a little closer so your face fills the oval.' };
  return { ready: true, guidance: 'Hold still to start the workout.' };
}

export const FACE_START_HOLD_FRAMES = 8;
