import { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from './src/components/BottomNav';
import { IconButton, styles } from './src/components/ui';
import { HomeScreen } from './src/features/home/HomeScreen';
import { ProgressionScreen } from './src/features/progression/ProgressionScreen';
import { MapScreen } from './src/features/location/MapScreen';
import { ChallengeScreen } from './src/features/challenge/ChallengeScreen';
import type { NearbyUser } from './src/features/location/api';
import { WorkoutScreen } from './src/features/workout/WorkoutScreen';
import type { WorkoutSessionConfig } from './src/features/workout/session';
import { colors, spacing } from './src/theme/tokens';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'workout' | 'progression' | 'map' | 'challenge'>('home');
  const [challengeOpponent, setChallengeOpponent] = useState<NearbyUser | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionConfig | undefined>();
  const [launchedChallengeIds, setLaunchedChallengeIds] = useState<ReadonlySet<string>>(() => new Set());
  const exitTarget = workoutSession?.mode === 'challenge' ? 'map' : 'home';
  const startChallengeWorkout = useCallback((session: WorkoutSessionConfig) => {
    const { challengeId } = session;
    if (challengeId) setLaunchedChallengeIds((current) => current.has(challengeId) ? current : new Set(current).add(challengeId));
    setWorkoutSession(session); setScreen('workout');
  }, []);
  const startSoloWorkout = useCallback(() => { setWorkoutSession(undefined); setScreen('workout'); }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      setScreen(screen === 'challenge' || (screen === 'workout' && exitTarget === 'map') ? 'map' : 'home'); return true;
    });
    return () => listener.remove();
  }, [exitTarget, screen]);
  const inWorkout = screen === 'workout';
  return <SafeAreaProvider><SafeAreaView style={styles.screen} edges={inWorkout ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {screen === 'home' ? <HomeScreen onStartWorkout={startSoloWorkout} onOpenMap={() => setScreen('map')} onOpenProgression={() => setScreen('progression')} /> : <>
        {inWorkout && <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconButton glyph="✕" label={exitTarget === 'map' ? 'Back to map' : 'Back to home'} onPress={() => setScreen(exitTarget)} />
          <Text style={styles.label}>{exitTarget === 'map' ? 'Back to map' : 'Back to home'}</Text>
        </View>}
        {inWorkout ? <WorkoutScreen session={workoutSession} onExit={() => setScreen(exitTarget)} /> : screen === 'progression' ? <ProgressionScreen /> : <>
          {/* Keep the map mounted (hidden) on the challenge screen: unmounting it stops presence,
              and the server rejects challenges unless both players have active presence. */}
          <View style={{ display: screen === 'map' ? 'flex' : 'none' }}><MapScreen onOpenChallenges={(opponent) => { setChallengeOpponent(opponent); setScreen('challenge'); }} onNearbyChange={setNearbyUsers} /></View>
          {screen === 'challenge' && <ChallengeScreen opponent={challengeOpponent} nearbyUsers={nearbyUsers} launchedChallengeIds={launchedChallengeIds} onBack={() => setScreen('map')} onStartWorkout={startChallengeWorkout} />}
        </>}
      </>}
    </ScrollView>
    {/* The camera workout is full-focus (as in Figma's battle flow), so the tab bar is hidden there. */}
    {!inWorkout && <BottomNav
      active={screen === 'home' ? 'home' : screen === 'progression' ? 'progression' : 'map'}
      showWorkoutCta={screen === 'map'}
      onHome={() => setScreen('home')}
      onMap={() => setScreen('map')}
      onWorkout={startSoloWorkout}
      onProgression={() => setScreen('progression')} />}
  </SafeAreaView></SafeAreaProvider>;
}
