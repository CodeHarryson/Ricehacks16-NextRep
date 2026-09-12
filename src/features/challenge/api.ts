import type { NearbyUser } from '../location/api';
import { API_URL } from '../../config/api';

export type ChallengeStatus = 'pending' | 'accepted' | 'configuring' | 'ready' | 'active' | 'declined' | 'expired' | 'cancelled';
export interface ChallengeConfig { exercise: 'bodyweight_squat'; setCount: number; targetReps: number; restSeconds: number; matchTimeLimitSeconds: number; configVersion: number; }
export interface Challenge {
  challengeId: string;
  senderId: string;
  receiverId: string;
  senderDisplayName: string;
  receiverDisplayName: string;
  status: ChallengeStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  proximityMeters: number;
  configuration: ChallengeConfig;
  acceptance: { senderAcceptedAt: string | null; receiverAcceptedAt: string | null };
  locked: boolean;
  startedAt: string | null;
}
export interface ChallengeResult { resultId: string; challengeId: string; participantId: string; configVersion: number; exercise: string; countedReps: number; greenReps: number; yellowReps: number; redAttempts: number; neutralAttempts: number; totalScore: number; scorePolicyVersion: string; startedAt: string; endedAt: string; submittedAt: string; }
export interface ChallengeResolution { status: 'pending' | 'resolved' | 'cancelled'; winnerId?: string | null; winningScore?: number; resolvedAt?: string | null; }

async function request(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Challenge API request timed out after 8 seconds');
    throw error instanceof Error ? error : new Error('Challenge API is unreachable');
  }
  clearTimeout(timeout);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : `Challenge API returned ${response.status}`;
    throw new Error(message);
  }
  return response;
}
function parseChallenge(body: unknown): Challenge {
  if (!body || typeof body !== 'object' || !('challenge' in body)) throw new Error('Invalid challenge response');
  return (body as { challenge: Challenge }).challenge;
}
export async function listChallenges(userId: string): Promise<Challenge[]> {
  const body: unknown = await (await request('/challenges', { method: 'GET', headers: { 'x-user-id': userId } })).json();
  if (!body || typeof body !== 'object' || !Array.isArray((body as { challenges?: unknown }).challenges)) throw new Error('Invalid challenge list response');
  return (body as { challenges: Challenge[] }).challenges;
}
export async function createChallenge(user: { userId: string; displayName: string }, receiver: NearbyUser): Promise<Challenge> {
  return parseChallenge(await (await request('/challenges', { method: 'POST', headers: { 'x-user-id': user.userId, 'x-display-name': user.displayName }, body: JSON.stringify({ receiverId: receiver.userId }) })).json());
}
export async function acceptChallenge(userId: string, challengeId: string): Promise<Challenge> {
  return parseChallenge(await (await request(`/challenges/${encodeURIComponent(challengeId)}/accept`, { method: 'POST', headers: { 'x-user-id': userId } })).json());
}
export async function declineChallenge(userId: string, challengeId: string): Promise<Challenge> {
  return parseChallenge(await (await request(`/challenges/${encodeURIComponent(challengeId)}/decline`, { method: 'POST', headers: { 'x-user-id': userId } })).json());
}
export async function getChallenge(userId: string, challengeId: string): Promise<Challenge> {
  return parseChallenge(await (await request(`/challenges/${encodeURIComponent(challengeId)}`, { method: 'GET', headers: { 'x-user-id': userId } })).json());
}
export async function updateChallengeConfig(userId: string, challengeId: string, config: Omit<ChallengeConfig, 'configVersion'>): Promise<Challenge> {
  return parseChallenge(await (await request(`/challenges/${encodeURIComponent(challengeId)}/config`, { method: 'PATCH', headers: { 'x-user-id': userId }, body: JSON.stringify(config) })).json());
}
export async function acceptChallengeConfig(userId: string, challengeId: string): Promise<Challenge> {
  return parseChallenge(await (await request(`/challenges/${encodeURIComponent(challengeId)}/accept-config`, { method: 'POST', headers: { 'x-user-id': userId } })).json());
}
export async function startChallenge(userId: string, challengeId: string): Promise<Challenge> {
  return parseChallenge(await (await request(`/challenges/${encodeURIComponent(challengeId)}/start`, { method: 'POST', headers: { 'x-user-id': userId } })).json());
}
export async function submitChallengeResult(userId: string, challengeId: string, result: { configVersion: number; exercise: string; greenReps: number; yellowReps: number; redAttempts: number; neutralAttempts: number; startedAt: string; endedAt: string; idempotencyKey: string }): Promise<ChallengeResult> {
  const body: unknown = await (await request(`/challenges/${encodeURIComponent(challengeId)}/result`, { method: 'POST', headers: { 'x-user-id': userId, 'x-idempotency-key': result.idempotencyKey }, body: JSON.stringify(result) })).json();
  if (!body || typeof body !== 'object' || !('result' in body)) throw new Error('Invalid challenge result response'); return (body as { result: ChallengeResult }).result;
}
export async function getChallengeResults(userId: string, challengeId: string): Promise<{ results: ChallengeResult[]; resolution: ChallengeResolution }> {
  const body: unknown = await (await request(`/challenges/${encodeURIComponent(challengeId)}/results`, { method: 'GET', headers: { 'x-user-id': userId } })).json();
  if (!body || typeof body !== 'object' || !Array.isArray((body as { results?: unknown }).results)) throw new Error('Invalid challenge results response'); return body as { results: ChallengeResult[]; resolution: ChallengeResolution };
}
