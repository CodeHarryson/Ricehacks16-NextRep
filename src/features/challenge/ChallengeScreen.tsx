import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, styles } from '../../components/ui';
import { acceptChallenge, createChallenge, declineChallenge, listChallenges, type Challenge } from './api';
import { loadDemoUser, type DemoUser } from '../location/identity';
import type { NearbyUser } from '../location/api';

interface ChallengeScreenProps { opponent: NearbyUser | null; onBack: () => void; }
export function ChallengeScreen({ opponent, onBack }: ChallengeScreenProps) {
  const [user, setUser] = useState<DemoUser | null>(null); const [challenges, setChallenges] = useState<Challenge[]>([]); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async (demoUser: DemoUser) => { setLoading(true); setError(null); try { setChallenges(await listChallenges(demoUser.userId)); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not load challenges.'); } finally { setLoading(false); } }, []);
  useEffect(() => { let mounted = true; void loadDemoUser().then((demoUser) => { if (!mounted) return; setUser(demoUser); void refresh(demoUser); }).catch(() => { if (mounted) { setError('Could not load demo identity.'); setLoading(false); } }); return () => { mounted = false; }; }, [refresh]);
  const send = async () => { if (!user || !opponent) return; setBusy(true); setError(null); try { const challenge = await createChallenge(user, opponent); setChallenges((current) => [challenge, ...current]); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not send challenge.'); } finally { setBusy(false); } };
  const respond = async (challenge: Challenge, action: 'accept' | 'decline') => { if (!user) return; setBusy(true); setError(null); try { const updated = action === 'accept' ? await acceptChallenge(user.userId, challenge.challengeId) : await declineChallenge(user.userId, challenge.challengeId); setChallenges((current) => current.map((item) => item.challengeId === updated.challengeId ? updated : item)); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not update challenge.'); } finally { setBusy(false); } };
  const incoming = challenges.filter((challenge) => challenge.receiverId === user?.userId && challenge.status === 'pending');
  const outgoing = challenges.filter((challenge) => challenge.senderId === user?.userId);
  return <View style={{ gap: 16 }}>
    <Action title="Back to map" onPress={onBack} />
    <Text style={styles.eyebrow}>PROXIMITY / CHALLENGES</Text><Text style={styles.title}>Choose your next test.</Text>
    <Text style={styles.body}>Demo identity: {user?.displayName ?? 'loading…'} (local-only, not authentication).</Text>
    {error && <Card><Text style={styles.body}>Challenge error: {error}</Text><Action title="Retry" onPress={() => { if (user) void refresh(user); }} /></Card>}
    {opponent && <Card><Text style={styles.heading}>Selected opponent</Text><Text style={styles.body}>{opponent.displayName} · approximately {opponent.distanceMeters} m away</Text><Action title={busy ? 'Sending…' : 'Send challenge'} onPress={() => { void send(); }} /></Card>}
    {loading ? <Text style={styles.body}>Loading challenges…</Text> : incoming.length > 0 ? <Card><Text style={styles.heading}>Incoming</Text>{incoming.map((challenge) => <View key={challenge.challengeId} style={{ gap: 8 }}><Text style={styles.body}>{challenge.senderDisplayName} · {challenge.proximityMeters} m away</Text><View style={{ flexDirection: 'row', gap: 8 }}><Action title="Accept" onPress={() => { void respond(challenge, 'accept'); }} /><Action title="Decline" onPress={() => { void respond(challenge, 'decline'); }} /></View></View>)}</Card> : <Text style={styles.body}>No incoming pending challenges.</Text>}
    {outgoing.length > 0 && <Card><Text style={styles.heading}>Outgoing</Text>{outgoing.map((challenge) => <Text key={challenge.challengeId} style={styles.body}>{challenge.receiverDisplayName} · {challenge.status} · {challenge.proximityMeters} m confirmed</Text>)}</Card>}
    {challenges.some((challenge) => challenge.status === 'accepted' && (challenge.senderId === user?.userId || challenge.receiverId === user?.userId)) && <Card><Text style={styles.heading}>Challenge accepted</Text><Text style={styles.body}>Proximity handshake complete. Workout setup is the next step.</Text></Card>}
  </View>;
}
