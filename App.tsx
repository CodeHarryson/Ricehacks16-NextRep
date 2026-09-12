import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Action, Card, styles } from './src/components/ui';
import { ProgressionScreen } from './src/features/progression/ProgressionScreen';
import { MapScreen } from './src/features/location/MapScreen';
import { ChallengeScreen } from './src/features/challenge/ChallengeScreen';
import type { NearbyUser } from './src/features/location/api';
import { WorkoutScreen } from './src/features/workout/WorkoutScreen';
import type { WorkoutSessionConfig } from './src/features/workout/session';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'workout' | 'progression' | 'map' | 'challenge'>('home');
  const [challengeOpponent, setChallengeOpponent] = useState<NearbyUser | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionConfig | undefined>();
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      setScreen(screen === 'challenge' ? 'map' : 'home'); return true;
    });
    return () => listener.remove();
  }, [screen]);
  return <SafeAreaProvider><SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <ScrollView contentContainerStyle={styles.content}>
      {screen === 'home' ? <>
        <Text style={styles.eyebrow}>HACKRICE 16 / FITNESS GAME</Text>
        <Text accessibilityRole="header" style={styles.title}>NextRep</Text>
        <Text style={styles.body}>Five squats. One small step toward your next level.</Text>
        <Card><Text style={styles.heading}>Your next rep starts with you.</Text>
        <Text style={styles.body}>Track a live squat set or see approximate nearby demo users.</Text></Card>
        <Action title="Start workout" onPress={() => { setWorkoutSession(undefined); setScreen('workout'); }} />
        <Action title="View progression" onPress={() => setScreen('progression')} />
        <Action title="Open nearby map" onPress={() => setScreen('map')} />
      </> : <>
        <Action title="Back to home" onPress={() => setScreen('home')} />
        {screen === 'workout' ? <WorkoutScreen session={workoutSession} /> : screen === 'progression' ? <ProgressionScreen /> : <>
          {/* Keep the map mounted (hidden) on the challenge screen: unmounting it stops presence,
              and the server rejects challenges unless both players have active presence. */}
          <View style={{ display: screen === 'map' ? 'flex' : 'none' }}><MapScreen onOpenChallenges={(opponent) => { setChallengeOpponent(opponent); setScreen('challenge'); }} onNearbyChange={setNearbyUsers} /></View>
          {screen === 'challenge' && <ChallengeScreen opponent={challengeOpponent} nearbyUsers={nearbyUsers}onBack={() => setScreen('map')} onStartWorkout={(session) => { setWorkoutSession(session); setScreen('workout'); }} />}
        </>}
      </>}
    </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}
