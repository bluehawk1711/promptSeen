import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  interpolateColor,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Keep the native splash screen visible while we load
SplashScreen.preventAutoHideAsync();

interface SplashScreenProps {
  onFinish: () => void;
}

/**
 * Animated splash screen with PS logo and orange gradient glow.
 *
 * Shows for ~2.5 seconds with:
 * - Logo fade in with scale
 * - Pulsing orange glow behind the logo
 * - Tagline fade in
 * - Smooth fade out before transitioning to the app
 */
export function AnimatedSplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  // Glow pulse animation
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Start glow pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );

    // Hide native splash screen
    const hideNative = async () => {
      await SplashScreen.hideAsync();
    };
    hideNative();

    // Auto-dismiss after delay
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const handleFadeOutComplete = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={styles.container}
      exiting={FadeOut.duration(600)}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background gradient orbs */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      {/* Content */}
      <View style={styles.content}>
        {/* Glow behind logo */}
        <Animated.View style={[styles.logoGlow, glowAnimatedStyle]} />

        {/* Logo container */}
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          style={styles.logoContainer}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>PS</Text>
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Text style={styles.appName}>
            Prompt<Text style={styles.appNameHighlight}>Seen</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInDown.delay(900).duration(600)}>
          <Text style={styles.tagline}>
            Curated AI Prompts
          </Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View entering={FadeIn.delay(1200).duration(400)}>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <LoadingDot key={i} index={i} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── Animated Loading Dot ───────────────────────────────────────────────────

function LoadingDot({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dot, animatedStyle]} />
  );
}

// ─── Standalone Splash Wrapper ──────────────────────────────────────────────

/**
 * Wraps the app and shows the splash screen on first load.
 * Hides itself after the animation completes.
 */
export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  const handleFinish = useCallback(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <AnimatedSplashScreen onFinish={handleFinish} />;
  }

  return <>{children}</>;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D0500',
    zIndex: 9999,
  },

  // Background orbs
  orbTopRight: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255,122,46,0.08)',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,100,30,0.06)',
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,122,46,0.2)',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#FF7A2E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },

  // App name
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF5EB',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  appNameHighlight: {
    color: '#FF7A2E',
  },

  // Tagline
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#B8956A',
    letterSpacing: 0.5,
    marginBottom: 40,
  },

  // Loading dots
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7A2E',
  },
});
