import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/providers/theme-provider';
import { useOnboardingStore } from '@/store/onboarding';
import { SplashProvider } from '@/components/splash-screen';
import {
  subscribeToPrompts,
  unsubscribeFromPrompts,
} from '@/store/prompts';
import {
  subscribeToCategories,
  unsubscribeFromCategories,
} from '@/store/categories';

/**
 * Root layout — animated splash → Firestore subscriptions → navigation.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SplashProvider>
        <AppContent />
      </SplashProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Inner app content — only rendered after splash completes.
 */
function AppContent() {
  const router = useRouter();
  const segments = useSegments();
  const { hasCompleted } = useOnboardingStore();

  useEffect(() => {
    // Subscribe to Firestore realtime data at app root
    const unsubPrompts = subscribeToPrompts();
    const unsubCategories = subscribeToCategories();

    return () => {
      unsubPrompts();
      unsubCategories();
    };
  }, []);

  useEffect(() => {
    // Redirect to onboarding if not completed and not already there
    if (!hasCompleted && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
    }
  }, [hasCompleted, segments]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="prompt/[id]"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              presentation: 'modal',
              gestureEnabled: false,
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
