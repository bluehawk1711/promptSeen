import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatTrendingScore } from '@repo/shared/trending';
import type { Prompt } from '@repo/shared/types';

interface TrendingCardProps {
  prompt: Prompt;
  rank: number;
  score: number;
  index: number;
}

/**
 * Horizontal trending prompt card — shows rank, image, title, and score.
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
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).springify().damping(15)}
      style={styles.wrapper}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Rank badge */}
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: isTop3 ? rankColors[rank - 1] : colors.muted,
            },
          ]}
        >
          <Text
            style={[
              styles.rankText,
              { color: isTop3 ? '#000' : colors.text },
            ]}
          >
            {rank}
          </Text>
        </View>

        {/* Image */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: prompt.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {prompt.text}
          </Text>
          <View style={styles.scoreRow}>
            <TrendingUp size={10} color="#FF7A2E" />
            <Text style={styles.score}>{formatTrendingScore(score)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const CARD_WIDTH = 160;

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginRight: 10,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  imageWrap: {
    width: '100%',
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF7A2E',
  },
});
