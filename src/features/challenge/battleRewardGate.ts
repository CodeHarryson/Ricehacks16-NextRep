import type { ChallengeResolution } from './api';
import type { BattleReward } from '../progression/storage';
import { BATTLE_REWARD_POLICY_VERSION, BATTLE_REWARDS } from './rewards';
import { battleOutcomeFor } from './resultView';

export type BattleRewardStatus = 'not_applicable' | 'saving' | 'saved' | 'failed';

/**
 * Screen-level guard in front of the idempotent storage grant: one request at a time, nothing after a
 * successful save, and failed saves retry only on an explicit user action instead of on every poll.
 */
export class BattleRewardGate {
  private status: BattleRewardStatus = 'not_applicable';
  private inFlight: Promise<BattleRewardStatus> | null = null;

  constructor(
    private readonly grant: (reward: BattleReward) => Promise<unknown>,
    private readonly onStatus: (status: BattleRewardStatus) => void = () => undefined,
  ) {}

  get current(): BattleRewardStatus { return this.status; }

  request(challengeId: string, participantId: string, resolution: ChallengeResolution, options: { manual?: boolean } = {}): Promise<BattleRewardStatus> {
    const outcome = battleOutcomeFor(resolution, participantId);
    if (!outcome || this.status === 'saved') return Promise.resolve(this.status);
    if (this.inFlight) return this.inFlight;
    if (this.status === 'failed' && !options.manual) return Promise.resolve(this.status);
    this.set('saving');
    this.inFlight = this.grant({ challengeId, participantId, outcome, ...BATTLE_REWARDS[outcome], rewardPolicyVersion: BATTLE_REWARD_POLICY_VERSION })
      .then(() => this.set('saved'), () => this.set('failed'))
      .finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  private set(status: BattleRewardStatus): BattleRewardStatus {
    this.status = status;
    this.onStatus(status);
    return status;
  }
}
