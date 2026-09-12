import type { Challenge, ChallengeResult } from './api';

export function challengeFixture(overrides: Partial<Challenge> = {}): Challenge {
  return {
    challengeId: 'c1', senderId: 'me', receiverId: 'them', senderDisplayName: 'Me', receiverDisplayName: 'Riley', status: 'pending',
    createdAt: '2026-09-12T12:00:00.000Z', expiresAt: '2026-09-12T12:02:00.000Z', acceptedAt: null, proximityMeters: 40,
    configuration: { exercise: 'bodyweight_squat', setCount: 1, targetReps: 5, restSeconds: 30, matchTimeLimitSeconds: 300, configVersion: 1 },
    acceptance: { senderAcceptedAt: null, receiverAcceptedAt: null }, locked: false, startedAt: null, ...overrides,
  };
}

export function resultFixture(participantId: string, overrides: Partial<ChallengeResult> = {}): ChallengeResult {
  return {
    resultId: `r-${participantId}`, challengeId: 'c1', participantId, configVersion: 1, exercise: 'bodyweight_squat', countedReps: 3, greenReps: 2, yellowReps: 1, redAttempts: 1, neutralAttempts: 0,
    totalScore: 320, scorePolicyVersion: 'score-v1', startedAt: '2026-09-12T12:00:10.000Z', endedAt: '2026-09-12T12:01:00.000Z', submittedAt: '2026-09-12T12:01:01.000Z', ...overrides,
  };
}
