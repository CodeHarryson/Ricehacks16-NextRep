import { useEffect, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { FONT_LOAD_TIMEOUT_MS, NUNITO_FAMILIES, resolveFontStatus, setFontStatus } from './fonts';
import { colors } from './tokens';

// Keys must match NUNITO_FAMILIES so typography tokens reference registered families.
const FONT_SOURCES = { [NUNITO_FAMILIES['700']]: Nunito_700Bold, [NUNITO_FAMILIES['800']]: Nunito_800ExtraBold, [NUNITO_FAMILIES['900']]: Nunito_900Black };

/**
 * Runtime font loading through the ExpoFont native module already in the development build (no config
 * plugin, so no rebuild). Children render only once the face is final — Nunito, or the system font after an
 * error or timeout — so text never paints in one face and then jumps to another.
 */
export function FontGate({ children }: PropsWithChildren) {
  const [loaded, error] = useFonts(FONT_SOURCES);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);
  // Idempotent: the first final status wins for the rest of the session.
  const status = setFontStatus(resolveFontStatus({ loaded, error, timedOut }));
  if (status === 'loading') return <View accessibilityLabel="Loading NextRep" style={{ flex: 1, backgroundColor: colors.bg }} />;
  return children;
}
