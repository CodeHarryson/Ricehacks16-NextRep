import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, styles } from '../../components/ui';
import { SESSION_COUNTDOWN_SECONDS, WORKOUT_COMPLETION_REWARD } from '../../config/workout';
import type { AttemptResult } from '../../contracts/attempt';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { CameraPreview } from '../tracking/CameraPreview';
import { assessFaceStart, FACE_START_HOLD_FRAMES } from '../tracking/faceStartGate';
import { selectVisibleSide } from '../tracking/poseAdapter';
import { DEFAULT_RUBRIC, SquatAnalyzer, type AnalyzerOutput, type SquatPhase } from '../squat/engine';
import { grantCompletedWorkout, saveWorkoutPerformance } from '../progression/storage';
import { loadDemoUser } from '../location/identity';
import { submitChallengeResult } from '../challenge/api';
import { ChallengeResultPanel } from '../challenge/components/ChallengeResultPanel';
import { OpponentStatusCard } from '../challenge/components/OpponentStatusCard';
import { isFinalResolution } from '../challenge/resultPolling';
import { buildChallengeResultView } from '../challenge/resultView';
import { useChallengeProgress } from '../challenge/useChallengeProgress';
import { CountdownCard } from './components/CountdownCard';
import { SessionConfigCard } from './components/SessionConfigCard';
import { acceptAttempt, createWorkoutState, setRewardStatus, type SetCompleted, type WorkoutState } from './controller';
import { countdownMessage, countdownView } from './countdown';
import { DEFAULT_SOLO_SESSION, isValidWorkoutSession, type WorkoutSessionConfig } from './session';
import { advanceSessionClock, canAcceptSessionAttempt, createSessionClock, type SessionClock } from './sessionClock';
import { workoutSessionView } from './sessionView';
import { scoreAttempts, SCORE_POLICY_VERSION, type WorkoutScore } from './scoring';
import { completedSetCountAfterCompletion } from './sessionAccounting';
import { resultStatusAfter, type ResultStatus } from './finalization';

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

