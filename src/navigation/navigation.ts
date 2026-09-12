/** Pure navigation model for the single-stack screen state machine in App.tsx. */
export type Screen = 'home' | 'map' | 'challenge' | 'workout' | 'progression' | 'leaderboard' | 'notifications' | 'profile';
export type Tab = 'progress' | 'leaderboard' | 'home' | 'notifications' | 'profile';
export type WorkoutMode = 'solo' | 'challenge';

/** Left-to-right bottom-nav order; `home` is the centre Home/Map/Workout button. */
export const TAB_ORDER: readonly Tab[] = ['progress', 'leaderboard', 'home', 'notifications', 'profile'];
export const TAB_SCREENS: Record<Exclude<Tab, 'home'>, Screen> = { progress: 'progression', leaderboard: 'leaderboard', notifications: 'notifications', profile: 'profile' };
export const TAB_LABELS: Record<Tab, string> = { progress: 'Progress', leaderboard: 'Ranks', home: 'Home', notifications: 'Alerts', profile: 'Profile' };

/** The workout camera is full-focus: no tab is highlighted and the bar is hidden. */
export function tabForScreen(screen: Screen): Tab | null {
  if (screen === 'workout') return null;
  if (screen === 'home' || screen === 'map' || screen === 'challenge') return 'home';
  if (screen === 'progression') return 'progress';
  return screen;
}

export const isBottomNavVisible = (screen: Screen): boolean => tabForScreen(screen) !== null;

/** The map keeps publishing presence while the challenge screen is open, so it stays mounted (hidden) there. */
export const shouldMountMap = (screen: Screen): boolean => screen === 'map' || screen === 'challenge';

export type CenterAction = { kind: 'navigate'; screen: Screen; label: string; icon: 'home' | 'map' } | { kind: 'start-solo-workout'; label: string; icon: 'dumbbell' };

/** Home → Map; Map → start a solo workout (Figma red CTA); anywhere else → Home. */
export function centerAction(screen: Screen): CenterAction {
  if (screen === 'map') return { kind: 'start-solo-workout', label: 'Workout', icon: 'dumbbell' };
  if (screen === 'home') return { kind: 'navigate', screen: 'map', label: 'Map', icon: 'map' };
  return { kind: 'navigate', screen: 'home', label: 'Home', icon: 'home' };
}

/** Destination for the hardware back button / exit controls; null lets the OS handle it (leave the app). */
export function backTarget(screen: Screen, workoutMode: WorkoutMode): Screen | null {
  if (screen === 'home') return null;
  if (screen === 'challenge') return 'map';
  if (screen === 'workout') return workoutMode === 'challenge' ? 'map' : 'home';
  return 'home';
}
