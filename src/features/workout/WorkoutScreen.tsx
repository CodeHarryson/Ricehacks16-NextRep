import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Card, styles } from '../../components/ui';
import { WORKOUT_TARGET_REPS } from '../../config/workout';
import type { TrackingUpdate } from '../../contracts/pose';
import { CameraPreview } from '../tracking/CameraPreview';
import { poseAdapter } from '../tracking/poseAdapter';

export function WorkoutScreen() {
  const [tracking, setTracking] = useState<TrackingUpdate | null>(null);
  useEffect(() => poseAdapter.start({ onFrame: () => {}, onTracking: setTracking }), []);
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>SETUP / BODYWEIGHT SQUATS</Text>
    <Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Prop your phone securely. Step back until your full body and feet fit in view. Turn sideways and use a well-lit, clear space.</Text>
    <CameraPreview />
    <Card>
      <Text accessibilityLiveRegion="polite" style={styles.heading}>{tracking?.guidance ?? 'Pose tracking not connected'}</Text>
      <Text style={styles.body}>Goal: {WORKOUT_TARGET_REPS} squats. Counting is unavailable until the native pose adapter and squat engine are connected.</Text>
      <Text style={styles.body}>No attempt assessed. No XP awarded.</Text>
    </Card>
  </View>;
}