export function WorkoutScreen({ session, onExit }: { session?: WorkoutSessionConfig; onExit?: () => void }) {
  const validSession = session === undefined || isValidWorkoutSession(session);
  const sessionConfig = validSession ? (session ?? DEFAULT_SOLO_SESSION) : DEFAULT_SOLO_SESSION;
  const isChallenge = sessionConfig.mode === 'challenge';
  const joinedAt = useRef(Date.now());
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
  // Challenges count down from the shared server startedAt, so late joiners get only the remaining countdown.
  const clock = useRef<SessionClock>(createSessionClock(joinedAt.current, sessionConfig.matchTimeLimitSeconds, SESSION_COUNTDOWN_SECONDS, sessionConfig.startedAt ? Date.parse(sessionConfig.startedAt) : undefined));
  const [clockState, setClockState] = useState<SessionClock>(clock.current);
  const sessionStarted = clockState.started;
  const timeExpired = clockState.expired;
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState(0);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const restUntil = useRef<number | null>(null);
  const sessionAttemptKeys = useRef<string[]>([]);
  const sessionAttempts = useRef<AttemptResult[]>([]);
  const resultSubmitted = useRef(false);
  const [challengeResult, setChallengeResult] = useState<WorkoutScore | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<ResultStatus>('not_started');
  const finalizationInFlight = useRef(false);
  const challenge = useChallengeProgress({ challengeId: sessionConfig.challengeId, enabled: validSession && isChallenge, localSubmitted: resultStatus === 'submitted' });
  // The server already holds this player's result (normal submission or re-entering a finished challenge):
  // stop counting and never finalize again, so a rejoin cannot overwrite or duplicate the submission.
  const serverHasResult = isChallenge && challenge.myResult !== null;
  const serverHasResultRef = useRef(serverHasResult);
  useEffect(() => { serverHasResultRef.current = serverHasResult; }, [serverHasResult]);
  useEffect(() => {
    if (!validSession) return;
    const timer = setInterval(() => { const next = advanceSessionClock(clock.current, Date.now()); clock.current = next; setClockState(next); }, 250);
    return () => clearInterval(timer);
  }, [validSession]);
  useEffect(() => {
    if (!resting) return;
    const timer = setInterval(() => {
      if (clock.current.expired) { setResting(false); setRestRemaining(0); return; }
      const remaining = Math.max(0, (restUntil.current ?? Date.now()) - Date.now());
      setRestRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) { setResting(false); setRestRemaining(0); analyzer.current = null; selectedSide.current = null; setPhase('CALIBRATING'); }
    }, 250);
    return () => clearInterval(timer);
  }, [resting]);
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
  const finalizeSessionResult = useCallback(async (completedFully: boolean, completionEvent: SetCompleted | null) => {
    if (finalizationInFlight.current || resultStatus === 'submitted' || serverHasResultRef.current) return;
    finalizationInFlight.current = true; setResultStatus((status) => resultStatusAfter(status, 'begin')); setResultError(null);
    const startedAt = new Date(clock.current.countdownEndsAt).toISOString(); const endedAt = new Date(Math.min(Date.now(), clock.current.deadline)).toISOString();
    try {
      const challengeUser = sessionConfig.mode === 'challenge' && sessionConfig.challengeId ? await loadDemoUser() : null;
      // One performance record and idempotency key per challenge participant, even if the screen is re-entered.
      const performanceId = challengeUser ? `performance:challenge:${sessionConfig.challengeId}:${challengeUser.userId}` : `performance:${workout.current.sessionId}`;
      const score = scoreAttempts(sessionAttempts.current, sessionConfig.setCount * sessionConfig.targetReps); setChallengeResult(score);
      await saveWorkoutPerformance({ performanceId, workoutId: performanceId, mode: sessionConfig.mode, exercise: sessionConfig.exercise, setCount: sessionConfig.setCount, targetReps: sessionConfig.targetReps, matchDurationSeconds: sessionConfig.matchTimeLimitSeconds, startedAt, endedAt, ...score });
      setResultStatus((status) => resultStatusAfter(status, 'local_saved'));
      if (challengeUser && sessionConfig.challengeId) {
        setResultStatus((status) => resultStatusAfter(status, 'submission_started'));
        await submitChallengeResult(challengeUser.userId, sessionConfig.challengeId, { configVersion: sessionConfig.configVersion ?? 1, exercise: sessionConfig.exercise, greenReps: score.greenReps, yellowReps: score.yellowReps, redAttempts: score.redAttempts, neutralAttempts: score.neutralAttempts, startedAt, endedAt, idempotencyKey: performanceId });
        resultSubmitted.current = true; setResultStatus((status) => resultStatusAfter(status, 'submitted'));
      } else if (completedFully && completionEvent) await persistCompletion(completionEvent, sessionAttemptKeys.current);
    } catch (caught) { setResultError(caught instanceof Error ? caught.message : 'Could not save workout result.'); setResultStatus((status) => resultStatusAfter(status, 'failed')); }
    finally { finalizationInFlight.current = false; }
  }, [persistCompletion, resultStatus, sessionConfig.challengeId, sessionConfig.configVersion, sessionConfig.exercise, sessionConfig.matchTimeLimitSeconds, sessionConfig.mode, sessionConfig.setCount, sessionConfig.targetReps]);
  useEffect(() => { if (timeExpired && resultStatus === 'not_started' && !serverHasResult) void finalizeSessionResult(false, null); }, [finalizeSessionResult, resultStatus, serverHasResult, timeExpired]);
  const consumeAttempts = useCallback((attempts: readonly AttemptResult[]) => {
    for (const attempt of attempts) {
      if (resting || serverHasResultRef.current || !canAcceptSessionAttempt(clock.current, attempt.endedAt)) continue;
      const accepted = acceptAttempt(workout.current, attempt);
      if (accepted.state === workout.current) continue;
      sessionAttempts.current.push(attempt);
      workout.current = accepted.state;
      setWorkoutState(accepted.state);
      if (accepted.completion) {
        completion.current = accepted.completion;
        sessionAttemptKeys.current = [...sessionAttemptKeys.current, ...accepted.state.processedAttemptKeys.filter((key) => !sessionAttemptKeys.current.includes(key))];
        if (currentSet < sessionConfig.setCount && !clock.current.expired) {
          setCompletedSets((value) => completedSetCountAfterCompletion(value, sessionConfig.setCount)); setCurrentSet((value) => value + 1); setResting(sessionConfig.restSeconds > 0); restUntil.current = Date.now() + sessionConfig.restSeconds * 1000;
          workout.current = createWorkoutState(workout.current.sessionId, `squat-set-${workout.current.sessionId}-${currentSet + 1}`, sessionConfig.targetReps); setWorkoutState(workout.current); analyzer.current = null; selectedSide.current = null; setPhase('CALIBRATING');
        } else {
          setCompletedSets(sessionConfig.setCount);
          void finalizeSessionResult(true, accepted.completion);
        }
      }
    }
  }, [currentSet, finalizeSessionResult, resting, sessionConfig.restSeconds, sessionConfig.setCount, sessionConfig.targetReps]);
  const onFrame = useCallback((frame: PoseFrame) => {
    if (resting || serverHasResultRef.current || !canAcceptSessionAttempt(clock.current, Date.now()) || workout.current.status === 'complete') return;
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
  }, [consumeAttempts, resting]);
  const retryReward = useCallback(() => {
    if (completion.current === null) return;
    workout.current = setRewardStatus(workout.current, 'pending');
    setWorkoutState(workout.current);
    void persistCompletion(completion.current, workout.current.processedAttemptKeys);
  }, [persistCompletion]);
  const onTracking = useCallback((update: TrackingUpdate) => {
    if (resting || !canAcceptSessionAttempt(clock.current, Date.now())) return;
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
  }, [consumeAttempts, resting]);
  const neutral = tracking.status === 'lost' || tracking.status === 'error' || analysisNeutral;
  if (!validSession) return <Card><Text style={styles.heading}>Workout configuration unavailable</Text><Text style={styles.body}>The challenge configuration is malformed. Camera session not started.</Text>{onExit && <Action title="Return to map" onPress={onExit} />}</Card>;
  const view = workoutSessionView(sessionConfig);
  const countdown = countdownView(clockState, Date.now(), joinedAt.current, SESSION_COUNTDOWN_SECONDS);
  const snapshot = challenge.poll.snapshot;
  const showResultPanel = isChallenge && (resultStatus === 'submitted' || serverHasResult || isFinalResolution(snapshot));
  const resultView = showResultPanel ? buildChallengeResultView({ userId: challenge.userId, results: snapshot?.results ?? [], resolution: snapshot?.resolution ?? { status: 'pending' }, localScore: challengeResult, opponentName: view.opponentName ?? undefined }) : null;
  const sessionPhase = timeExpired ? 'expired' : workoutState.status === 'complete' || showResultPanel ? 'completed' : resting ? 'rest' : sessionStarted ? 'active' : 'countdown';
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>{view.eyebrow}</Text>
    <Text style={styles.title}>Find your space.</Text>
    <SessionConfigCard view={view} setCount={sessionConfig.setCount} currentSet={currentSet} completedSets={completedSets} />
    {challenge.identityError && <Card><Text style={styles.heading}>Challenge unavailable</Text><Text style={styles.body}>{challenge.identityError}</Text></Card>}
    {view.showOpponentStatus && !showResultPanel && <OpponentStatusCard opponentName={view.opponentName} status={challenge.opponentStatus} error={challenge.poll.error} onRetry={challenge.retryPolling} />}
    {(sessionPhase === 'countdown' || sessionPhase === 'active' || (sessionPhase === 'expired' && !showResultPanel)) && <CountdownCard view={countdown} message={countdownMessage(countdown, isChallenge, view.opponentName ?? undefined)} />}
    {sessionPhase === 'rest' && <Card><Text style={styles.heading}>Rest before set {currentSet}</Text><Text style={styles.body}>Next set in {restRemaining}s</Text></Card>}
    {resultView && <ChallengeResultPanel view={resultView} pollError={challenge.poll.error} rewardStatus={challenge.rewardStatus} onRetryPolling={challenge.retryPolling} onRetryReward={challenge.retryReward} onReturnToMap={onExit} />}
    {sessionStarted && !timeExpired && !resting && !showResultPanel && <><Text style={styles.body}>{faceLocked ? 'Step back until your full body and feet fit in view, then turn sideways.' : 'First, center your face in the camera oval and hold still to activate this workout.'}</Text><CameraPreview faceStartActive={!faceLocked} onFrame={onFrame} onTracking={onTracking} /></>}
    <Card>
      <Text accessibilityLiveRegion="polite" style={styles.heading}>{neutral ? `Neutral: ${tracking.status === 'tracking' ? analysisGuidance : tracking.guidance}` : analysisGuidance}</Text>
      <Text style={styles.body}>Face start: {faceLocked ? 'confirmed' : `${faceProgress}/${FACE_START_HOLD_FRAMES}`}</Text>
      <Text style={styles.body}>Visible side: {selectedSide.current ?? 'not selected yet'}</Text>
      <Text style={styles.body}>Phase: {phase}</Text>
      <Text style={styles.body}>Movement range: {measurement ? `${measurement.rangeFromStandingDeg.toFixed(1)}°` : '—'} (minimum {DEFAULT_RUBRIC.minimumRangeDeg}°)</Text>
      <Text style={styles.body}>Tracking detail: {trackingDetail}</Text>
      <Text style={styles.heading}>Reps: {workoutState.reps}/{workoutState.targetReps}</Text>
      {timeExpired && <Text style={styles.heading} accessibilityLiveRegion="polite">Time expired — reps counted before the deadline are preserved.</Text>}
      {resultStatus === 'saving' && <Text style={styles.heading}>Calculating score…</Text>}
      {resultStatus === 'saved' && <Text style={styles.heading}>Score saved locally.</Text>}
      {resultStatus === 'submission_pending' && <Text style={styles.heading}>Submitting challenge result…</Text>}
      {resultStatus === 'submitted' && <Text style={styles.heading}>Challenge result submitted.</Text>}
      {serverHasResult && resultStatus !== 'submitted' && <Text style={styles.heading}>Challenge result already confirmed by the server.</Text>}
      {challengeResult && !showResultPanel && <Card><Text style={styles.heading}>{isChallenge ? 'Challenge score' : 'Solo score'}</Text><Text style={styles.body}>{challengeResult.totalScore} points · {challengeResult.countedReps}/{challengeResult.cappedTargetReps} counted reps · {challengeResult.greenReps} green · {challengeResult.yellowReps} yellow</Text><Text style={styles.body}>Policy: {SCORE_POLICY_VERSION}{isChallenge ? ' · Local score is being prepared.' : ''}</Text></Card>}
      {resultError && !serverHasResult && !isFinalResolution(snapshot) && <Card><Text style={styles.body}>Result save failed: {resultError}</Text><Action title="Retry result save" onPress={() => { void finalizeSessionResult(workoutState.status === 'complete', completion.current); }} /></Card>}
      <Text style={styles.body}>Session phase: {sessionPhase} · Set status: {workoutState.status === 'complete' ? 'complete' : 'active'} · Reward: {workoutState.rewardStatus}</Text>
      <Text style={styles.body}>{workoutState.lastAttempt ? `Latest attempt: ${workoutState.lastAttempt.rating ?? 'neutral'} — ${workoutState.lastAttempt.reason}` : 'Complete a full side-view squat to receive an attempt result.'}</Text>
      {workoutState.status === 'complete' && <Text style={styles.heading} accessibilityLiveRegion="polite">Set complete{sessionConfig.mode === 'challenge' ? resultStatus === 'submitted' || serverHasResult ? ' — challenge result submitted.' : ' — local score is being prepared.' : workoutState.rewardStatus === 'granted' ? ` — ${WORKOUT_COMPLETION_REWARD.xp} XP and +${WORKOUT_COMPLETION_REWARD.overallRatingDelta} OVR saved locally.` : workoutState.rewardStatus === 'failed' ? ' — reward save failed; repeat delivery can retry safely.' : ' — saving reward…'}</Text>}
      {workoutState.rewardStatus === 'failed' && <Action title="Retry reward save" onPress={retryReward} />}
    </Card>
  </View>;
}
