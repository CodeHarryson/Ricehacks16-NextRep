export type ChallengeResolutionDisplay = 'pending' | 'resolved' | 'cancelled';

/** Copy for the score card; resolution is distinct from local save/submission state. */
export function challengeScoreResolutionCopy(status: ChallengeResolutionDisplay): string {
  if (status === 'resolved') return 'Server resolution complete.';
  if (status === 'cancelled') return 'Challenge cancelled — opponent did not submit.';
  return 'Waiting for server resolution.';
}
