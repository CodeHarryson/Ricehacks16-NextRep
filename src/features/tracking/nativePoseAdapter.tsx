import { useEffect, useMemo, useRef } from 'react';
import {
  Delegate,
  RunningMode,
  usePoseDetection,
  type DetectionError,
  type PoseDetectionResultBundle,
} from 'react-native-mediapipe';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { normalizePoseResult, POSE_MODEL_ASSET } from './poseAdapter';

export interface NativePoseAdapterProps {
  active: boolean;
  selectedSide: 'left' | 'right' | 'unknown';
  onFrame: (frame: PoseFrame) => void;
  onTracking: (update: TrackingUpdate) => void;
}

function monotonicMilliseconds(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function useNativePoseAdapter({ active, selectedSide, onFrame, onTracking }: NativePoseAdapterProps) {
  const mounted = useRef(true);
  const lastTimestamp = useRef(-1);
  const callbacks = useMemo(() => ({
    onResults: (bundle: PoseDetectionResultBundle) => {
      if (!mounted.current) return;
      const timestamp = monotonicMilliseconds();
      if (timestamp <= lastTimestamp.current) return;
      const frame = normalizePoseResult(bundle, selectedSide, timestamp);
      if (!frame) {
        onTracking({ status: 'lost', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: 'Step back until your full body is visible.' });
        return;
      }
      lastTimestamp.current = timestamp;
      onTracking({ status: 'tracking', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: 'Tracking body position.' });
      onFrame(frame);
    },
    onError: (error: DetectionError) => {
      if (!mounted.current) return;
      onTracking({ status: 'error', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: `Pose tracking error: ${error.message}` });
    },
  }), [onFrame, onTracking, selectedSide]);

  const solution = usePoseDetection(callbacks, RunningMode.LIVE_STREAM, POSE_MODEL_ASSET, {
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    delegate: Delegate.CPU,
    mirrorMode: 'no-mirror',
    forceOutputOrientation: 'portrait',
    forceCameraOrientation: 'portrait',
    fpsMode: 15,
  });

  useEffect(() => {
    mounted.current = true;
    onTracking({ status: active ? 'initializing' : 'lost', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: active ? 'Starting on-device pose tracking…' : 'Camera paused.' });
    return () => { mounted.current = false; };
  }, [active, onTracking]);

  return solution;
}
