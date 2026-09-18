import { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Clock, ChevronRight, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { formatTimeUntilRotation } from '@repo/shared/daily-prompt';
import { SPRING } from '@/lib/animations';
import type { Prompt } from '@repo/shared/types';

interface DailyPromptCardProps {
  prompt: Prompt;
  categoryName?: string;
  categoryIcon?: string;
}

/**
 * Premium daily prompt card — featured at the top of the home screen.
 *
 * Design highlights:
 * - Pulsing orange glow border
 * - "Daily Pick" badge with flame
 * - Countdown timer to next rotation
 * - Full-width cinematic image
 */
export const DailyPromptCard = memo(function DailyPromptCard({
  prompt,
  categoryName,
  categoryIcon,
}: DailyPromptCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [countdown, setCountdown] = useState(formatTimeUntilRotation());

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatTimeUntilRotation());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/prompt/${prompt.id}`);
  };

  return (
    <Animated.View
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={handlePress}
        activeOpacity={0.92}
      >
        {/* Glow border effect */}
        <View style={styles.glowBorder} />

        {/* Image */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: prompt.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.imageGradient}
          />

          {/* Daily Pick badge */}
          <View style={styles.badge}>
            <Flame size={12} color={PRIMARY} fill={PRIMARY} />
            <Text style={styles.badgeText}>Daily Pick</Text>
          </View>

          {/* Countdown */}
          <View style={styles.countdown}>
            <Clock size={10} color="rgba(255,255,255,0.8)" />
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.promptText, { color: colorScheme === 'dark' ? '#EDE8E4' : '#1A0A00' }]} numberOfLines={2}>
            {prompt.text}
          </Text>

          <View style={styles.footer}>
            <View style={styles.categoryRow}>
              {categoryIcon && (
                <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              )}
              <Text style={[styles.categoryName, { color: colors.mutedForeground }]}>
                {categoryName ?? 'Prompt'}
              </Text>
            </View>

            <View style={[styles.ctaRow, { backgroundColor: withPrimaryOpacity(0.1) }]}>
              <Text style={styles.ctaText}>View Prompt</Text>
              <ChevronRight size={14} color={PRIMARY} strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  glowBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: withPrimaryOpacity(0.4),
  },
  imageWrap: {
    position: 'relative',
    height: 220,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFill,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13,5,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: withPrimaryOpacity(0.35),
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.3,
  },
  countdown: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  content: {
    padding: 18,
  },
  promptText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 15,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
});
