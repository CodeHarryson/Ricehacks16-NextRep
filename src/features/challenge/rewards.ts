export const BATTLE_REWARD_POLICY_VERSION = 'battle-reward-v1';
export type BattleOutcome = 'winner' | 'loser' | 'draw';
export const BATTLE_REWARDS: Record<BattleOutcome, { xp: number; coins: number }> = {
  winner: { xp: 50, coins: 100 }, loser: { xp: 25, coins: 25 }, draw: { xp: 25, coins: 50 },
};
export function battleRewardId(challengeId: string, participantId: string): string {
  return `battle:${challengeId}:${participantId}:${BATTLE_REWARD_POLICY_VERSION}`;
}
