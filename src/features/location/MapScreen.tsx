import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Camera, CircleLayer, MapView, MarkerView, ShapeSource, type CameraRef } from '@maplibre/maplibre-react-native';
import { Action, Card, ScreenHeader, styles } from '../../components/ui';
import { AvatarBadge, Banner, Collapsible, Pill } from '../../components/display';
import { PlayerHud } from '../../components/PlayerHud';
import { borders, colors, elevation, radii, spacing, typography } from '../../theme/tokens';
import { usePlayerSummary } from '../progression/usePlayerSummary';
import { LOCATION_CONFIG } from '../../config/location';
import { checkApiHealth, fetchNearby, locationApiConfig, publishPresence, stopPresence, type NearbyUser } from './api';
import { loadDemoUser, type DemoUser } from './identity';
import { locationAvailability } from './status';
import { shouldPublishLocation, type Coordinates } from './throttle';
import { mapStyleUrl, mapUnavailableMessage, nearbyToLngLat, nearbyUsersForMap } from './mapConfig';
import { DEMO_WORKOUT_ZONES } from './zones';
import { loadLocationTestRole, saveLocationTestRole, simulatedCoordinates, type LocationTestRole } from './simulation';

type MapStatus = 'loading' | 'ready' | 'permission-denied' | 'location-disabled' | 'offline' | 'empty';
interface MapScreenProps { onOpenChallenges: (opponent: NearbyUser | null) => void; onNearbyChange?: (users: NearbyUser[]) => void; }
function coordinatesOf(location: Location.LocationObject): Coordinates { return { latitude: location.coords.latitude, longitude: location.coords.longitude }; }

