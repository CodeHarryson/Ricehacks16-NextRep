import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Action, Card, styles } from '../../components/ui';
import { LOCATION_CONFIG } from '../../config/location';
import { fetchNearby, publishPresence, stopPresence, type NearbyUser } from './api';
import { loadDemoUser, type DemoUser } from './identity';
import { locationAvailability } from './status';
import { shouldPublishLocation, type Coordinates } from './throttle';

type MapStatus = 'loading' | 'ready' | 'permission-denied' | 'location-disabled' | 'offline' | 'empty';
interface MapScreenProps { onOpenChallenges: (opponent: NearbyUser | null) => void; }
function coordinatesOf(location: Location.LocationObject): Coordinates { return { latitude: location.coords.latitude, longitude: location.coords.longitude }; }

export function MapScreen({ onOpenChallenges }: MapScreenProps) {
  const [status, setStatus] = useState<MapStatus>('loading');
  const [sharing, setSharing] = useState(true);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [current, setCurrent] = useState<Location.LocationObject | null>(null);
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<NearbyUser | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const poller = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSent = useRef<{ coordinates: Coordinates; sentAt: number } | null>(null);
  const currentRef = useRef<Location.LocationObject | null>(null);
  const mounted = useRef(true);

  const refreshNearby = useCallback(async (demoUser: DemoUser, location: Location.LocationObject) => {
    try {
      const users = await fetchNearby(demoUser.userId, coordinatesOf(location));
      if (mounted.current) { setNearby(users); setStatus(users.length > 0 ? 'ready' : 'empty'); }
    } catch { if (mounted.current) setStatus('offline'); }
  }, []);
  const publish = useCallback(async (demoUser: DemoUser, location: Location.LocationObject, force = false): Promise<boolean> => {
    const coordinates = coordinatesOf(location); const now = Date.now();
    if (!force && !shouldPublishLocation(lastSent.current, coordinates, now)) return false;
    try {
      await publishPresence({ ...coordinates, userId: demoUser.userId, displayName: demoUser.displayName, accuracyMeters: location.coords.accuracy ?? 100, capturedAt: new Date().toISOString() });
      lastSent.current = { coordinates, sentAt: now }; if (mounted.current) setStatus('ready'); return true;
    } catch { if (mounted.current) setStatus('offline'); return false; }
  }, []);
  const startPolling = useCallback((demoUser: DemoUser) => {
    if (poller.current) clearInterval(poller.current);
    poller.current = setInterval(() => { if (currentRef.current) void refreshNearby(demoUser, currentRef.current); }, LOCATION_CONFIG.nearbyPollIntervalMs);
  }, [refreshNearby]);
  const stopSharing = useCallback(async () => {
    setSharing(false); watcher.current?.remove(); watcher.current = null;
    if (poller.current) clearInterval(poller.current); poller.current = null;
    if (user) { try { await stopPresence(user.userId); } catch { /* local sharing is stopped even if API is unavailable */ } }
  }, [user]);
  const startSharing = useCallback(async (demoUser: DemoUser) => {
    setSharing(true);
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      const availability = locationAvailability(permission.status === Location.PermissionStatus.GRANTED, await Location.hasServicesEnabledAsync());
      if (availability !== 'ready') { setStatus(availability); return; }
      watcher.current?.remove();
      watcher.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: LOCATION_CONFIG.presenceUpdateIntervalMs, distanceInterval: LOCATION_CONFIG.minimumMovementMeters }, (location) => {
        currentRef.current = location; setCurrent(location);
        void publish(demoUser, location).then((sent) => { if (sent) void refreshNearby(demoUser, location); });
      });
      if (currentRef.current) { const sent = await publish(demoUser, currentRef.current, true); if (sent) await refreshNearby(demoUser, currentRef.current); }
      startPolling(demoUser);
    } catch { if (mounted.current) setStatus('offline'); }
  }, [publish, refreshNearby, startPolling]);
  useEffect(() => {
    mounted.current = true; let cancelled = false; let demoUserForCleanup: DemoUser | null = null;
    void (async () => {
      const demoUser = await loadDemoUser(); demoUserForCleanup = demoUser; if (cancelled) return; setUser(demoUser);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) { setStatus('permission-denied'); return; }
      if (!(await Location.hasServicesEnabledAsync())) { setStatus('location-disabled'); return; }
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); if (cancelled) return;
        currentRef.current = location; setCurrent(location); await startSharing(demoUser);
      } catch { if (mounted.current) setStatus('offline'); }
    })();
    return () => { cancelled = true; mounted.current = false; watcher.current?.remove(); watcher.current = null; if (poller.current) clearInterval(poller.current); poller.current = null; if (demoUserForCleanup) void stopPresence(demoUserForCleanup.userId).catch(() => undefined); };
  }, [startSharing]);
  const region: Region | undefined = current ? { latitude: current.coords.latitude, longitude: current.coords.longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 } : undefined;
  return <View style={{ gap: 16 }}>
    <Text style={styles.eyebrow}>NEARBY / DEMO PRESENCE</Text><Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Nearby positions are approximate and expire after one minute. Demo identity: {user?.displayName ?? 'loading…'}.</Text>
    {status === 'loading' && <Card><Text style={styles.body}>Loading your location…</Text></Card>}
    {status === 'permission-denied' && <Card><Text style={styles.body}>Location permission is denied. Enable it in Settings to share your position.</Text></Card>}
    {status === 'location-disabled' && <Card><Text style={styles.body}>Location services are disabled on this device.</Text></Card>}
    {status === 'offline' && <Card><Text style={styles.body}>Presence service is unavailable. Your location is not being shared until it reconnects.</Text></Card>}
    {region && <MapView style={{ height: 360, borderRadius: 20 }} initialRegion={region} region={region} showsUserLocation>{nearby.map((person) => <Marker key={person.userId} coordinate={person.position} title={person.displayName} description={`${person.distanceMeters} m away`} onPress={() => setSelectedOpponent(person)} />)}</MapView>}
    {status === 'empty' && <Text style={styles.body}>No active nearby users.</Text>}
    {nearby.length > 0 && <Text style={styles.body}>{nearby.length} nearby user{nearby.length === 1 ? '' : 's'} · closest {nearby[0]?.distanceMeters} m</Text>}
    {selectedOpponent && <Card><Text style={styles.heading}>{selectedOpponent.displayName}</Text><Text style={styles.body}>Approximately {selectedOpponent.distanceMeters} m away.</Text><Action title="Challenge this user" onPress={() => onOpenChallenges(selectedOpponent)} /></Card>}
    <Action title="View challenges" onPress={() => onOpenChallenges(null)} />
    {sharing ? <Action title="Stop sharing location" onPress={() => { void stopSharing(); }} /> : user && <Action title="Start sharing location" onPress={() => { void startSharing(user); }} />}
  </View>;
}
