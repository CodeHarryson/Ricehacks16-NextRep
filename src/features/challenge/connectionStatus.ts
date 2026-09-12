import type { Tone } from '../../theme/tokens';
import type { SyncState } from './syncPoller';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'unavailable';

/** After this many consecutive failed polls the server is reported as unavailable rather than reconnecting. */
export const UNAVAILABLE_AFTER_FAILURES = 3;

export function connectionStatus(state: Pick<SyncState<unknown>, 'consecutiveFailures' | 'lastUpdatedAt'>): ConnectionStatus {
  if (state.consecutiveFailures >= UNAVAILABLE_AFTER_FAILURES) return 'unavailable';
  if (state.consecutiveFailures > 0) return 'reconnecting';
  return state.lastUpdatedAt === null ? 'connecting' : 'connected';
}

/** HH:MM:SS in the device's local time, without locale-dependent formatting. */
export function formatSyncTime(timestamp: number): string {
  const date = new Date(timestamp);
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, '0')).join(':');
}

export function connectionCopy(status: ConnectionStatus, lastUpdatedAt: number | null): { label: string; detail: string; tone: Tone; showRetry: boolean } {
  const synced = lastUpdatedAt === null ? 'Not synced yet' : `Last synced ${formatSyncTime(lastUpdatedAt)}`;
  if (status === 'connected') return { label: 'Connected', detail: synced, tone: 'success', showRetry: false };
  if (status === 'connecting') return { label: 'Connecting…', detail: synced, tone: 'info', showRetry: false };
  if (status === 'reconnecting') return { label: 'Reconnecting…', detail: `${synced} · showing last known state`, tone: 'warning', showRetry: true };
  return { label: 'Server unavailable', detail: `${synced} · showing last known state`, tone: 'danger', showRetry: true };
}
