import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Action, Card, styles } from './src/components/ui';
import { ProgressionScreen } from './src/features/progression/ProgressionScreen';
import { WorkoutScreen } from './src/features/workout/WorkoutScreen';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'workout' | 'progression'>('home');
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
          <Text style={styles.body}>Set up your camera and get ready. This development build includes camera setup; live squat analysis is coming next.</Text></Card>
        <Action title="Start workout" onPress={() => setScreen('workout')} />
        <Action title="View progression" onPress={() => setScreen('progression')} />
      </> : <>
        <Action title="Back to home" onPress={() => setScreen('home')} />
        {screen === 'workout' ? <WorkoutScreen /> : <ProgressionScreen />}
      </>}
    </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}
