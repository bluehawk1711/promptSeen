import { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Clock, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { formatTimeUntilRotation } from '@repo/shared/daily-prompt';
import type { Prompt } from '@repo/shared/types';

interface DailyPromptCardProps {
  prompt: Prompt;
  categoryName?: string;
  categoryIcon?: string;
}

/**
 * Premium daily prompt card — featured at the top of the home screen.
 *
 * Has a special design with:
 * - Orange glow border
 * - "Daily Pick" badge with sun icon
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
    <Animated.View entering={FadeInDown.delay(100).springify().damping(15)}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.9}
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
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />

          {/* Daily Pick badge */}
          <View style={styles.badge}>
            <Sun size={12} color="#FF7A2E" />
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
          <Text style={styles.promptText} numberOfLines={2}>
            {prompt.text}
          </Text>

          <View style={styles.footer}>
            <View style={styles.categoryRow}>
              {categoryIcon && (
                <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              )}
              <Text style={styles.categoryName}>{categoryName ?? 'Prompt'}</Text>
            </View>

            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>View Prompt</Text>
              <ChevronRight size={14} color="#FF7A2E" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1C0E02',
    // Orange glow shadow
    shadowColor: '#FF7A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glowBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,122,46,0.3)',
  },
  imageWrap: {
    position: 'relative',
    height: 200,
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
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(13,5,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,122,46,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF7A2E',
    letterSpacing: 0.3,
  },
  countdown: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 16,
  },
  promptText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFF5EB',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B8956A',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF7A2E',
  },
});
