import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_USER_KEY = '@nextrep/demo-user/v1';
export interface DemoUser { userId: string; displayName: string; }
export async function loadDemoUser(): Promise<DemoUser> {
  const saved = await AsyncStorage.getItem(DEMO_USER_KEY);
  if (saved) return JSON.parse(saved) as DemoUser;
  const user = { userId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, displayName: 'Demo athlete' };
  await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  return user;
}