export function MapScreen({ onOpenChallenges, onNearbyChange }: MapScreenProps) {
  const [status, setStatus] = useState<MapStatus>('loading');
  const [sharing, setSharing] = useState(true);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [current, setCurrent] = useState<Coordinates | null>(null);
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<NearbyUser | null>(null);
  const styleUrl = mapStyleUrl();
  const [mapLoadFailed, setMapLoadFailed] = useState(!styleUrl);
  const [mapLoaded, setMapLoaded] = useState(false);
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
  const accuracyRef = useRef(100);
  const mounted = useRef(true);
  const { player } = usePlayerSummary();

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
    // Presence expires after a minute; simulated roles and stationary phones produce no
    // location callbacks, so re-publish (throttled) on every poll to stay visible.
    poller.current = setInterval(() => { const coordinates = currentRef.current; if (coordinates) void publish(demoUser, coordinates, accuracyRef.current).then(() => refreshNearby(demoUser, coordinates)); }, LOCATION_CONFIG.nearbyPollIntervalMs);
  }, [publish, refreshNearby]);
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
        const coordinates = coordinatesOf(location); currentRef.current = coordinates; accuracyRef.current = location.coords.accuracy ?? 100; setCurrent(coordinates);
        void publish(demoUser, coordinates, location.coords.accuracy ?? 100).then((sent) => { if (sent) void refreshNearby(demoUser, coordinates); });
      });
      if (currentRef.current) { const sent = await publish(demoUser, currentRef.current, 100, true); if (sent) await refreshNearby(demoUser, currentRef.current); }
      startPolling(demoUser);
    } catch { if (mounted.current) setStatus('offline'); }
  }, [publish, refreshNearby, startPolling]);
  const startSimulation = useCallback(async (demoUser: DemoUser, role: Exclude<LocationTestRole, 'real'>) => {
    const coordinates = simulatedCoordinates(role); if (!coordinates) return;
    watcher.current?.remove(); watcher.current = null; setLocationMode('simulated'); setTestRole(role); currentRef.current = coordinates; accuracyRef.current = 5; setCurrent(coordinates);
    const sent = await publish(demoUser, coordinates, 5, true); if (sent) await refreshNearby(demoUser, coordinates);
    startPolling(demoUser);
  }, [publish, refreshNearby, startPolling]);
  const selectLocationMode = useCallback(async (role: LocationTestRole) => {
    if (!user) return;
    await saveLocationTestRole(role); setTestRole(role);
    if (role === 'real') { setLocationMode('real'); currentRef.current = null; setCurrent(null); setMapLoaded(false); lastSent.current = null; await startSharing(user); }
    else await startSimulation(user, role);
  }, [startSharing, startSimulation, user]);
  useEffect(() => { onNearbyChange?.(nearby); }, [nearby, onNearbyChange]);
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
    // Watchdog only for the initial style load; `center` changes on every GPS update.
    if (!center || mapLoaded || mapLoadFailed) return;
    const timeout = setTimeout(() => setMapLoadFailed(true), 10_000);
    return () => clearTimeout(timeout);
  }, [center, mapLoaded, mapLoadFailed]);
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
  const nearbyLabel = nearby.length > 0 ? `${nearby.length} nearby · closest ${nearby[0]?.distanceMeters} m` : status === 'empty' ? 'No one nearby' : undefined;
  return <View style={{ gap: spacing.lg }}>
    <PlayerHud displayName={user?.displayName ?? null} player={player} trailing={nearbyLabel} />
    <ScreenHeader eyebrow="NEARBY / DEMO PRESENCE" title="Find your space." subtitle="Nearby positions are approximate and expire after one minute." />
    {status === 'loading' && <Banner tone="info" title="Loading your location…" live />}
    {status === 'permission-denied' && <Banner tone="danger" title="Location permission denied" message="Enable it in Settings to share your position." live />}
    {status === 'location-disabled' && <Banner tone="warning" title="Location services are off" message="Location services are disabled on this device." live />}
    {status === 'offline' && <Banner tone="danger" title="Presence service unavailable" message="Your location is not being shared until it reconnects." live />}
    {center && styleUrl && !mapLoadFailed && <View style={[{ borderRadius: radii.lg, borderWidth: 2.5, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.canvas }, elevation.card]}>
      <MapView style={{ height: 380 }} mapStyle={styleUrl} attributionEnabled logoEnabled onDidFinishLoadingMap={() => { setMapLoaded(true); setMapLoadFailed(false); }} onDidFailLoadingMap={() => setMapLoadFailed(true)}>
        <Camera ref={camera} defaultSettings={{ centerCoordinate: center, zoomLevel: 15 }} />
        <ShapeSource id="demo-workout-zones" shape={DEMO_WORKOUT_ZONES}>
          <CircleLayer id="demo-zone-circles" style={{ circleColor: ['get', 'color'], circleRadius: 24, circleOpacity: 0.28, circleStrokeColor: '#ffffff', circleStrokeWidth: 1 }} />
        </ShapeSource>
        {center && <MarkerView coordinate={center} allowOverlap><View accessible accessibilityLabel="Your approximate position" style={[{ borderRadius: 999, borderWidth: 2, borderColor: colors.gold }, elevation.cta(colors.gold)]}><AvatarBadge size={40} /></View></MarkerView>}
        {mapNearby.map((person) => <MarkerView key={person.userId} coordinate={nearbyToLngLat(person)} allowOverlap><Pressable accessibilityRole="button" accessibilityLabel={`${person.displayName}, about ${person.distanceMeters} meters away`} onPress={() => setSelectedOpponent(person)} style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', marginBottom: -4, zIndex: 1 }}><Text style={[typography.micro, { color: colors.onColor, fontSize: 9, textTransform: 'none' }]}>~{person.distanceMeters} m</Text></View>
          <Animated.View style={{ transform: [{ scale: pulse }] }}><AvatarBadge variant="opponent" size={36} /></Animated.View>
        </Pressable></MarkerView>)}
      </MapView>
    </View>}
    {mapLoadFailed && <Banner tone="warning" title="Map unavailable" message={mapUnavailableMessage()} />}
    {selectedOpponent && <Card variant="raised" style={{ padding: 0, gap: 0, overflow: 'hidden', borderRadius: radii.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.accentBg }}>
        <View style={{ width: 64, height: 64, borderRadius: radii.md, borderWidth: borders.default, borderColor: colors.accentBorder, backgroundColor: '#4A90E222', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}><AvatarBadge variant="opponent" size={56} ringColor="transparent" /></View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={[typography.bodyLg, { color: colors.text, fontWeight: '900' }]} numberOfLines={1}>{selectedOpponent.displayName}</Text>
          <Pill label={`Approximately ${selectedOpponent.distanceMeters} m away`} tone="info" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg }}>
        <Action title="Close" variant="secondary" grow onPress={() => setSelectedOpponent(null)} />
        <Action title="⚔ Challenge" variant="accent" grow accessibilityLabel="Challenge this user" onPress={() => { camera.current?.flyTo(nearbyToLngLat(selectedOpponent), 700); setTimeout(() => onOpenChallenges(selectedOpponent), 700); }} />
      </View>
    </Card>}
    <Action title="View challenges" variant="accent" onPress={() => onOpenChallenges(null)} />
    {sharing ? <Action title="Stop sharing location" variant="secondary" onPress={() => { void stopSharing(); }} /> : user && <Action title="Start sharing location" onPress={() => { void startSharing(user); }} />}
    {simulationEnabled && <Collapsible title="Developer tools">
      <Card><Text style={styles.heading}>Development location test</Text><Text style={styles.body}>Choose Test Player A on one device and Test Player B on the other. Keep both map screens open; presence expires after approximately one minute.</Text><View style={{ gap: 8 }}><Action title="Test Player A" variant="secondary" onPress={() => { void selectLocationMode('playerA'); }} /><Action title="Test Player B" variant="secondary" onPress={() => { void selectLocationMode('playerB'); }} /><Action title="Use real device GPS" variant="secondary" onPress={() => { void selectLocationMode('real'); }} /></View></Card>
      <Card><Text style={styles.heading}>API diagnostics</Text><Text style={styles.body}>API: {locationApiConfig.apiUrl}</Text><Text style={styles.body}>Device: {locationApiConfig.mode}</Text><Text style={styles.body}>Health: {apiHealth === 'reachable' ? 'reachable' : apiHealth === 'unreachable' ? 'unreachable' : 'checking…'}</Text><Text style={styles.body}>Location mode: {locationMode}{locationMode === 'simulated' ? ` (${testRole === 'playerA' ? 'Test Player A' : 'Test Player B'})` : ''}</Text><Text style={styles.body}>User ID: {user?.userId ?? 'loading…'}</Text><Text style={styles.body}>Last publish: {lastPublishAt ?? '—'}</Text><Text style={styles.body}>Last nearby poll: {lastNearbyPollAt ?? '—'}</Text><Text style={styles.body}>Latest API error: {latestApiError ?? '—'}</Text><Action title="Check API health" variant="secondary" onPress={() => { void runHealthCheck(); }} /></Card>
    </Collapsible>}
  </View>;
}
