import { useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Action, styles } from '../../components/ui';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { NativePoseCamera } from './NativePoseCamera';

export function CameraPreview({ onFrame, onTracking }: { onFrame: (frame: PoseFrame) => void; onTracking: (update: TrackingUpdate) => void }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(position);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  async function askPermission() {
    try { setDenied(!(await requestPermission())); }
    catch { setError('Camera permission could not be requested. Open Settings and try again.'); }
  }
  async function openSettings() {
    try { await Linking.openSettings(); }
    catch { setError('Open your phone settings manually to allow camera access.'); }
  }
  if (!hasPermission) return <View style={{ gap: 12 }}>
    <Text style={styles.body}>Allow camera access to preview your position. Frames stay on this phone.</Text>
    <Action title="Allow camera" onPress={() => void askPermission()} />
    {(denied || Camera.getCameraPermissionStatus() === 'denied') && <>
      <Text style={styles.body}>Camera access is off. Enable it in Settings, then return here.</Text>
      <Action title="Open Settings" onPress={() => void openSettings()} />
    </>}
    {error && <Text style={styles.body}>{error}</Text>}
  </View>;
  return <View style={{ gap: 12 }}>
    <View style={cameraStyles.preview}>
      {device ? <NativePoseCamera device={device} active={active} position={position} onFrame={onFrame} onTracking={onTracking} onInitialized={() => { setReady(true); setError(null); }} onError={(message) => { setReady(false); setError(message); }} /> :
        <Text style={styles.body}>No {position} camera available on this device.</Text>}
    </View>
    <Text style={styles.body}>{error ?? (!active ? 'Camera paused while app is inactive.' : ready ? 'Camera preview • on-device pose tracking' : 'Waiting for camera preview…')}</Text>
    <Action title="Switch camera" onPress={() => {
      setReady(false); setError(null); setPosition(position === 'front' ? 'back' : 'front');
    }} />
  </View>;
}
const cameraStyles = StyleSheet.create({
  preview: { height: 480, borderRadius: 18, overflow: 'hidden', backgroundColor: '#060A07', justifyContent: 'center' },
});
