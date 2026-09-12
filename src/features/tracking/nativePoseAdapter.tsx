import { useEffect, useMemo, useRef } from 'react';
import {
  Delegate,
  RunningMode,
  usePoseDetection,
  type DetectionError,
  type PoseDetectionResultBundle,
  type ViewCoordinator,
} from 'react-native-mediapipe';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { monotonicMilliseconds, normalizePoseResult, POSE_MODEL_ASSET } from './poseAdapter';

export interface NativePoseAdapterProps {
  active: boolean;
  selectedSide: 'left' | 'right' | 'unknown';
  onFrame: (frame: PoseFrame) => void;
  onTracking: (update: TrackingUpdate) => void;
}

const healthUpdate = (status: TrackingUpdate['status'], guidance: string, timestamp = monotonicMilliseconds()): TrackingUpdate => ({
  status, observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', monotonicTimestamp: timestamp, guidance,
});

export function useNativePoseAdapter({ active, selectedSide, onFrame, onTracking }: NativePoseAdapterProps) {
  const mounted = useRef(true);
  const lastTimestamp = useRef(-1);
  const callbacks = useMemo(() => ({
    onResults: (bundle: PoseDetectionResultBundle, coordinator: ViewCoordinator) => {
      if (!mounted.current) return;
      const timestamp = monotonicMilliseconds();
      if (timestamp <= lastTimestamp.current) return;
      const frame = normalizePoseResult(bundle, selectedSide, timestamp, coordinator.getFrameDims(bundle));
      if (!frame) {
        onTracking(healthUpdate('lost', 'Step back until your full body is visible.', timestamp));
        return;
      }
      lastTimestamp.current = timestamp;
      onTracking(healthUpdate('tracking', 'Tracking body position.', timestamp));
      onFrame(frame);
    },
    onError: (error: DetectionError) => {
      if (!mounted.current) return;
      onTracking(healthUpdate('error', `Pose tracking error: ${error.message}`));
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
    fpsMode: 15,
  });

  useEffect(() => {
    mounted.current = true;
    onTracking(healthUpdate(active ? 'initializing' : 'lost', active ? 'Starting on-device pose tracking…' : 'Camera paused.'));
    return () => { mounted.current = false; };
  }, [active, onTracking]);

  return solution;
}
