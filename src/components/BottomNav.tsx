import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavIconArt, type NavIconName } from './art';
import { borders, colors, elevation, layout, spacing, typography } from '../theme/tokens';

export type NavTab = 'home' | 'map' | 'progression';

interface BottomNavProps {
  active: NavTab;
  /** On the map itself the centre button becomes the Figma red Workout CTA (solo workout). */
  showWorkoutCta: boolean;
  onHome: () => void;
  onMap: () => void;
  onWorkout: () => void;
  onProgression: () => void;
}

function SideTab({ icon, label, selected, onPress }: { icon: NavIconName; label: string; selected: boolean; onPress: () => void }) {
  const color = selected ? colors.primary : colors.iconInactive;
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} hitSlop={layout.hitSlop} onPress={onPress}
    style={({ pressed }) => [{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.sm }, pressed && { transform: [{ scale: 0.9 }] }]}>
    <NavIconArt name={icon} color={color} />
    <Text style={[typography.micro, { color, textTransform: 'none', fontSize: 11 }]}>{label}</Text>
  </Pressable>;
}

export function BottomNav({ active, showWorkoutCta, onHome, onMap, onWorkout, onProgression }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const ctaSize = showWorkoutCta ? layout.navCtaSize + 6 : layout.navCtaSize - 4;
  const ctaLabel = showWorkoutCta ? 'Workout' : 'Map';
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.bg, borderTopWidth: 2.5, borderTopColor: colors.border, paddingHorizontal: spacing.lg, paddingBottom: Math.max(insets.bottom, spacing.sm), minHeight: layout.bottomNavHeight }}>
    <SideTab icon="home" label="Home" selected={active === 'home'} onPress={onHome} />
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showWorkoutCta ? 'Start a solo workout' : 'Open nearby map'}
        accessibilityState={{ selected: active === 'map' }}
        onPress={showWorkoutCta ? onWorkout : onMap}
        style={({ pressed }) => [{ alignItems: 'center', gap: 2, marginTop: -(ctaSize / 2.4) }, pressed && { transform: [{ scale: 0.92 }] }]}>
        <View style={[{ width: ctaSize, height: ctaSize, borderRadius: ctaSize / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: showWorkoutCta ? colors.danger : colors.surface, borderWidth: showWorkoutCta ? borders.strong : 2.5, borderColor: showWorkoutCta ? '#FF9090' : active === 'map' ? colors.primary : colors.border }, showWorkoutCta ? elevation.cta(colors.danger) : elevation.card]}>
          <NavIconArt name={showWorkoutCta ? 'dumbbell' : 'map'} color={showWorkoutCta ? colors.onColor : active === 'map' ? colors.primary : colors.iconInactive} size={showWorkoutCta ? 30 : 26} />
        </View>
        <Text style={[typography.micro, { textTransform: 'none', fontSize: 11, color: showWorkoutCta ? colors.danger : active === 'map' ? colors.primary : colors.iconInactive }]}>{ctaLabel}</Text>
      </Pressable>
    </View>
    <SideTab icon="profile" label="Progress" selected={active === 'progression'} onPress={onProgression} />
  </View>;
}
