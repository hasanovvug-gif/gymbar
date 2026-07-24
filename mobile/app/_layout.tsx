import { useFonts, Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useGymStore } from '@/store/useGymStore';
import { initializeICloudConfig } from '@/utils/icloudConfig';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useGymStore((state) => state.settings.theme);
  const onboardingSeen = useGymStore((state) => state.settings.onboardingSeen);
  const hasHydrated = useGymStore((state) => state.hasHydrated);
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const navigationTheme = useMemo(() => {
    const baseTheme = theme === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: c.accentInk,
        background: c.background,
        card: c.background,
        text: c.textPrimary,
        border: c.border,
        notification: c.warning,
      },
    };
  }, [c, theme]);
  const [fontsLoaded] = useFonts({
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const isReady = fontsLoaded && hasHydrated;

  useEffect(() => {
    if (isReady) SplashScreen.hide();
  }, [isReady]);

  useEffect(() => {
    if (hasHydrated) initializeICloudConfig();
  }, [hasHydrated]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ contentStyle: styles.content, headerShown: false }}>
        <Stack.Protected guard={onboardingSeen}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="plan-editor" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="workout-session" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="supplement-scan" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboardingSeen}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Screen name="+not-found" options={{ headerShown: true }} />
      </Stack>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
    </ThemeProvider>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  content: { backgroundColor: c.background },
});
