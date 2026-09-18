import { useMemo } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { usePromptsStore } from '@/store/prompts';
import { useCategoriesStore } from '@/store/categories';

import Animated from 'react-native-reanimated';
import type { Prompt } from '@repo/shared/types';

/**
 * Videos screen — video-first browsing experience.
 *
 * Large 9:16 vertical cards with a prominent play affordance, duration-free
 * minimal chrome, and full-bleed thumbnails from the video poster frames.
 */
export default function VideosScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { prompts, loading } = usePromptsStore();
  const { getCategoryById } = useCategoriesStore();

  // Video-only prompts
  const videoPrompts = useMemo(
    () => prompts.filter((p) => p.isActive && p.video),
    [prompts]
  );

  const handlePress = (prompt: Prompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${prompt.id}`);
  };

  const renderVideo = ({ item, index }: { item: Prompt; index: number }) => {
    const category = getCategoryById(item.categoryIds?.[0]);

    return (
      <Animated.View
        style={styles.cardWrap}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          activeOpacity={0.9}
          onPress={() => handlePress(item)}
        >
          {/* Vertical video poster */}
          <View style={styles.posterWrap}>
            <Image
              source={{ uri: item.video?.thumbnailUrl || item.imageUrl || undefined }}
              style={styles.poster}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.posterGradient}
            />

            {/* Center play button — the main affordance */}
            <View style={styles.playButton}>
              <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
            </View>

            {/* Category chip — top left */}
            {category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText} numberOfLines={1}>
                  {category.name}
                </Text>
              </View>
            )}

            {/* Bottom overlay text */}
            <View style={styles.posterFooter}>
              <Text style={styles.promptPreview} numberOfLines={2}>
                {item.text}
              </Text>
            </View>
          </View>

          {/* Engagement row */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatCount(item.likesCount)} likes
            </Text>
            <View style={styles.metaDot} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatCount(item.copiesCount)} copies
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: withPrimaryOpacity(0.12) }]}>
            <Play size={14} color={PRIMARY} fill={PRIMARY} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Videos</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {videoPrompts.length} video prompt{videoPrompts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <FlashList
        data={loading ? [] : videoPrompts}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Play size={26} color={colors.mutedForeground} fill={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No video prompts yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Video prompts will appear here once added
            </Text>
          </View>
        }
      />
    </View>
  );
}

/** Compact number formatting: 1.2k, 3.4M. */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 1 },
  listContent: {
    paddingTop: 0,
    paddingHorizontal: 12,
  },
  cardWrap: {
    flex: 1,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  posterWrap: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: 260,
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  playButton: {
    position: 'absolute',
    top: '50%' as const,
    left: '50%' as const,
    marginLeft: -27,
    marginTop: -27,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: withPrimaryOpacity(0.92),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '75%' as const,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  posterFooter: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  promptPreview: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(143,132,120,0.5)',
  },
  empty: { alignItems: 'center', paddingTop: 70, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 20,
  },
});
