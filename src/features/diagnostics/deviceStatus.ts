import type { ApiRuntimeConfig } from '../../config/api';
import type { MapRuntimeConfig } from '../../config/map';

export function cameraPermissionMessage(status: string): string {
  if (status === 'granted') return 'granted';
  if (status === 'not-determined') return 'not requested';
  if (status === 'restricted') return 'restricted by device policy';
  if (status === 'denied') return 'denied — enable in Settings';
  return `unknown (${status})`;
}

export function locationPermissionMessage(status: string): string {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'not requested';
  if (status === 'denied') return 'denied — enable in Settings';
  return `unknown (${status})`;
}

export function startupConfigurationIssues(api: ApiRuntimeConfig, map: MapRuntimeConfig): string[] {
  return [api.issue, map.issue].filter((issue): issue is string => Boolean(issue));
}
