export const WORKOUT_TARGET_REPS = 5;

/** Mirrors server SESSION_COUNTDOWN_SECONDS: reps count only after the shared start plus this countdown. */
export const SESSION_COUNTDOWN_SECONDS = 10;

/** Cadence for the existing challenge list and result polling. */
export const CHALLENGE_POLL_INTERVAL_MS = 5_000;

/** Temporary solo-set reward policy; battle rewards use their own versioned policy. */
export const WORKOUT_COMPLETION_REWARD = {
  xp: 100,
  coins: 0,
  overallRatingDelta: 1,
} as const;
