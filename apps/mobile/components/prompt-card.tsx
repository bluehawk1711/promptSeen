import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Heart, Star, Play, Copy } from 'lucide-react-native';
import { GradientOverlay } from '@/components/ui/gradient-overlay';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { useFavoritesStore } from '@/store/favorites';
import { usePromptsStore } from '@/store/prompts';
import { useCategoriesStore } from '@/store/categories';
import { trackEvent, trackStat } from '@/lib/analytics';
import { LikeButton } from '@/components/animated';
import type { Prompt } from '@repo/shared/types';

interface PromptCardProps {
  prompt: Prompt;
  isLiked: boolean;
  index?: number;
  compact?: boolean;
}

/**
 * Premium prompt card — full-bleed image with gradient overlay,
 * springy press physics, heart burst like button, and cinematic feel.
 */
export const PromptCard = memo(function PromptCard({
  prompt,
  isLiked,
  index = 0,
  compact = false,
}: PromptCardProps) {
  const router = useRouter();
  const colors = Colors[useColorScheme()];
  const { toggleLike } = useFavoritesStore();
  const { incrementLikes, decrementLikes } = usePromptsStore();
  const { getCategoryById } = useCategoriesStore();

  const category = getCategoryById(prompt.categoryIds?.[0]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${prompt.id}`);
  };

  const handleLikePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasLiked = toggleLike(prompt.id);
    if (wasLiked) {
      incrementLikes(prompt.id);
    } else {
      decrementLikes(prompt.id);
    }
    trackEvent(wasLiked ? 'prompt_like' : 'prompt_unlike', { promptId: prompt.id });
    if (wasLiked) trackStat('likes');
  };

  return (
    <Animated.View
      style={[styles.wrapper, compact && styles.wrapperCompact]}
    >
      {/* Card shell — position:relative anchor. The like button is a SIBLING
          overlay (not a nested touchable) so its absolute top-right placement
          can never be hijacked by the card's gesture handler. */}
      <View style={styles.cardShell}>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              shadowColor: '#000',
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          {/* Full-bleed image */}
          <View style={styles.imageWrap}>
            {prompt.imageUrl ? (
              <Image
                source={prompt.imageUrl}
                style={[styles.image, compact && styles.imageCompact]}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.image, compact && styles.imageCompact, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
            )}
            {/* Gradient overlay at bottom */}
            <GradientOverlay direction="up" style={styles.gradient} />

            {/* Category badge — bottom left, glassy */}
            {category && (
              <View style={[styles.categoryBadge, { borderColor: 'rgba(255,255,255,0.22)' }]} pointerEvents="none">
                <Text style={styles.categoryBadgeText} numberOfLines={1}>
                  {category.name}
                </Text>
              </View>
            )}

            {/* Premium badge — top left */}
            {prompt.isPremium && (
              <View style={styles.premiumBadge} pointerEvents="none">
                <Star size={10} color="#000" fill="#000" />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}

            {/* Video badge */}
            {prompt.video && (
              <View style={styles.videoBadge} pointerEvents="none">
                <Play size={9} color="#fff" fill="#fff" />
                <Text style={styles.videoBadgeText}>VIDEO</Text>
              </View>
            )}
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.text, { color: colors.text }]}
              numberOfLines={2}
            >
              {prompt.text}
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Heart
                  size={11}
                  color={colors.mutedForeground}
                  fill={colors.mutedForeground}
                />
                <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                  {formatCount(prompt.likesCount)}
                </Text>
              </View>
              {prompt.copiesCount > 0 && (
                <View style={styles.statItem}>
                  <Copy size={11} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    {formatCount(prompt.copiesCount)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Like button — SIBLING overlay, absolute top-right of the shell.
            The image is full-bleed at the top of the card, so this is exactly
            the top-right corner of the image. Core RN touchable so it cannot
            conflict with the card's gesture-handler press. */}
        <RNTouchableOpacity
          style={styles.likeBtn}
          onPress={handleLikePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <LikeButton
            isLiked={isLiked}
            onToggle={handleLikePress}
            size={15}
            likeColor="#FF4B4B"
            defaultColor="#FFFFFF"
          />
        </RNTouchableOpacity>
      </View>
    </Animated.View>
  );
});

/** Compact number formatting: 1.2k, 3.4M. */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    maxWidth: '100%',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  wrapperCompact: {
    flex: 0,
    width: '46%',
    marginBottom: 10,
  },
  cardShell: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  card: {
    backgroundColor: 'rgba(30,24,18,0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  imageCompact: {
    height: 170,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(22,14,8,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  likeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20,12,6,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD60A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textContainer: {
    padding: 12,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
