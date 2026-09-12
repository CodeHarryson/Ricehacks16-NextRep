import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, styles } from '../../components/ui';
import { WORKOUT_COMPLETION_REWARD } from '../../config/workout';
import type { AttemptResult } from '../../contracts/attempt';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { CameraPreview } from '../tracking/CameraPreview';
import { assessFaceStart, FACE_START_HOLD_FRAMES } from '../tracking/faceStartGate';
import { selectVisibleSide } from '../tracking/poseAdapter';
import { DEFAULT_RUBRIC, SquatAnalyzer, type AnalyzerOutput, type SquatPhase } from '../squat/engine';
import { grantCompletedWorkout } from '../progression/storage';
import { acceptAttempt, createWorkoutState, setRewardStatus, type SetCompleted, type WorkoutState } from './controller';
import { DEFAULT_SOLO_SESSION, isValidWorkoutSession, type WorkoutSessionConfig } from './session';

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

export function WorkoutScreen({ session }: { session?: WorkoutSessionConfig }) {
  const validSession = session === undefined || isValidWorkoutSession(session);
  const sessionConfig = validSession ? (session ?? DEFAULT_SOLO_SESSION) : DEFAULT_SOLO_SESSION;
  const workoutIds = useRef<{ sessionId: string; setId: string } | null>(null);
  if (workoutIds.current === null) {
    const sessionId = `squat-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    workoutIds.current = { sessionId, setId: `squat-set-${sessionId}` };
  }
  const analyzer = useRef<SquatAnalyzer | null>(null);
  const selectedSide = useRef<'left' | 'right' | null>(null);
  const faceLockedRef = useRef(false);
  const faceHoldFrames = useRef(0);
  const [faceLocked, setFaceLocked] = useState(false);
  const [faceProgress, setFaceProgress] = useState(0);
  const [tracking, setTracking] = useState<TrackingUpdate>({ status: 'initializing', observedAt: Date.now(), timestampUnit: 'milliseconds', clock: 'unix', guidance: 'Starting on-device pose tracking…' });
  const [phase, setPhase] = useState<SquatPhase>('CALIBRATING');
  const workout = useRef<WorkoutState>(createWorkoutState(workoutIds.current.sessionId, workoutIds.current.setId, sessionConfig.targetReps));
  const [workoutState, setWorkoutState] = useState<WorkoutState>(workout.current);
  const rewardInFlight = useRef(false);
  const completion = useRef<SetCompleted | null>(null);
  const [analysisGuidance, setAnalysisGuidance] = useState('Center your face in the oval to start.');
  const [analysisNeutral, setAnalysisNeutral] = useState(true);
  const [measurement, setMeasurement] = useState<AnalyzerOutput['feature']>(null);
  const [trackingDetail, setTrackingDetail] = useState('Waiting for accepted landmarks.');
  const interrupted = useRef(false);
  const [countdown, setCountdown] = useState(10);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(sessionConfig.matchTimeLimitSeconds);
  const [timeExpired, setTimeExpired] = useState(false);
  const deadline = useRef<number | null>(null);
  useEffect(() => {
    if (!validSession) return;
    setCountdown(10); setSessionStarted(false); setTimeExpired(false); setTimeRemaining(sessionConfig.matchTimeLimitSeconds); deadline.current = null;
    const timer = setInterval(() => setCountdown((value) => { if (value <= 1) { setSessionStarted(true); deadline.current = Date.now() + sessionConfig.matchTimeLimitSeconds * 1000; return 0; } return value - 1; }), 1000);
    return () => clearInterval(timer);
  }, [validSession, sessionConfig.matchTimeLimitSeconds]);
  useEffect(() => {
    if (!sessionStarted || !validSession) return;
    const timer = setInterval(() => { const remaining = Math.max(0, (deadline.current ?? Date.now()) - Date.now()); setTimeRemaining(Math.ceil(remaining / 1000)); if (remaining <= 0) { setTimeExpired(true); clearInterval(timer); } }, 250);
    return () => clearInterval(timer);
  }, [sessionStarted, validSession]);
  const persistCompletion = useCallback(async (completion: SetCompleted, attemptKeys: readonly string[]) => {
    if (rewardInFlight.current) return;
    rewardInFlight.current = true;
    try {
      await grantCompletedWorkout({
        workoutId: completion.completionId,
        rewardId: completion.rewardId,
        attemptKeys,
        ...WORKOUT_COMPLETION_REWARD,
      });
      workout.current = setRewardStatus(workout.current, 'granted');
      setWorkoutState(workout.current);
    } catch {
      workout.current = setRewardStatus(workout.current, 'failed');
      setWorkoutState(workout.current);
    } finally {
      rewardInFlight.current = false;
    }
  }, []);
  const consumeAttempts = useCallback((attempts: readonly AttemptResult[]) => {
    for (const attempt of attempts) {
      const accepted = acceptAttempt(workout.current, attempt);
      if (accepted.state === workout.current) continue;
      workout.current = accepted.state;
      setWorkoutState(accepted.state);
      if (accepted.completion) {
        completion.current = accepted.completion;
        if (sessionConfig.mode === 'solo') void persistCompletion(accepted.completion, accepted.state.processedAttemptKeys);
      }
    }
  }, [persistCompletion, sessionConfig.mode]);
  const onFrame = useCallback((frame: PoseFrame) => {
    if (!sessionStarted || timeExpired || workout.current.status === 'complete') return;
    if (!faceLockedRef.current) {
      const face = assessFaceStart(frame);
      faceHoldFrames.current = face.ready ? faceHoldFrames.current + 1 : 0;
      setFaceProgress(Math.min(faceHoldFrames.current, FACE_START_HOLD_FRAMES));
      setAnalysisGuidance(face.guidance);
      setTrackingDetail(face.ready ? 'Face placement accepted; hold still.' : 'Waiting for face placement.');
      setAnalysisNeutral(true);
      if (faceHoldFrames.current >= FACE_START_HOLD_FRAMES) {
        faceLockedRef.current = true;
        setFaceLocked(true);
        setAnalysisGuidance('Start confirmed. Step back until your full body is visible, then turn sideways.');
        setTrackingDetail('Session activated; waiting for full-body landmarks.');
      }
      return;
    }
    if (selectedSide.current === null) {
      selectedSide.current = selectVisibleSide(frame);
      if (selectedSide.current === null) {
        setAnalysisGuidance('Step back until your shoulder, hip, knee, ankle, and feet are all visible.');
        setAnalysisNeutral(true);
        return;
      }
      analyzer.current = new SquatAnalyzer({ sessionId: workout.current.sessionId, setId: workout.current.setId, selectedSide: selectedSide.current });
    }
    const activeAnalyzer = analyzer.current;
    if (activeAnalyzer === null) return;
    const output = activeAnalyzer.process({ ...frame, view: selectedSide.current });
    setPhase(output.phase);
    setMeasurement(output.feature);
    setTrackingDetail(output.rejectedReason ?? 'Landmarks accepted.');
    setAnalysisGuidance(guidanceForOutput(output.phase, output.rejectedReason));
    setAnalysisNeutral(output.tracking !== 'tracking' || output.rejectedReason !== null);
    consumeAttempts(output.attempts);
    interrupted.current = false;
  }, [consumeAttempts, sessionStarted, timeExpired]);
  const retryReward = useCallback(() => {
    if (completion.current === null) return;
    workout.current = setRewardStatus(workout.current, 'pending');
    setWorkoutState(workout.current);
    void persistCompletion(completion.current, workout.current.processedAttemptKeys);
  }, [persistCompletion]);
  const onTracking = useCallback((update: TrackingUpdate) => {
    if (!sessionStarted || timeExpired) return;
    setTracking(update);
    if (!faceLockedRef.current && update.status !== 'tracking') {
      faceHoldFrames.current = 0;
      setFaceProgress(0);
    }
    if ((update.status === 'lost' || update.status === 'error') && !interrupted.current) {
      const attempts = analyzer.current?.updateTracking(null, update.monotonicTimestamp) ?? [];
      consumeAttempts(attempts);
      if (analyzer.current) setPhase(analyzer.current.snapshot.phase);
      setAnalysisNeutral(true); interrupted.current = true;
    }
    if (update.status === 'tracking') interrupted.current = false;
  }, [consumeAttempts, sessionStarted, timeExpired]);
  const neutral = tracking.status === 'lost' || tracking.status === 'error' || analysisNeutral;
  if (!validSession) return <Card><Text style={styles.heading}>Workout configuration unavailable</Text><Text style={styles.body}>The challenge configuration is malformed. Camera session not started.</Text></Card>;
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>{sessionConfig.mode === 'challenge' ? 'CHALLENGE / SHARED SQUATS' : 'SETUP / BODYWEIGHT SQUATS'}</Text>
    <Text style={styles.title}>Find your space.</Text>
    {sessionStarted ? <Text style={styles.body}>Time remaining: {timeRemaining}s</Text> : <Card><Text style={styles.title}>{countdown}</Text><Text style={styles.body}>Get ready. Pose tracking starts when the countdown reaches zero.</Text></Card>}
    {sessionStarted && !timeExpired && <><Text style={styles.body}>{faceLocked ? 'Step back until your full body and feet fit in view, then turn sideways.' : 'First, center your face in the camera oval and hold still to activate this workout.'}</Text><CameraPreview faceStartActive={!faceLocked} onFrame={onFrame} onTracking={onTracking} /></>}
    <Card>
      <Text accessibilityLiveRegion="polite" style={styles.heading}>{neutral ? `Neutral: ${tracking.status === 'tracking' ? analysisGuidance : tracking.guidance}` : analysisGuidance}</Text>
      <Text style={styles.body}>Face start: {faceLocked ? 'confirmed' : `${faceProgress}/${FACE_START_HOLD_FRAMES}`}</Text>
      <Text style={styles.body}>Visible side: {selectedSide.current ?? 'not selected yet'}</Text>
      <Text style={styles.body}>Phase: {phase}</Text>
      <Text style={styles.body}>Movement range: {measurement ? `${measurement.rangeFromStandingDeg.toFixed(1)}°` : '—'} (minimum {DEFAULT_RUBRIC.minimumRangeDeg}°)</Text>
      <Text style={styles.body}>Tracking detail: {trackingDetail}</Text>
      <Text style={styles.heading}>Reps: {workoutState.reps}/{workoutState.targetReps}</Text>
      <Text style={styles.body}>Configuration: {sessionConfig.setCount} set · {sessionConfig.targetReps} reps · {sessionConfig.restSeconds}s rest{sessionConfig.mode === 'challenge' ? ` · challenge ${sessionConfig.challengeId}` : ''}</Text>
      {timeExpired && <Text style={styles.heading} accessibilityLiveRegion="polite">Time expired — reps counted before the deadline are preserved.</Text>}
      <Text style={styles.body}>Set: {workoutState.status === 'complete' ? 'complete' : 'active'} · Reward: {workoutState.rewardStatus}</Text>
      <Text style={styles.body}>{workoutState.lastAttempt ? `Latest attempt: ${workoutState.lastAttempt.rating ?? 'neutral'} — ${workoutState.lastAttempt.reason}` : 'Complete a full side-view squat to receive an attempt result.'}</Text>
      {workoutState.status === 'complete' && <Text style={styles.heading} accessibilityLiveRegion="polite">Set complete{sessionConfig.mode === 'challenge' ? ' — challenge results are not synchronized yet.' : workoutState.rewardStatus === 'granted' ? ` — ${WORKOUT_COMPLETION_REWARD.xp} XP and +${WORKOUT_COMPLETION_REWARD.overallRatingDelta} OVR saved locally.` : workoutState.rewardStatus === 'failed' ? ' — reward save failed; repeat delivery can retry safely.' : ' — saving reward…'}</Text>}
      {workoutState.rewardStatus === 'failed' && <Action title="Retry reward save" onPress={retryReward} />}
    </Card>
  </View>;
}
