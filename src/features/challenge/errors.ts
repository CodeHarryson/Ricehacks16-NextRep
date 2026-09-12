export type ChallengeErrorKind = 'network' | 'server';
export interface ChallengeErrorInfo { kind: ChallengeErrorKind; message: string; }

const NETWORK_PATTERN = /timed out|unreachable|network request failed|failed to fetch|fetch failed|load failed|aborted/i;

/** Maps thrown API errors to readable copy; network failures get a retry-oriented message. */
export function describeChallengeError(error: unknown, fallback: string): ChallengeErrorInfo {
  const raw = error instanceof Error && error.message ? error.message : '';
  if (raw && NETWORK_PATTERN.test(raw)) return { kind: 'network', message: "Can't reach the challenge server. Check your connection — retrying automatically." };
  return { kind: 'server', message: raw || fallback };
}
