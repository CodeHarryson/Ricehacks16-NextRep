import { Banner } from '../../components/display';
import { apiRuntimeConfig } from '../../config/api';
import { mapRuntimeConfig } from '../../config/map';
import { diagnosticsEnabled } from './diagnosticsStore';
import { startupConfigurationIssues } from './deviceStatus';

/** Visible on every screen in development so configuration failures are readable before a device flow starts. */
export function StartupDiagnostics() {
  if (!diagnosticsEnabled(typeof __DEV__ !== 'undefined' ? __DEV__ : false)) return null;
  const issues = startupConfigurationIssues(apiRuntimeConfig, mapRuntimeConfig);
  if (issues.length === 0) return null;
  return <Banner tone="warning" title="Development configuration needs attention" message={issues.join(' ')} live />;
}
