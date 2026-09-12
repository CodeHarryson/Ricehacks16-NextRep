import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavIconArt, type NavIconName } from './art';
import { centerAction, TAB_LABELS, tabForScreen, type Screen, type Tab } from '../navigation/navigation';
import { borders, colors, elevation, layout, spacing, typography } from '../theme/tokens';

const SIDE_ICONS: Record<Exclude<Tab, 'home'>, NavIconName> = { progress: 'progress', leaderboard: 'trophy', notifications: 'bell', profile: 'profile' };

function SideTab({ tab, selected, onPress }: { tab: Exclude<Tab, 'home'>; selected: boolean; onPress: () => void }) {
  const color = selected ? colors.primary : colors.iconInactive;
  return <Pressable accessibilityRole="tab" accessibilityLabel={TAB_LABELS[tab]} accessibilityState={{ selected }} hitSlop={layout.hitSlop} onPress={onPress}
    style={({ pressed }) => [{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.sm, minWidth: 44 }, pressed && { transform: [{ scale: 0.9 }] }]}>
    <NavIconArt name={SIDE_ICONS[tab]} color={color} size={24} />
    <Text numberOfLines={1} style={[typography.micro, { color, textTransform: 'none', fontSize: 10 }]}>{TAB_LABELS[tab]}</Text>
  </Pressable>;
}

/** Five entries (Progress · Ranks · Home/Map · Alerts · Profile); the centre button follows centerAction(). */
export function BottomNav({ screen, onSelectTab, onCenter }: { screen: Screen; onSelectTab: (tab: Exclude<Tab, 'home'>) => void; onCenter: () => void }) {
  const insets = useSafeAreaInsets();
  const active = tabForScreen(screen);
  const center = centerAction(screen);
  const workout = center.kind === 'start-solo-workout';
  const ctaSize = workout ? layout.navCtaSize : layout.navCtaSize - 6;
  const centerColor = workout ? colors.onColor : active === 'home' ? colors.primary : colors.iconInactive;
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.bg, borderTopWidth: 2.5, borderTopColor: colors.border, paddingHorizontal: spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.sm), minHeight: layout.bottomNavHeight }}>
    <SideTab tab="progress" selected={active === 'progress'} onPress={() => onSelectTab('progress')} />
    <SideTab tab="leaderboard" selected={active === 'leaderboard'} onPress={() => onSelectTab('leaderboard')} />
    <View style={{ flex: 1.2, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={workout ? 'Start a solo workout' : center.label === 'Map' ? 'Open nearby map' : 'Go home'}
        accessibilityState={{ selected: active === 'home' }}
        onPress={onCenter}
        style={({ pressed }) => [{ alignItems: 'center', gap: 2, marginTop: -(ctaSize / 2.4) }, pressed && { transform: [{ scale: 0.92 }] }]}>
        <View style={[{ width: ctaSize, height: ctaSize, borderRadius: ctaSize / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: workout ? colors.danger : colors.surface, borderWidth: workout ? borders.strong : 2.5, borderColor: workout ? '#FF9090' : active === 'home' ? colors.primary : colors.border }, workout ? elevation.cta(colors.danger) : elevation.card]}>
          <NavIconArt name={center.icon} color={centerColor} size={workout ? 30 : 26} />
        </View>
        <Text style={[typography.micro, { textTransform: 'none', fontSize: 10, color: workout ? colors.danger : active === 'home' ? colors.primary : colors.iconInactive }]}>{center.label}</Text>
      </Pressable>
    </View>
    <SideTab tab="notifications" selected={active === 'notifications'} onPress={() => onSelectTab('notifications')} />
    <SideTab tab="profile" selected={active === 'profile'} onPress={() => onSelectTab('profile')} />
  </View>;
}
