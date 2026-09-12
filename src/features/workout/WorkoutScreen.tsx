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
import { grantBattleReward, grantCompletedWorkout, saveWorkoutPerformance } from '../progression/storage';
import { loadDemoUser } from '../location/identity';
import { getChallengeResults, submitChallengeResult, type ChallengeResolution, type ChallengeResult } from '../challenge/api';
import { acceptAttempt, createWorkoutState, setRewardStatus, type SetCompleted, type WorkoutState } from './controller';
import { DEFAULT_SOLO_SESSION, isValidWorkoutSession, type WorkoutSessionConfig } from './session';
import { advanceSessionClock, canAcceptSessionAttempt, createSessionClock, type SessionClock } from './sessionClock';
import { scoreAttempts, SCORE_POLICY_VERSION, type WorkoutScore } from './scoring';
import { completedSetCountAfterCompletion } from './sessionAccounting';
import { resultStatusAfter, type ResultStatus } from './finalization';
import { BATTLE_REWARD_POLICY_VERSION, BATTLE_REWARDS, type BattleOutcome } from '../challenge/rewards';

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
  const clock = useRef<SessionClock>(createSessionClock(Date.now(), sessionConfig.matchTimeLimitSeconds, 10, sessionConfig.startedAt ? Date.parse(sessionConfig.startedAt) : undefined));
  const [clockState, setClockState] = useState<SessionClock>(clock.current);
  const sessionStarted = clockState.started;
  const timeExpired = clockState.expired;
  const countdown = Math.max(0, Math.ceil((clockState.countdownEndsAt - Date.now()) / 1000));
  const timeRemaining = clockState.remainingSeconds;
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
  const [opponentResult, setOpponentResult] = useState<ChallengeResult | null>(null);
  const [resolution, setResolution] = useState<ChallengeResolution>({ status: 'pending' });
  const [resultStatus, setResultStatus] = useState<ResultStatus>('not_started');
  const finalizationInFlight = useRef(false);
  const battleRewardInFlight = useRef(false);
  const battleRewardGranted = useRef(false);
  const [battleRewardStatus, setBattleRewardStatus] = useState<'pending' | 'saved' | 'failed'>('pending');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
  useEffect(() => {
    if (sessionConfig.mode !== 'challenge' || !sessionConfig.challengeId || !challengeResult) return;
    let cancelled = false;
    const poll = async () => { try { const user = await loadDemoUser(); const response = await getChallengeResults(user.userId, sessionConfig.challengeId!); if (!cancelled) { setCurrentUserId(user.userId); setOpponentResult(response.results.find((item) => item.participantId !== user.userId) ?? null); setResolution(response.resolution); if (response.resolution.status === 'resolved' && !battleRewardGranted.current && !battleRewardInFlight.current) { battleRewardInFlight.current = true; const outcome: BattleOutcome = response.resolution.winnerId === null ? 'draw' : response.resolution.winnerId === user.userId ? 'winner' : 'loser'; void grantBattleReward({ challengeId: sessionConfig.challengeId!, participantId: user.userId, outcome, ...BATTLE_REWARDS[outcome], rewardPolicyVersion: BATTLE_REWARD_POLICY_VERSION }).then(() => { battleRewardGranted.current = true; setBattleRewardStatus('saved'); }).catch(() => setBattleRewardStatus('failed')).finally(() => { battleRewardInFlight.current = false; }); } } } catch { /* retry on the next poll */ } };
    void poll(); const timer = setInterval(() => { void poll(); }, 5000); return () => { cancelled = true; clearInterval(timer); };
  }, [challengeResult, sessionConfig.challengeId, sessionConfig.mode]);
  const retryBattleReward = () => { if (!currentUserId || !sessionConfig.challengeId || resolution.status !== 'resolved' || battleRewardInFlight.current) return; const outcome: BattleOutcome = resolution.winnerId === null ? 'draw' : resolution.winnerId === currentUserId ? 'winner' : 'loser'; battleRewardInFlight.current = true; setBattleRewardStatus('pending'); void grantBattleReward({ challengeId: sessionConfig.challengeId, participantId: currentUserId, outcome, ...BATTLE_REWARDS[outcome], rewardPolicyVersion: BATTLE_REWARD_POLICY_VERSION }).then(() => { battleRewardGranted.current = true; setBattleRewardStatus('saved'); }).catch(() => setBattleRewardStatus('failed')).finally(() => { battleRewardInFlight.current = false; }); };
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
    if (finalizationInFlight.current || resultStatus === 'submitted') return;
    finalizationInFlight.current = true; setResultStatus((status) => resultStatusAfter(status, 'begin')); setResultError(null);
    const performanceId = `performance:${workout.current.sessionId}`;
    const startedAt = new Date(clock.current.countdownEndsAt).toISOString(); const endedAt = new Date(Math.min(Date.now(), clock.current.deadline)).toISOString();
    try {
      const score = scoreAttempts(sessionAttempts.current, sessionConfig.setCount * sessionConfig.targetReps); setChallengeResult(score);
      await saveWorkoutPerformance({ performanceId, workoutId: performanceId, mode: sessionConfig.mode, exercise: sessionConfig.exercise, setCount: sessionConfig.setCount, targetReps: sessionConfig.targetReps, matchDurationSeconds: sessionConfig.matchTimeLimitSeconds, startedAt, endedAt, ...score });
      setResultStatus((status) => resultStatusAfter(status, 'local_saved'));
      if (sessionConfig.mode === 'challenge' && sessionConfig.challengeId) {
        setResultStatus((status) => resultStatusAfter(status, 'submission_started')); const user = await loadDemoUser();
        await submitChallengeResult(user.userId, sessionConfig.challengeId, { configVersion: sessionConfig.configVersion ?? 1, exercise: sessionConfig.exercise, greenReps: score.greenReps, yellowReps: score.yellowReps, redAttempts: score.redAttempts, neutralAttempts: score.neutralAttempts, startedAt, endedAt, idempotencyKey: performanceId });
        resultSubmitted.current = true; setResultStatus((status) => resultStatusAfter(status, 'submitted'));
      } else if (completedFully && completionEvent) await persistCompletion(completionEvent, sessionAttemptKeys.current);
    } catch (caught) { setResultError(caught instanceof Error ? caught.message : 'Could not save workout result.'); setResultStatus((status) => resultStatusAfter(status, 'failed')); }
    finally { finalizationInFlight.current = false; }
  }, [persistCompletion, resultStatus, sessionConfig.challengeId, sessionConfig.configVersion, sessionConfig.exercise, sessionConfig.matchTimeLimitSeconds, sessionConfig.mode, sessionConfig.setCount, sessionConfig.targetReps]);
  useEffect(() => { if (timeExpired && resultStatus === 'not_started') void finalizeSessionResult(false, null); }, [finalizeSessionResult, resultStatus, timeExpired]);
  const consumeAttempts = useCallback((attempts: readonly AttemptResult[]) => {
    for (const attempt of attempts) {
      if (resting || !canAcceptSessionAttempt(clock.current, attempt.endedAt)) continue;
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
    if (resting || !canAcceptSessionAttempt(clock.current, Date.now()) || workout.current.status === 'complete') return;
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
  const sessionPhase = timeExpired ? 'expired' : workoutState.status === 'complete' ? 'completed' : resting ? 'rest' : sessionStarted ? 'active' : 'countdown';
  if (!validSession) return <Card><Text style={styles.heading}>Workout configuration unavailable</Text><Text style={styles.body}>The challenge configuration is malformed. Camera session not started.</Text></Card>;
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>{sessionConfig.mode === 'challenge' ? 'CHALLENGE / SHARED SQUATS' : 'SETUP / BODYWEIGHT SQUATS'}</Text>
    <Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Mode: {sessionConfig.mode} · Set {Math.min(currentSet, sessionConfig.setCount)}/{sessionConfig.setCount} · Completed sets: {completedSets}</Text>
    {sessionPhase === 'countdown' && <Card><Text style={styles.title}>{countdown}</Text><Text style={styles.body}>Get ready. Pose tracking starts when the countdown reaches zero.</Text></Card>}
    {sessionPhase === 'active' && <Text style={styles.body}>Time remaining: {timeRemaining}s</Text>}
    {sessionPhase === 'rest' && <Card><Text style={styles.heading}>Rest before set {currentSet}</Text><Text style={styles.body}>Next set in {restRemaining}s</Text></Card>}
    {sessionPhase === 'expired' && <Text style={styles.heading}>Session expired — no new reps are accepted.</Text>}
    {sessionStarted && !timeExpired && !resting && <><Text style={styles.body}>{faceLocked ? 'Step back until your full body and feet fit in view, then turn sideways.' : 'First, center your face in the camera oval and hold still to activate this workout.'}</Text><CameraPreview faceStartActive={!faceLocked} onFrame={onFrame} onTracking={onTracking} /></>}
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
      {resultStatus === 'saving' && <Text style={styles.heading}>Calculating score…</Text>}
      {resultStatus === 'saved' && <Text style={styles.heading}>Score saved locally.</Text>}
      {resultStatus === 'submission_pending' && <Text style={styles.heading}>Submitting challenge result…</Text>}
      {resultStatus === 'submitted' && <Text style={styles.heading}>Challenge result submitted.</Text>}
      {challengeResult && <Card><Text style={styles.heading}>{sessionConfig.mode === 'challenge' ? 'Challenge score' : 'Solo score'}</Text><Text style={styles.body}>{challengeResult.totalScore} points · {challengeResult.countedReps}/{challengeResult.cappedTargetReps} counted reps · {challengeResult.greenReps} green · {challengeResult.yellowReps} yellow</Text><Text style={styles.body}>Policy: {SCORE_POLICY_VERSION}{sessionConfig.mode === 'challenge' ? ' · Server resolution pending.' : ''}</Text></Card>}
      {sessionConfig.mode === 'challenge' && resultStatus === 'submitted' && <Card><Text style={styles.heading}>{resolution.status !== 'resolved' ? 'Waiting for opponent result…' : resolution.winnerId === null ? 'Draw' : resolution.winnerId === currentUserId ? 'Victory' : 'Defeat'}</Text><Text style={styles.body}>Your score: {challengeResult?.totalScore ?? 0}{opponentResult ? ` · Opponent: ${opponentResult.totalScore}` : ''}{resolution.status === 'resolved' ? ` · Winning score: ${resolution.winningScore ?? 0}` : ''}</Text>{resolution.status === 'resolved' && <><Text style={styles.body}>Reward: {battleRewardStatus === 'saved' ? 'Reward saved' : battleRewardStatus === 'failed' ? 'Reward save failed' : 'Reward pending'}</Text>{battleRewardStatus === 'failed' && <Action title="Retry battle reward" onPress={retryBattleReward} />}</>}</Card>}
      {resultError && <Card><Text style={styles.body}>Result save failed: {resultError}</Text><Action title="Retry result save" onPress={() => { void finalizeSessionResult(workoutState.status === 'complete', completion.current); }} /></Card>}
      <Text style={styles.body}>Session phase: {sessionPhase} · Set status: {workoutState.status === 'complete' ? 'complete' : 'active'} · Reward: {workoutState.rewardStatus}</Text>
      <Text style={styles.body}>{workoutState.lastAttempt ? `Latest attempt: ${workoutState.lastAttempt.rating ?? 'neutral'} — ${workoutState.lastAttempt.reason}` : 'Complete a full side-view squat to receive an attempt result.'}</Text>
      {workoutState.status === 'complete' && <Text style={styles.heading} accessibilityLiveRegion="polite">Set complete{sessionConfig.mode === 'challenge' ? resultStatus === 'submitted' ? ' — challenge result submitted; awaiting opponent.' : ' — local score is being prepared.' : workoutState.rewardStatus === 'granted' ? ` — ${WORKOUT_COMPLETION_REWARD.xp} XP and +${WORKOUT_COMPLETION_REWARD.overallRatingDelta} OVR saved locally.` : workoutState.rewardStatus === 'failed' ? ' — reward save failed; repeat delivery can retry safely.' : ' — saving reward…'}</Text>}
      {workoutState.rewardStatus === 'failed' && <Action title="Retry reward save" onPress={retryReward} />}
    </Card>
  </View>;
}
