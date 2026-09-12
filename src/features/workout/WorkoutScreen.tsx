import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Card, styles } from '../../components/ui';
import { WORKOUT_TARGET_REPS } from '../../config/workout';
import type { AttemptResult } from '../../contracts/attempt';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { CameraPreview } from '../tracking/CameraPreview';
import { SquatAnalyzer, type SquatPhase } from '../squat/engine';

export function WorkoutScreen() {
  const analyzer = useRef(new SquatAnalyzer({ sessionId: 'demo-session', setId: 'demo-set', selectedSide: 'left' })).current;
  const [tracking, setTracking] = useState<TrackingUpdate>({ status: 'initializing', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: 'Starting on-device pose tracking…' });
  const [phase, setPhase] = useState<SquatPhase>('CALIBRATING');
  const [reps, setReps] = useState(0);
  const [latestAttempt, setLatestAttempt] = useState<AttemptResult | null>(null);
  const interrupted = useRef(false);
  const onFrame = useCallback((frame: PoseFrame) => {
    const output = analyzer.process(frame); setPhase(output.phase);
    const attempt = output.attempts[output.attempts.length - 1];
    if (attempt) { setLatestAttempt(attempt); setReps((current) => Math.min(WORKOUT_TARGET_REPS, current + attempt.countDelta)); }
    interrupted.current = false;
  }, [analyzer]);
  const onTracking = useCallback((update: TrackingUpdate) => {
    setTracking(update);
    if ((update.status === 'lost' || update.status === 'error') && !interrupted.current) {
      const attempt = analyzer.updateTracking(null, update.monotonicTimestamp).at(-1); if (attempt) setLatestAttempt(attempt);
      setPhase(analyzer.snapshot.phase); interrupted.current = true;
    }
    if (update.status === 'tracking') interrupted.current = false;
  }, [analyzer]);
  const neutral = tracking.status === 'lost' || tracking.status === 'error';
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>SETUP / BODYWEIGHT SQUATS</Text>
    <Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Prop your phone securely. Step back until your full body and feet fit in view. Turn sideways and use a well-lit, clear space.</Text>
    <CameraPreview onFrame={onFrame} onTracking={onTracking} />
    <Card>
      <Text accessibilityLiveRegion="polite" style={styles.heading}>{neutral ? 'Neutral: tracking unavailable' : tracking.guidance ?? 'Starting pose tracking…'}</Text>
      <Text style={styles.body}>Phase: {phase}</Text>
      <Text style={styles.heading}>Reps: {reps}/{WORKOUT_TARGET_REPS}</Text>
      <Text style={styles.body}>{latestAttempt ? `Latest attempt: ${latestAttempt.rating ?? 'neutral'} — ${latestAttempt.reason}` : 'Complete a full side-view squat to receive an attempt result.'}</Text>
    </Card>
  </View>;
}
