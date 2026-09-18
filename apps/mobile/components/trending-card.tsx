import { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, PRIMARY } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatTrendingScore } from '@repo/shared/trending';
import type { Prompt } from '@repo/shared/types';

interface TrendingCardProps {
  prompt: Prompt;
  rank: number;
  score: number;
  index: number;
}

const RANK_COLORS = ['#FFD700', '#C8C8D0', '#CD8A4A'] as const;

/**
 * Horizontal trending prompt card — medal rank badge, image, title, and score.
 * Used in the horizontal "Trending Now" scroll section.
 */
export const TrendingCard = memo(function TrendingCard({
  prompt,
  rank,
  score,
  index,
}: TrendingCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${prompt.id}`);
  };

  const isTop3 = rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[rank - 1] : undefined;

  return (
    <Animated.View
      style={styles.wrapper}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: prompt.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Rank badge — medal style for top 3 */}
          <View
            style={[
              styles.rankBadge,
              rankColor != null
                ? { backgroundColor: rankColor }
                : { backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
            ]}
          >
            <Text
              style={[
                styles.rankText,
                { color: rankColor != null ? '#000' : '#fff' },
              ]}
            >
              {rank}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {prompt.text}
          </Text>
          <View style={styles.scoreRow}>
            <TrendingUp size={10} color={PRIMARY} strokeWidth={2.5} />
            <Text style={styles.score}>{formatTrendingScore(score)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const CARD_WIDTH = 170;

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  imageWrap: {
    width: '100%',
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
});
