import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Copy, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { useFavoritesStore } from '@/store/favorites';
import { trackEvent, trackStat } from '@/lib/analytics';
import type { Prompt } from '@repo/shared/types';

interface PromptCardProps {
  prompt: Prompt;
  isLiked: boolean;
  index?: number;
  compact?: boolean;
}

/**
 * Premium prompt card — cinematic image with gradient overlay,
 * glass-morphism like button, and haptic feedback.
 */
export const PromptCard = memo(function PromptCard({
  prompt,
  isLiked,
  index = 0,
  compact = false,
}: PromptCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { toggleLike } = useFavoritesStore();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${prompt.id}`);
  };

  const handleLikePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasLiked = toggleLike(prompt.id);
    trackEvent(wasLiked ? 'prompt_like' : 'prompt_unlike', { promptId: prompt.id });
    if (wasLiked) trackStat('likes');
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={[styles.wrapper, compact && styles.wrapperCompact]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: colors.text,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Image with gradient overlay */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: prompt.imageUrl }}
            style={[styles.image, compact && styles.imageCompact]}
            resizeMode="cover"
          />
          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />

          {/* Like button — glass style */}
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={handleLikePress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Heart
              size={16}
              color={isLiked ? '#FF3B30' : '#fff'}
              fill={isLiked ? '#FF3B30' : 'transparent'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          {/* Premium badge */}
          {prompt.isPremium && (
            <View style={styles.premiumBadge}>
              <Star size={10} color="#000" fill="#000" />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}

          {/* Likes count overlay */}
          <View style={styles.likesOverlay}>
            <Heart size={10} color="#fff" fill="#fff" />
            <Text style={styles.likesText}>
              {prompt.likesCount > 999
                ? `${(prompt.likesCount / 1000).toFixed(1)}k`
                : prompt.likesCount}
            </Text>
          </View>
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text
            style={[styles.text, { color: colors.text }]}
            numberOfLines={compact ? 2 : 3}
          >
            {prompt.text}
          </Text>

          {/* Tags row */}
          {prompt.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {prompt.tags.slice(0, 2).map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: 12,
  },
  wrapperCompact: {
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    // Premium shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imageCompact: {
    height: 130,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  likeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    // Glass effect
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFD60A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  likesOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likesText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  textContainer: {
    padding: 12,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
