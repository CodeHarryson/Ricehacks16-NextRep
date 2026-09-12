/**
 * Copy for screens whose backend does not exist yet. These states never show counts, rankings, names, or
 * statistics: there is no data source, so nothing is simulated.
 */
export type PlannedFeature = 'leaderboard' | 'notifications' | 'friends' | 'challengeHistory' | 'cosmetics' | 'streaks';

export const EMPTY_STATES: Record<PlannedFeature, { title: string; body: string; icon: string }> = {
  leaderboard: { icon: '🏆', title: 'Leaderboards are not live yet', body: 'Rankings need real player accounts and a ranking service. Until those exist, no leaderboard is shown.' },
  notifications: { icon: '🔔', title: 'No notifications', body: 'Push notifications are not available yet. Incoming challenges appear on the Challenges screen while you are nearby.' },
  friends: { icon: '🤝', title: 'Friends are not available yet', body: 'Friend lists need player accounts, which this demo does not have.' },
  challengeHistory: { icon: '📜', title: 'No challenge history yet', body: 'Finished challenges are not stored as a history. Results show at the end of each challenge.' },
  cosmetics: { icon: '🎽', title: 'Cosmetics are coming later', body: 'There is no shop or inventory yet, so every player uses the default character.' },
  streaks: { icon: '🔥', title: 'Streaks are not tracked yet', body: 'Weekly targets and streaks are planned but not saved, so none are shown.' },
};
