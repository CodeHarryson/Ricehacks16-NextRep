import { useState, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';
import { Collapsible } from '../../components/display';
import { Action, styles } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { formatSyncTime } from '../challenge/connectionStatus';
import { checkApiHealth, locationApiConfig } from '../location/api';
import { diagnosticsEnabled, diagnosticsStore } from './diagnosticsStore';
import { mapRuntimeConfig } from '../../config/map';

const time = (value: number | null) => value === null ? '—' : formatSyncTime(value);

function Row({ label, value }: { label: string; value: string }) {
  return <Text selectable style={styles.caption}>{label}: <Text style={[styles.caption, { fontWeight: 'normal' }]}>{value}</Text></Text>;
}

/** Device-testing readout. Renders nothing outside development builds (__DEV__ is false in release). */
export function DiagnosticsPanel() {
  if (!diagnosticsEnabled(typeof __DEV__ !== 'undefined' ? __DEV__ : false)) return null;
  return <DiagnosticsContent />;
}

function DiagnosticsContent() {
  const snapshot = useSyncExternalStore(diagnosticsStore.subscribe, diagnosticsStore.get);
  const [checking, setChecking] = useState(false);
  const runHealthCheck = () => {
    if (checking) return;
    setChecking(true);
    void checkApiHealth()
      .then(() => diagnosticsStore.update({ apiHealth: 'reachable', lastApiError: null }))
      .catch((error: unknown) => diagnosticsStore.update({ apiHealth: 'unreachable', lastApiError: error instanceof Error ? error.message : 'Health check failed' }))
      .finally(() => setChecking(false));
  };
  return <Collapsible title="Developer diagnostics">
    <View style={{ gap: spacing.xs }}>
      <Row label="API URL" value={locationApiConfig.apiUrl} />
      <Row label="Device mode" value={locationApiConfig.mode} />
      <Row label="API health" value={snapshot.apiHealth} />
      <Row label="API configuration" value={locationApiConfig.status} />
      <Row label="Last API error" value={snapshot.lastApiError ?? '—'} />
      <Row label="Map style configuration" value={mapRuntimeConfig.status} />
      <Row label="Camera permission" value={snapshot.cameraPermission} />
      <Row label="Location permission" value={snapshot.locationPermission} />
      <Row label="Location services" value={snapshot.locationServices} />
      <Row label="Last challenge sync" value={time(snapshot.lastChallengeSyncAt)} />
      <Row label="Last result sync" value={time(snapshot.lastResultSyncAt)} />
      <Row label="Current challenge ID" value={snapshot.challengeId ?? '—'} />
      <Row label="Current demo user ID" value={snapshot.userId ?? '—'} />
      <Row label="Location mode" value={snapshot.locationMode} />
    </View>
    <Action title={checking ? 'Checking…' : 'Check API health'} variant="secondary" size="sm" disabled={checking} onPress={runHealthCheck} />
  </Collapsible>;
}
