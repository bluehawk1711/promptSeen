import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { useOnboardingStore } from '@/store/onboarding';
import { SplashProvider } from '@/components/splash-screen';
import {
  configureNotificationHandler,
  registerForPushNotifications,
  setupNotificationListeners,
  removeNotificationListeners,
  clearBadgeCount,
} from '@/lib/notifications';
import {
  subscribeToPrompts,
  unsubscribeFromPrompts,
} from '@/store/prompts';
import {
  subscribeToCategories,
  unsubscribeFromCategories,
} from '@/store/categories';

// Configure notification appearance when app is in foreground
configureNotificationHandler();

/**
 * Root layout — splash → Firestore → notifications → navigation.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <SplashProvider>
          <AppContent />
        </SplashProvider>
      </QueryProvider>
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

  // ── Push Notifications ──────────────────────────────────────────────────
  useEffect(() => {
    // Register for push notifications after a short delay
    // (don't block the initial render)
    const timer = setTimeout(() => {
      registerForPushNotifications();
    }, 2000);

    // Set up notification listeners
    setupNotificationListeners((promptId) => {
      // Deep link to prompt detail when notification is tapped
      if (promptId) {
        router.push(`/prompt/${promptId}`);
      }
    });

    // Clear badge when app opens
    clearBadgeCount();

    return () => {
      clearTimeout(timer);
      removeNotificationListeners();
    };
  }, []);

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
