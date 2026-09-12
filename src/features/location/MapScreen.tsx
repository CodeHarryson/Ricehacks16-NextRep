import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { Action, Card, styles } from '../../components/ui';
import { LOCATION_CONFIG } from '../../config/location';
import { fetchNearby, publishPresence, stopPresence, type NearbyUser } from './api';
import { loadDemoUser, type DemoUser } from './identity';
import { locationAvailability } from './status';
import { shouldPublishLocation, type Coordinates } from './throttle';
import { mapStyleUrl, mapUnavailableMessage, nearbyToLngLat, nearbyUsersForMap } from './mapConfig';
import { DEMO_WORKOUT_ZONES } from './zones';

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
  const styleUrl = mapStyleUrl();
  const [mapLoadFailed, setMapLoadFailed] = useState(!styleUrl);
  const camera = useRef<CameraRef>(null);
  const pulse = useRef(new Animated.Value(1)).current;
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
  const center: [number, number] | undefined = useMemo(() => current ? [current.coords.longitude, current.coords.latitude] : undefined, [current]);
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
  return <View style={{ gap: 16 }}>
    <Text style={styles.eyebrow}>NEARBY / DEMO PRESENCE</Text><Text style={styles.title}>Find your space.</Text>
    <Text style={styles.body}>Nearby positions are approximate and expire after one minute. Demo identity: {user?.displayName ?? 'loading…'}.</Text>
    {status === 'loading' && <Card><Text style={styles.body}>Loading your location…</Text></Card>}
    {status === 'permission-denied' && <Card><Text style={styles.body}>Location permission is denied. Enable it in Settings to share your position.</Text></Card>}
    {status === 'location-disabled' && <Card><Text style={styles.body}>Location services are disabled on this device.</Text></Card>}
    {status === 'offline' && <Card><Text style={styles.body}>Presence service is unavailable. Your location is not being shared until it reconnects.</Text></Card>}
    {center && styleUrl && !mapLoadFailed && <Map style={{ height: 360, borderRadius: 20, overflow: 'hidden' }} mapStyle={styleUrl} attribution logo onDidFinishLoadingMap={() => setMapLoadFailed(false)} onDidFailLoadingMap={() => setMapLoadFailed(true)}>
      <Camera ref={camera} initialViewState={{ center, zoom: 15 }} />
      <GeoJSONSource id="demo-workout-zones" data={DEMO_WORKOUT_ZONES}>
        <Layer id="demo-zone-circles" type="circle" style={{ circleColor: ['get', 'color'], circleRadius: 24, circleOpacity: 0.28, circleStrokeColor: '#ffffff', circleStrokeWidth: 1 }} />
      </GeoJSONSource>
      {center && <Marker id="current-user" lngLat={center}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#22d3ee', borderWidth: 3, borderColor: '#ffffff' }} /></Marker>}
      {mapNearby.map((person) => <Marker key={person.userId} id={person.userId} lngLat={nearbyToLngLat(person)} onPress={() => setSelectedOpponent(person)}><Animated.View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#ff4fd8', borderWidth: 2, borderColor: '#ffb347', transform: [{ scale: pulse }] }} /></Marker>)}
    </Map>}
    {mapLoadFailed && <Card><Text style={styles.body}>{mapUnavailableMessage()}</Text></Card>}
    {status === 'empty' && <Text style={styles.body}>No active nearby users.</Text>}
    {nearby.length > 0 && <Text style={styles.body}>{nearby.length} nearby user{nearby.length === 1 ? '' : 's'} · closest {nearby[0]?.distanceMeters} m</Text>}
    {selectedOpponent && <Card><Text style={styles.heading}>{selectedOpponent.displayName}</Text><Text style={styles.body}>Approximately {selectedOpponent.distanceMeters} m away.</Text><Action title="Challenge this user" onPress={() => { camera.current?.flyTo({ center: nearbyToLngLat(selectedOpponent), zoom: 16, duration: 700 }); setTimeout(() => onOpenChallenges(selectedOpponent), 700); }} /></Card>}
    <Action title="View challenges" onPress={() => onOpenChallenges(null)} />
    {sharing ? <Action title="Stop sharing location" onPress={() => { void stopSharing(); }} /> : user && <Action title="Start sharing location" onPress={() => { void startSharing(user); }} />}
  </View>;
}
