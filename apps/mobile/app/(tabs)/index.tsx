import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Sparkles, WifiOff, TrendingUp } from 'lucide-react-native';


import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { usePromptsStore } from '@/store/prompts';
import { useCategoriesStore } from '@/store/categories';
import { useFavoritesStore } from '@/store/favorites';
import { useAppSettingsStore } from '@/store/app-settings';
import { trackEvent, trackStat, trackActiveUser } from '@/lib/analytics';
import { PulseDot, Shimmer } from '@/components/animated';
import { PromptCard } from '@/components/prompt-card';
import { DailyPromptCard } from '@/components/daily-prompt-card';
import { TrendingCard } from '@/components/trending-card';
import { CategoryChips } from '@/components/category-chips';
import { AdBanner } from '@/components/ad-banner';
import { getTrendingPrompts, getTrendingScore } from '@repo/shared/trending';
import type { Prompt } from '@repo/shared/types';

/**
 * Home screen — daily prompt, trending section, search, categories, and prompt grid.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { prompts, loading, connected, getDailyPrompt } = usePromptsStore();
  const { categories } = useCategoriesStore();
  const { likedIds } = useFavoritesStore();
  const { appName } = useAppSettingsStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Track screen view + active user on mount
  useEffect(() => {
    trackEvent('screen_view', { metadata: { screen: 'home' } });
    trackActiveUser('anonymous');
    trackStat('activeUsers');
  }, []);

  const dailyPrompt = useMemo(() => getDailyPrompt(), [prompts]);

  const dailyCategory = useMemo(() => {
    if (!dailyPrompt) return null;
    return categories.find((c) => c.id === dailyPrompt.categoryIds?.[0]);
  }, [dailyPrompt, categories]);

  // Trending prompts — top 10 by weighted engagement score
  const trendingPrompts = useMemo(() => {
    const excludeIds = dailyPrompt ? [dailyPrompt.id] : [];
    const eligible = prompts.filter((p) => p.isActive && !excludeIds.includes(p.id));
    return getTrendingPrompts(eligible, 10);
  }, [prompts, dailyPrompt]);

  // Trending scores for display
  const trendingScores = useMemo(() => {
    const map = new Map<string, number>();
    trendingPrompts.forEach((p) => map.set(p.id, getTrendingScore(p)));
    return map;
  }, [trendingPrompts]);

  // Track search events
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 2) {
      trackEvent('search', { metadata: { query: q } });
    }
  }, []);

  // Track category filter events
  const handleCategorySelect = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
    trackEvent('category_filter', { metadata: { category: slug ?? 'all' } });
  }, []);

  const filteredPrompts = useMemo(() => {
    // Home grid is photo-only — videos have their own tab
    let result = prompts.filter((p) => p.isActive && !p.video);

    // Exclude daily prompt and trending from the main grid
    const excludeIds = new Set([
      ...(dailyPrompt ? [dailyPrompt.id] : []),
      ...trendingPrompts.map((p) => p.id),
    ]);
    result = result.filter((p) => !excludeIds.has(p.id));

    if (selectedCategory) {
      const category = categories.find((c) => c.slug === selectedCategory);
      if (category) {
        result = result.filter((p) => p.categoryIds?.includes(category.id));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.text.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [prompts, categories, selectedCategory, searchQuery, dailyPrompt, trendingPrompts]);

  // Build feed rows: pairs of cards, with a full-width ad row after every
  // 3 pairs (6 cards). FlashList numColumns=1 — each row lays out its own
  // cards so ad rows can span the full width.
  const feedRows = useMemo(() => {
    const rows: Array<
      | { type: 'cards'; items: Prompt[]; key: string }
      | { type: 'ad'; key: string }
    > = [];
    const PAIRS_PER_AD = 3;
    let pairCount = 0;
    for (let i = 0; i < filteredPrompts.length; i += 2) {
      rows.push({
        type: 'cards',
        items: filteredPrompts.slice(i, i + 2),
        key: `cards-${filteredPrompts[i].id}`,
      });
      pairCount += 1;
      if (pairCount % PAIRS_PER_AD === 0 && i + 2 < filteredPrompts.length) {
        rows.push({ type: 'ad', key: `ad-${i}` });
      }
    }
    return rows;
  }, [filteredPrompts]);

  const renderPrompt = useCallback(
    ({ item }: { item: typeof feedRows[number] }) => {
      if (item.type === 'ad') {
        return <AdBanner style={styles.adBanner} />;
      }
      return (
        <View style={styles.cardRow}>
          {item.items.map((prompt, col) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isLiked={likedIds.includes(prompt.id)}
              index={Math.min(col, 1)}
            />
          ))}
        </View>
      );
    },
    [likedIds]
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {/* Header skeleton — logo circle + two text lines */}
      <View style={styles.skeletonHeaderRow}>
        <View style={styles.skeletonHeaderLeft}>
          <Shimmer width={36} height={36} borderRadius={12} />
          <View>
            <Shimmer width={110} height={18} borderRadius={8} />
            <Shimmer width={140} height={11} borderRadius={6} style={{ marginTop: 6 }} />
          </View>
        </View>
        <Shimmer width={64} height={26} borderRadius={12} />
      </View>
      {/* Search bar skeleton */}
      <Shimmer height={46} borderRadius={16} style={styles.skeletonSearch} />
      {/* Daily prompt card skeleton */}
      <View style={[styles.skeletonDaily, { backgroundColor: colors.card }]}>
        <Shimmer height={200} borderRadius={0} />
        <View style={{ padding: 18 }}>
          <Shimmer width="85%" height={16} borderRadius={8} />
          <Shimmer width="55%" height={16} borderRadius={8} style={{ marginTop: 8 }} />
          <View style={styles.skeletonDailyFooter}>
            <Shimmer width={90} height={12} borderRadius={6} />
            <Shimmer width={100} height={30} borderRadius={12} />
          </View>
        </View>
      </View>
      {/* Category chips row */}
      <View style={styles.skeletonChips}>
        <Shimmer width={60} height={38} borderRadius={999} />
        <Shimmer width={90} height={38} borderRadius={999} />
        <Shimmer width={100} height={38} borderRadius={999} />
      </View>
      {/* Two-column prompt grid — mirrors real card layout */}
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[styles.skeletonCard, { backgroundColor: colors.card }]}
          >
            <Shimmer height={180} borderRadius={0} />
            <View style={{ padding: 12 }}>
              <Shimmer width="92%" height={13} borderRadius={6} />
              <Shimmer width="60%" height={13} borderRadius={6} style={{ marginTop: 7 }} />
              <View style={styles.skeletonStatsRow}>
                <Shimmer width={36} height={11} borderRadius={5} />
                <Shimmer width={48} height={11} borderRadius={5} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Daily Prompt — stays visible unless the user is searching */}
      {dailyPrompt && !searchQuery && (
        <View style={styles.dailySection}>
          <DailyPromptCard
            prompt={dailyPrompt}
            categoryName={dailyCategory?.name}
            categoryIcon={dailyCategory?.icon}
          />
        </View>
      )}

      {/* Trending Section — stays visible unless the user is searching */}
      {trendingPrompts.length > 0 && !searchQuery && (
        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <View style={styles.trendingTitleRow}>
              <View style={[styles.trendingIconWrap, { backgroundColor: withPrimaryOpacity(0.12) }]}>
                <TrendingUp size={13} color={PRIMARY} strokeWidth={2.5} />
              </View>
              <Text style={[styles.trendingTitle, { color: colors.text }]}>
                Trending Now
              </Text>
            </View>
            <Text style={[styles.trendingSubtitle, { color: colors.mutedForeground }]}>
              Top 10
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {trendingPrompts.map((prompt, i) => (
              <TrendingCard
                key={prompt.id}
                prompt={prompt}
                rank={i + 1}
                score={trendingScores.get(prompt.id) ?? 0}
                index={Math.min(i, 6)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category Chips */}
      <CategoryChips
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
      />

      {/* Section title — reflects active filter */}
      {!searchQuery && filteredPrompts.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {selectedCategory ? 'FILTERED PROMPTS' : 'ALL PROMPTS'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        renderLoadingSkeleton()
      ) : (
        <>
          {/* Header + search pinned OUTSIDE the list — typing never remounts them */}
          <View style={[styles.pinnedHeader, { paddingTop: insets.top + 8 }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
                  <Sparkles size={14} color={colors.primaryForeground} />
                </View>
                <View>
                  <Text style={[styles.appName, { color: colors.text }]}>
                    {appName}
                  </Text>
                  <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
                    {prompts.length} prompts curated for you
                  </Text>
                </View>
              </View>

              {/* Live connection indicator */}
              <View style={styles.connectionWrap}>
                {connected ? (
                  <View style={styles.liveBadge}>
                    <PulseDot color="#34C759" size={5} />
                    <Text style={[styles.liveText, { color: '#34C759' }]}>Live</Text>
                  </View>
                ) : (
                  <View style={styles.liveBadge}>
                    <WifiOff size={12} color={colors.mutedForeground} />
                    <Text style={[styles.liveText, { color: colors.mutedForeground }]}>
                      Offline
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Search Bar — stable, never unmounts between keystrokes */}
            <View style={[styles.searchWrap, { backgroundColor: colors.muted }]}>
              <Search size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search prompts..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>

          <FlashList
            data={feedRows}
            renderItem={renderPrompt}
            keyExtractor={(item) => item.key}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading && prompts.length > 0 ? (
                <View style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                    <Search size={28} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No prompts found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                    Try a different search or category
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pinnedHeader: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  appTagline: { fontSize: 12, marginTop: 2 },
  connectionWrap: { paddingRight: 4 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  liveText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  dailySection: {
    marginBottom: 8,
  },

  // Trending
  trendingSection: {
    marginBottom: 8,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  trendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendingIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  trendingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendingScroll: {
    paddingLeft: 16,
    paddingRight: 4,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 16,
  },
  listContent: { paddingTop: 6 },
  adBanner: { marginHorizontal: 12, marginVertical: 10 },
  cardRow: {
    flexDirection: 'row',
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },

  // Skeletons
  skeletonWrap: { paddingHorizontal: 16, paddingTop: 8 },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonSearch: { marginBottom: 12 },
  skeletonDaily: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  skeletonDailyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
