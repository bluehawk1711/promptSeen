import { memo, useEffect, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { SPRING, DURATION } from '@/lib/animations';

// ─── PressableScale ──────────────────────────────────────────────────────────

interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** How much the element scales down on press. */
  scale?: number;
  haptic?: boolean;
  disabled?: boolean;
}

/**
 * Pressable with springy press-down physics.
 * Drop-in replacement for TouchableOpacity with premium feel.
 */
export const PressableScale = memo(function PressableScale({
  children,
  onPress,
  style,
  scale = 0.97,
  haptic = false,
  disabled = false,
}: PressableScaleProps) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(scale, SPRING.snappy);
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(1, SPRING.snappy);
  };

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={style}
        onTouchStart={disabled ? undefined : handlePressIn}
        onTouchEnd={disabled ? undefined : handlePressOut}
        onTouchCancel={disabled ? undefined : handlePressOut}
      >
        <Animated.View style={animatedStyle}>
          <View
            onStartShouldSetResponder={disabled ? undefined : () => true}
            onResponderRelease={disabled ? undefined : onPress}
            style={styles.fill}
          >
            {children}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
});

// ─── LikeButton ──────────────────────────────────────────────────────────────

interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: number;
  likeColor?: string;
  defaultColor?: string;
  filledBg?: boolean;
}

/**
 * Heart like button with burst + spring pop animation on like.
 */
export const LikeButton = memo(function LikeButton({
  isLiked,
  onToggle,
  size = 16,
  likeColor = '#FF3B30',
  defaultColor = '#FFFFFF',
}: LikeButtonProps) {
  const scale = useSharedValue(1);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (isLiked) {
      // Pop + burst sequence
      scale.value = withSequence(
        withTiming(1.4, { duration: DURATION.fast, easing: Easing.out(Easing.ease) }),
        withSpring(1, SPRING.bouncy),
      );
      burst.value = withSequence(
        withTiming(1, { duration: 260, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 200 }),
      );
    }
  }, [isLiked, scale, burst]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + burst.value * 0.9 }],
    opacity: (1 - burst.value) * 0.5,
  }));

  return (
    <View style={styles.likeBtnWrap}>
      {/* Burst ring */}
      <Animated.View
        style={[
          styles.burstRing,
          { borderColor: likeColor },
          burstStyle,
        ]}
      />
      <Animated.View style={heartStyle}>
        <Heart
          size={size}
          color={isLiked ? likeColor : defaultColor}
          fill={isLiked ? likeColor : 'transparent'}
          strokeWidth={2.5}
        />
      </Animated.View>
    </View>
  );
});

// ─── CountUp ─────────────────────────────────────────────────────────────────

interface CountUpProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  format?: (v: number) => string;
}

/**
 * Animated number that counts up when the value changes.
 */
export function CountUp({ value, duration = 600, style, format }: CountUpProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = Date.now();
    let raf: number;
    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <Text style={style}>{format ? format(display) : display.toLocaleString()}</Text>;
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────

interface ShimmerProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  color?: string;
  highlightColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium shimmer skeleton placeholder with sweeping highlight.
 */
export const Shimmer = memo(function Shimmer({
  width = '100%',
  height = 14,
  borderRadius = 8,
  color = 'rgba(255,255,255,0.08)',
  highlightColor = 'rgba(255,255,255,0.16)',
  style,
}: ShimmerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + Math.sin(progress.value * Math.PI) * 0.5,
    backgroundColor: progress.value > 0.5 ? highlightColor : color,
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: color },
        animatedStyle,
        style,
      ]}
    />
  );
});

// ─── AnimatedSection ─────────────────────────────────────────────────────────

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps a section with a gentle spring fade-up entrance.
 */
export function AnimatedSection({ children, delay = 0, style }: AnimatedSectionProps) {
  return (
    <Animated.View
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// ─── PulseDot ────────────────────────────────────────────────────────────────

/**
 * Small pulsing dot for live/connection indicators.
 */
export function PulseDot({ color = '#34C759', size = 8 }: { color?: string; size?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [scale, opacity]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value * 0.4,
  }));

  return (
    <View style={styles.pulseWrap}>
      <Animated.View
        style={[styles.pulseOuter, { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: color }, outerStyle]}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  likeBtnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  pulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    position: 'absolute',
  },
});
