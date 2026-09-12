import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Action, Card, styles } from './src/components/ui';
import { ProgressionScreen } from './src/features/progression/ProgressionScreen';
import { MapScreen } from './src/features/location/MapScreen';
import { WorkoutScreen } from './src/features/workout/WorkoutScreen';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'workout' | 'progression' | 'map'>('home');
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      setScreen('home'); return true;
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
        <Action title="Start workout" onPress={() => setScreen('workout')} />
        <Action title="View progression" onPress={() => setScreen('progression')} />
        <Action title="Open nearby map" onPress={() => setScreen('map')} />
      </> : <>
        <Action title="Back to home" onPress={() => setScreen('home')} />
        {screen === 'workout' ? <WorkoutScreen /> : screen === 'progression' ? <ProgressionScreen /> : <MapScreen />}
      </>}
    </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}
