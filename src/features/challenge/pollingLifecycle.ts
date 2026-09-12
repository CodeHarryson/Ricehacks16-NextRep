import { AppState } from 'react-native';
import { CHALLENGE_POLL_INTERVAL_MS } from '../../config/workout';
import { PollScheduler, type PollTarget } from './pollScheduler';

/**
 * Schedules a poll target and ties it to app foreground state: polling pauses in the background and refreshes
 * immediately on return. Call from an effect and return the cleanup.
 */
export function startForegroundPolling(target: PollTarget & { stop(): void }, intervalMs = CHALLENGE_POLL_INTERVAL_MS): () => void {
  const scheduler = new PollScheduler(target, intervalMs);
  scheduler.setAppActive(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  scheduler.start();
  const subscription = AppState.addEventListener('change', (state) => scheduler.setAppActive(state === 'active'));
  return () => { subscription.remove(); scheduler.stop(); target.stop(); };
}
