import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Camera, CircleLayer, MapView, MarkerView, ShapeSource, type CameraRef } from '@maplibre/maplibre-react-native';
import { Action, Card, styles } from '../../components/ui';
import { LOCATION_CONFIG } from '../../config/location';
import { checkApiHealth, fetchNearby, locationApiConfig, publishPresence, stopPresence, type NearbyUser } from './api';
import { loadDemoUser, type DemoUser } from './identity';
import { locationAvailability } from './status';
import { shouldPublishLocation, type Coordinates } from './throttle';
import { mapStyleUrl, mapUnavailableMessage, nearbyToLngLat, nearbyUsersForMap } from './mapConfig';
import { DEMO_WORKOUT_ZONES } from './zones';
import { loadLocationTestRole, saveLocationTestRole, simulatedCoordinates, type LocationTestRole } from './simulation';

type MapStatus = 'loading' | 'ready' | 'permission-denied' | 'location-disabled' | 'offline' | 'empty';
interface MapScreenProps { onOpenChallenges: (opponent: NearbyUser | null) => void; }
function coordinatesOf(location: Location.LocationObject): Coordinates { return { latitude: location.coords.latitude, longitude: location.coords.longitude }; }

export function MapScreen({ onOpenChallenges }: MapScreenProps) {
  const [status, setStatus] = useState<MapStatus>('loading');
  const [sharing, setSharing] = useState(true);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [current, setCurrent] = useState<Coordinates | null>(null);
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<NearbyUser | null>(null);
  const styleUrl = mapStyleUrl();
  const [mapLoadFailed, setMapLoadFailed] = useState(!styleUrl);
  const simulationEnabled = typeof __DEV__ !== 'undefined' && __DEV__ || process.env.EXPO_PUBLIC_ENABLE_LOCATION_SIMULATION === 'true';
  const [locationMode, setLocationMode] = useState<'real' | 'simulated'>('real');
  const [testRole, setTestRole] = useState<LocationTestRole>('real');
  const [apiHealth, setApiHealth] = useState<'unknown' | 'reachable' | 'unreachable'>('unknown');
  const [lastPublishAt, setLastPublishAt] = useState<string | null>(null);
  const [lastNearbyPollAt, setLastNearbyPollAt] = useState<string | null>(null);
  const [latestApiError, setLatestApiError] = useState<string | null>(null);
  const camera = useRef<CameraRef>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const poller = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSent = useRef<{ coordinates: Coordinates; sentAt: number } | null>(null);
  const currentRef = useRef<Coordinates | null>(null);
  const mounted = useRef(true);

  const refreshNearby = useCallback(async (demoUser: DemoUser, coordinates: Coordinates) => {
    setLastNearbyPollAt(new Date().toISOString());
    try {
      const users = await fetchNearby(demoUser.userId, coordinates);
      if (mounted.current) { setNearby(users); setStatus(users.length > 0 ? 'ready' : 'empty'); setLatestApiError(null); }
    } catch (error) { if (mounted.current) { setStatus('offline'); setLatestApiError(error instanceof Error ? error.message : 'Nearby request failed'); } }
  }, []);
  const publish = useCallback(async (demoUser: DemoUser, coordinates: Coordinates, accuracyMeters = 10, force = false): Promise<boolean> => {
    const now = Date.now();
    if (!force && !shouldPublishLocation(lastSent.current, coordinates, now)) return false;
    try {
      await publishPresence({ ...coordinates, userId: demoUser.userId, displayName: demoUser.displayName, accuracyMeters, capturedAt: new Date().toISOString() });
      lastSent.current = { coordinates, sentAt: now }; if (mounted.current) { setStatus('ready'); setLastPublishAt(new Date().toISOString()); setLatestApiError(null); } return true;
    } catch (error) { if (mounted.current) { setStatus('offline'); setLatestApiError(error instanceof Error ? error.message : 'Presence publish failed'); } return false; }
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
        const coordinates = coordinatesOf(location); currentRef.current = coordinates; setCurrent(coordinates);
        void publish(demoUser, coordinates, location.coords.accuracy ?? 100).then((sent) => { if (sent) void refreshNearby(demoUser, coordinates); });
      });
      if (currentRef.current) { const sent = await publish(demoUser, currentRef.current, 100, true); if (sent) await refreshNearby(demoUser, currentRef.current); }
      startPolling(demoUser);
    } catch { if (mounted.current) setStatus('offline'); }
  }, [publish, refreshNearby, startPolling]);
  const startSimulation = useCallback(async (demoUser: DemoUser, role: Exclude<LocationTestRole, 'real'>) => {
    const coordinates = simulatedCoordinates(role); if (!coordinates) return;
    watcher.current?.remove(); watcher.current = null; setLocationMode('simulated'); setTestRole(role); currentRef.current = coordinates; setCurrent(coordinates);
    const sent = await publish(demoUser, coordinates, 5, true); if (sent) await refreshNearby(demoUser, coordinates);
    startPolling(demoUser);
  }, [publish, refreshNearby, startPolling]);
  const selectLocationMode = useCallback(async (role: LocationTestRole) => {
    if (!user) return;
    await saveLocationTestRole(role); setTestRole(role);
    if (role === 'real') { setLocationMode('real'); currentRef.current = null; setCurrent(null); lastSent.current = null; await startSharing(user); }
    else await startSimulation(user, role);
  }, [startSharing, startSimulation, user]);
  const center: [number, number] | undefined = useMemo(() => current ? [current.longitude, current.latitude] : undefined, [current]);
  useEffect(() => {
    mounted.current = true; let cancelled = false; let demoUserForCleanup: DemoUser | null = null;
    void (async () => {
      const demoUser = await loadDemoUser(); demoUserForCleanup = demoUser; if (cancelled) return; setUser(demoUser);
      void checkApiHealth().then(() => setApiHealth('reachable')).catch((error) => { setApiHealth('unreachable'); setLatestApiError(error instanceof Error ? error.message : 'Health check failed'); });
      const savedRole = await loadLocationTestRole(); if (cancelled) return; setTestRole(savedRole);
      if (simulationEnabled && savedRole !== 'real') { await startSimulation(demoUser, savedRole); return; }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) { setStatus('permission-denied'); return; }
      if (!(await Location.hasServicesEnabledAsync())) { setStatus('location-disabled'); return; }
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); if (cancelled) return;
        const coordinates = coordinatesOf(location); currentRef.current = coordinates; setCurrent(coordinates); await startSharing(demoUser);
      } catch { if (mounted.current) setStatus('offline'); }
    })();
    return () => { cancelled = true; mounted.current = false; watcher.current?.remove(); watcher.current = null; if (poller.current) clearInterval(poller.current); poller.current = null; if (demoUserForCleanup) void stopPresence(demoUserForCleanup.userId).catch(() => undefined); };
  }, [simulationEnabled, startSharing, startSimulation]);
  useEffect(() => {
    if (!center || mapLoadFailed) return;
    const timeout = setTimeout(() => setMapLoadFailed(true), 10_000);
    return () => clearTimeout(timeout);
  }, [center, mapLoadFailed]);
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);
  const mapNearby = nearbyUsersForMap(nearby, user?.userId ?? null);
  const runHealthCheck = async () => { try { await checkApiHealth(); setApiHealth('reachable'); setLatestApiError(null); } catch (error) { setApiHealth('unreachable'); setLatestApiError(error instanceof Error ? error.message : 'Health check failed'); } };
  return <View style={{ gap: 16 }}>
    <Text style={styles.eyebrow}>NEARBY / DEMO PRESENCE</Text><Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Nearby positions are approximate and expire after one minute. Demo identity: {user?.displayName ?? 'loading…'}.</Text>
    {status === 'loading' && <Card><Text style={styles.body}>Loading your location…</Text></Card>}
    {status === 'permission-denied' && <Card><Text style={styles.body}>Location permission is denied. Enable it in Settings to share your position.</Text></Card>}
    {status === 'location-disabled' && <Card><Text style={styles.body}>Location services are disabled on this device.</Text></Card>}
    {status === 'offline' && <Card><Text style={styles.body}>Presence service is unavailable. Your location is not being shared until it reconnects.</Text></Card>}
    {simulationEnabled && <Card><Text style={styles.heading}>Development location test</Text><Text style={styles.body}>Choose Test Player A on one device and Test Player B on the other. Keep both map screens open; presence expires after approximately one minute.</Text><View style={{ gap: 8 }}><Action title="Test Player A" onPress={() => { void selectLocationMode('playerA'); }} /><Action title="Test Player B" onPress={() => { void selectLocationMode('playerB'); }} /><Action title="Use real device GPS" onPress={() => { void selectLocationMode('real'); }} /></View></Card>}
    {simulationEnabled && <Card><Text style={styles.heading}>API diagnostics</Text><Text style={styles.body}>API: {locationApiConfig.apiUrl}</Text><Text style={styles.body}>Device: {locationApiConfig.mode}</Text><Text style={styles.body}>Health: {apiHealth === 'reachable' ? 'reachable' : apiHealth === 'unreachable' ? 'unreachable' : 'checking…'}</Text><Text style={styles.body}>Location mode: {locationMode}{locationMode === 'simulated' ? ` (${testRole === 'playerA' ? 'Test Player A' : 'Test Player B'})` : ''}</Text><Text style={styles.body}>User ID: {user?.userId ?? 'loading…'}</Text><Text style={styles.body}>Last publish: {lastPublishAt ?? '—'}</Text><Text style={styles.body}>Last nearby poll: {lastNearbyPollAt ?? '—'}</Text><Text style={styles.body}>Latest API error: {latestApiError ?? '—'}</Text><Action title="Check API health" onPress={() => { void runHealthCheck(); }} /></Card>}
    {center && styleUrl && !mapLoadFailed && <MapView style={{ height: 360, borderRadius: 20, overflow: 'hidden' }} mapStyle={styleUrl} attributionEnabled logoEnabled onDidFinishLoadingMap={() => setMapLoadFailed(false)} onDidFailLoadingMap={() => setMapLoadFailed(true)}>
      <Camera ref={camera} defaultSettings={{ centerCoordinate: center, zoomLevel: 15 }} />
      <ShapeSource id="demo-workout-zones" shape={DEMO_WORKOUT_ZONES}>
        <CircleLayer id="demo-zone-circles" style={{ circleColor: ['get', 'color'], circleRadius: 24, circleOpacity: 0.28, circleStrokeColor: '#ffffff', circleStrokeWidth: 1 }} />
      </ShapeSource>
      {center && <MarkerView coordinate={center} allowOverlap><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#22d3ee', borderWidth: 3, borderColor: '#ffffff' }} /></MarkerView>}
      {mapNearby.map((person) => <MarkerView key={person.userId} coordinate={nearbyToLngLat(person)} allowOverlap><Pressable onPress={() => setSelectedOpponent(person)}><Animated.View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#ff4fd8', borderWidth: 2, borderColor: '#ffb347', transform: [{ scale: pulse }] }} /></Pressable></MarkerView>)}
    </MapView>}
    {mapLoadFailed && <Card><Text style={styles.body}>{mapUnavailableMessage()}</Text></Card>}
    {status === 'empty' && <Text style={styles.body}>No active nearby users.</Text>}
    {nearby.length > 0 && <Text style={styles.body}>{nearby.length} nearby user{nearby.length === 1 ? '' : 's'} · closest {nearby[0]?.distanceMeters} m</Text>}
    {selectedOpponent && <Card><Text style={styles.heading}>{selectedOpponent.displayName}</Text><Text style={styles.body}>Approximately {selectedOpponent.distanceMeters} m away.</Text><Action title="Challenge this user" onPress={() => { camera.current?.flyTo(nearbyToLngLat(selectedOpponent), 700); setTimeout(() => onOpenChallenges(selectedOpponent), 700); }} /></Card>}
    <Action title="View challenges" onPress={() => onOpenChallenges(null)} />
    {sharing ? <Action title="Stop sharing location" onPress={() => { void stopSharing(); }} /> : user && <Action title="Start sharing location" onPress={() => { void startSharing(user); }} />}
  </View>;
}
