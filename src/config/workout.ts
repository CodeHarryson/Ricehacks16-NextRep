export const WORKOUT_TARGET_REPS = 5;

/** Temporary solo-set reward policy. Battle and shop rewards remain out of scope. */
export const WORKOUT_COMPLETION_REWARD = {
  xp: 100,
  coins: 0,
  overallRatingDelta: 1,
} as const;
