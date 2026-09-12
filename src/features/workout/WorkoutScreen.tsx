import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Card, styles } from '../../components/ui';
import { WORKOUT_TARGET_REPS } from '../../config/workout';
import type { AttemptResult } from '../../contracts/attempt';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { CameraPreview } from '../tracking/CameraPreview';
import { selectVisibleSide } from '../tracking/poseAdapter';
import { SquatAnalyzer, type SquatPhase } from '../squat/engine';

function guidanceForOutput(phase: SquatPhase, rejectedReason: string | null): string {
  if (rejectedReason?.includes('visibility') || rejectedReason?.includes('framing') || rejectedReason?.includes('missing')) {
    return 'Step back until your shoulder, hip, knee, ankle, and feet are all visible.';
  }
  if (rejectedReason?.includes('side view') || rejectedReason?.includes('unlocked side')) {
    return 'Turn sideways to the camera and keep one complete side visible.';
  }
  if (rejectedReason?.includes('jump') || rejectedReason?.includes('gap') || rejectedReason?.includes('reacquiring')) {
    return 'Tracking was interrupted. Stand still and upright to resume.';
  }
  if (phase === 'CALIBRATING') return 'Stand upright and sideways; hold still while standing is calibrated.';
  if (phase === 'READY') return 'Body visible. Begin a controlled squat when ready.';
  if (phase === 'DESCENDING') return 'Squat detected: continue downward to the minimum target.';
  if (phase === 'MINIMUM_RANGE_REACHED') return 'Minimum range reached. Return to standing.';
  return 'Return to a stable upright position to finish the rep.';
}

export function WorkoutScreen() {
  const analyzer = useRef<SquatAnalyzer | null>(null);
  const selectedSide = useRef<'left' | 'right' | null>(null);
  const [tracking, setTracking] = useState<TrackingUpdate>({ status: 'initializing', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: 'Starting on-device pose tracking…' });
  const [phase, setPhase] = useState<SquatPhase>('CALIBRATING');
  const [reps, setReps] = useState(0);
  const [latestAttempt, setLatestAttempt] = useState<AttemptResult | null>(null);
  const [analysisGuidance, setAnalysisGuidance] = useState('Step back until your full body is visible, then turn sideways.');
  const [analysisNeutral, setAnalysisNeutral] = useState(true);
  const interrupted = useRef(false);
  const onFrame = useCallback((frame: PoseFrame) => {
    if (selectedSide.current === null) {
      selectedSide.current = selectVisibleSide(frame);
      if (selectedSide.current === null) {
        setAnalysisGuidance('Step back until your shoulder, hip, knee, ankle, and feet are all visible.');
        setAnalysisNeutral(true);
        return;
      }
      analyzer.current = new SquatAnalyzer({ sessionId: 'demo-session', setId: 'demo-set', selectedSide: selectedSide.current });
    }
    const activeAnalyzer = analyzer.current;
    if (activeAnalyzer === null) return;
    const output = activeAnalyzer.process({ ...frame, view: selectedSide.current });
    setPhase(output.phase);
    setAnalysisGuidance(guidanceForOutput(output.phase, output.rejectedReason));
    setAnalysisNeutral(output.tracking !== 'tracking' || output.rejectedReason !== null);
    const attempt = output.attempts[output.attempts.length - 1];
    if (attempt) { setLatestAttempt(attempt); setReps((current) => Math.min(WORKOUT_TARGET_REPS, current + attempt.countDelta)); }
    interrupted.current = false;
  }, []);
  const onTracking = useCallback((update: TrackingUpdate) => {
    setTracking(update);
    if ((update.status === 'lost' || update.status === 'error') && !interrupted.current) {
      const attempt = analyzer.current?.updateTracking(null, update.monotonicTimestamp).at(-1); if (attempt) setLatestAttempt(attempt);
      if (analyzer.current) setPhase(analyzer.current.snapshot.phase);
      setAnalysisNeutral(true); interrupted.current = true;
    }
    if (update.status === 'tracking') interrupted.current = false;
  }, []);
  const neutral = tracking.status === 'lost' || tracking.status === 'error' || analysisNeutral;
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>SETUP / BODYWEIGHT SQUATS</Text>
    <Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Prop your phone securely. Step back until your full body and feet fit in view. Turn sideways and use a well-lit, clear space.</Text>
    <CameraPreview onFrame={onFrame} onTracking={onTracking} />
    <Card>
      <Text accessibilityLiveRegion="polite" style={styles.heading}>{neutral ? `Neutral: ${tracking.status === 'tracking' ? analysisGuidance : tracking.guidance}` : analysisGuidance}</Text>
      <Text style={styles.body}>Visible side: {selectedSide.current ?? 'not selected yet'}</Text>
      <Text style={styles.body}>Phase: {phase}</Text>
      <Text style={styles.heading}>Reps: {reps}/{WORKOUT_TARGET_REPS}</Text>
      <Text style={styles.body}>{latestAttempt ? `Latest attempt: ${latestAttempt.rating ?? 'neutral'} — ${latestAttempt.reason}` : 'Complete a full side-view squat to receive an attempt result.'}</Text>
    </Card>
  </View>;
}
