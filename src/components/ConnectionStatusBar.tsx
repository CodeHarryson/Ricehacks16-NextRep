import { Text, View } from 'react-native';
import { Action } from './ui';
import { connectionCopy, type ConnectionStatus } from '../features/challenge/connectionStatus';
import { borders, colors, radii, spacing, tones, typography } from '../theme/tokens';

/** Compact sync indicator: status dot + label, last synced time, and a retry while reconnecting/unavailable. */
export function ConnectionStatusBar({ status, lastUpdatedAt, onRetry }: { status: ConnectionStatus; lastUpdatedAt: number | null; onRetry: () => void }) {
  const copy = connectionCopy(status, lastUpdatedAt);
  const palette = tones[copy.tone];
  return <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${copy.label}. ${copy.detail}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.bg, borderColor: palette.border, borderWidth: borders.thin, borderRadius: radii.sm, paddingVertical: spacing.xs, paddingLeft: spacing.md, paddingRight: copy.showRetry ? spacing.xs : spacing.md }}>
    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: palette.solid }} />
    <View style={{ flex: 1 }}>
      <Text style={[typography.caption, { color: palette.text }]}>{copy.label}</Text>
      <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted, fontSize: 11 }]}>{copy.detail}</Text>
    </View>
    {copy.showRetry && <Action title="Retry" size="sm" variant="secondary" accessibilityLabel="Retry sync now" onPress={onRetry} />}
  </View>;
}
