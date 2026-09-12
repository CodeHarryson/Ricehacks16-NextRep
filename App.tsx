import { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from './src/components/BottomNav';
import { IconButton, styles } from './src/components/ui';
import { HomeScreen } from './src/features/home/HomeScreen';
import { ProgressionScreen } from './src/features/progression/ProgressionScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { LeaderboardScreen } from './src/features/social/LeaderboardScreen';
import { NotificationsScreen } from './src/features/social/NotificationsScreen';
import { MapScreen } from './src/features/location/MapScreen';
import { ChallengeScreen } from './src/features/challenge/ChallengeScreen';
import type { NearbyUser } from './src/features/location/api';
import { WorkoutScreen } from './src/features/workout/WorkoutScreen';
import type { WorkoutSessionConfig } from './src/features/workout/session';
import { backTarget, centerAction, isBottomNavVisible, shouldMountMap, TAB_SCREENS, type Screen } from './src/navigation/navigation';
import { FontGate } from './src/theme/FontGate';
import { colors, spacing } from './src/theme/tokens';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [challengeOpponent, setChallengeOpponent] = useState<NearbyUser | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionConfig | undefined>();
  const [recentChallengeSession, setRecentChallengeSession] = useState<WorkoutSessionConfig | undefined>();
  const [launchedChallengeIds, setLaunchedChallengeIds] = useState<ReadonlySet<string>>(() => new Set());
  const workoutMode = workoutSession?.mode ?? 'solo';
  const exitTarget = backTarget('workout', workoutMode) ?? 'home';
  const startChallengeWorkout = useCallback((session: WorkoutSessionConfig) => {
    const { challengeId } = session;
    if (challengeId) setLaunchedChallengeIds((current) => current.has(challengeId) ? current : new Set(current).add(challengeId));
    // Remembered for this app session so the challenge screen can reopen its result after the list drops it.
    setRecentChallengeSession(session);
    setWorkoutSession(session); setScreen('workout');
  }, []);
  const startSoloWorkout = useCallback(() => { setWorkoutSession(undefined); setScreen('workout'); }, []);
  const openChallenges = useCallback((opponent: NearbyUser | null) => { setChallengeOpponent(opponent); setScreen('challenge'); }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      const target = backTarget(screen, workoutMode);
      if (target === null) return false;
      setScreen(target); return true;
    });
    return () => listener.remove();
  }, [screen, workoutMode]);
  const onCenter = () => {
    const action = centerAction(screen);
    if (action.kind === 'start-solo-workout') startSoloWorkout(); else setScreen(action.screen);
  };
  const inWorkout = screen === 'workout';
  return <SafeAreaProvider><SafeAreaView style={styles.screen} edges={inWorkout ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
    <FontGate>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {screen === 'home' && <HomeScreen onStartWorkout={startSoloWorkout} onOpenMap={() => setScreen('map')} onOpenProgression={() => setScreen('progression')} />}
        {inWorkout && <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <IconButton glyph="✕" label={exitTarget === 'map' ? 'Back to map' : 'Back to home'} onPress={() => setScreen(exitTarget)} />
            <Text style={styles.label}>{exitTarget === 'map' ? 'Back to map' : 'Back to home'}</Text>
          </View>
          <WorkoutScreen session={workoutSession} onExit={() => setScreen(exitTarget)} />
        </>}
        {screen === 'progression' && <ProgressionScreen />}
        {screen === 'leaderboard' && <LeaderboardScreen />}
        {screen === 'notifications' && <NotificationsScreen onOpenChallenges={() => openChallenges(null)} />}
        {screen === 'profile' && <ProfileScreen onOpenProgress={() => setScreen('progression')} />}
        {/* Keep the map mounted (hidden) on the challenge screen: unmounting it stops presence,
            and the server rejects challenges unless both players have active presence. */}
        {shouldMountMap(screen) && <View style={{ display: screen === 'map' ? 'flex' : 'none' }}><MapScreen onOpenChallenges={openChallenges} onNearbyChange={setNearbyUsers} /></View>}
        {screen === 'challenge' && <ChallengeScreen opponent={challengeOpponent} nearbyUsers={nearbyUsers} launchedChallengeIds={launchedChallengeIds} recentChallengeSession={recentChallengeSession} onBack={() => setScreen('map')} onStartWorkout={startChallengeWorkout} />}
      </ScrollView>
      {/* The camera workout is full-focus (as in Figma's battle flow), so the tab bar is hidden there. */}
      {isBottomNavVisible(screen) && <BottomNav screen={screen} onSelectTab={(tab) => setScreen(TAB_SCREENS[tab])} onCenter={onCenter} />}
    </FontGate>
  </SafeAreaView></SafeAreaProvider>;
}
