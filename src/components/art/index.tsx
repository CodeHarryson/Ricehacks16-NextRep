import { Image, type ImageStyle, type StyleProp } from 'react-native';

/**
 * Figma art, isolated so it can be swapped (e.g. for react-native-svg ports) without touching screens.
 * The PNGs were rasterised at @1x/@2x/@3x from assets/design/figma-reference:
 * - avatar-*: AvatarCharacterspriteBase (browser filters/blend modes baked in; opponent variant uses the
 *   prototype's #E98A8A shirt palette entry). There is no per-player appearance data, so every player
 *   uses the same base sprite and only "you" vs "opponent" is distinguished.
 * - flame: FlameIcon.
 * - nav-*: single-colour icons redrawn from the prototype's inline SVG nav icons; tinted at runtime.
 */
const images = {
  avatarBust: require('./images/avatar-bust.png'),
  avatarFull: require('./images/avatar-full.png'),
  opponentBust: require('./images/avatar-opponent-bust.png'),
  opponentFull: require('./images/avatar-opponent-full.png'),
  flame: require('./images/flame.png'),
  navHome: require('./images/nav-home.png'),
  navMap: require('./images/nav-map.png'),
  navProfile: require('./images/nav-profile.png'),
  navDumbbell: require('./images/nav-dumbbell.png'),
} as const;

export type AvatarVariant = 'self' | 'opponent';

/** Decorative sprite; callers put the player's name in adjacent text for screen readers. */
export function AvatarArt({ variant = 'self', framing = 'bust', size, style }: { variant?: AvatarVariant; framing?: 'bust' | 'full'; size: number; style?: StyleProp<ImageStyle> }) {
  const source = framing === 'bust' ? (variant === 'self' ? images.avatarBust : images.opponentBust) : (variant === 'self' ? images.avatarFull : images.opponentFull);
  const dimensions = framing === 'bust' ? { width: size, height: size } : { width: Math.round(size * 0.727), height: size };
  return <Image accessible={false} source={source} resizeMode="contain" style={[dimensions, style]} />;
}

export function FlameArt({ size = 20 }: { size?: number }) {
  return <Image accessible={false} source={images.flame} style={{ width: size, height: size }} />;
}

export type NavIconName = 'home' | 'map' | 'profile' | 'dumbbell';
const NAV_ICONS: Record<NavIconName, number> = { home: images.navHome, map: images.navMap, profile: images.navProfile, dumbbell: images.navDumbbell };

export function NavIconArt({ name, color, size = 26 }: { name: NavIconName; color: string; size?: number }) {
  return <Image accessible={false} source={NAV_ICONS[name]} style={{ width: size, height: size, tintColor: color }} />;
}
