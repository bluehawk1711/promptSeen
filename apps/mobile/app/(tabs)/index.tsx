import { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  Text,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Sparkles, Wifi, WifiOff, TrendingUp } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { usePromptsStore } from '@/store/prompts';
import { useCategoriesStore } from '@/store/categories';
import { useFavoritesStore } from '@/store/favorites';
import { PromptCard } from '@/components/prompt-card';
import { DailyPromptCard } from '@/components/daily-prompt-card';
import { TrendingCard } from '@/components/trending-card';
import { CategoryChips } from '@/components/category-chips';
import { AdBanner } from '@/components/ad-banner';
import { Skeleton } from '@/components/ui/skeleton';
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const dailyPrompt = useMemo(() => getDailyPrompt(), [prompts]);

  const dailyCategory = useMemo(() => {
    if (!dailyPrompt) return null;
    return categories.find((c) => c.id === dailyPrompt.categoryId);
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

  const filteredPrompts = useMemo(() => {
    let result = prompts.filter((p) => p.isActive);

    // Exclude daily prompt and trending from the main grid
    const excludeIds = new Set([
      ...(dailyPrompt ? [dailyPrompt.id] : []),
      ...trendingPrompts.map((p) => p.id),
    ]);
    result = result.filter((p) => !excludeIds.has(p.id));

    if (selectedCategory) {
      const category = categories.find((c) => c.slug === selectedCategory);
      if (category) {
        result = result.filter((p) => p.categoryId === category.id);
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

  const renderPrompt = useCallback(
    ({ item, index }: { item: Prompt; index: number }) => (
      <View>
        <PromptCard
          prompt={item}
          isLiked={likedIds.includes(item.id)}
          index={index}
        />
        {(index + 1) % 6 === 0 && (
          <AdBanner style={styles.adBanner} />
        )}
      </View>
    ),
    [likedIds]
  );

  const keyExtractor = useCallback((item: Prompt) => item.id, []);

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width="100%" height={180} />
          <View style={{ padding: 12 }}>
            <Skeleton width="90%" height={14} />
            <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
            <Sparkles size={14} color={colors.primaryForeground} />
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>
              PromptSeen
            </Text>
            <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
              {prompts.length} prompts curated for you
            </Text>
          </View>
        </View>

        {/* Connection indicator */}
        {!loading && (
          <View style={styles.connectionWrap}>
            {connected ? (
              <Wifi size={14} color="#34C759" />
            ) : (
              <WifiOff size={14} color={colors.mutedForeground} />
            )}
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.muted }]}>
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search prompts..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Daily Prompt */}
      {dailyPrompt && !searchQuery && !selectedCategory && (
        <View style={styles.dailySection}>
          <DailyPromptCard
            prompt={dailyPrompt}
            categoryName={dailyCategory?.name}
            categoryIcon={dailyCategory?.icon}
          />
        </View>
      )}

      {/* Trending Section */}
      {trendingPrompts.length > 0 && !searchQuery && !selectedCategory && (
        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <View style={styles.trendingTitleRow}>
              <TrendingUp size={16} color="#FF7A2E" />
              <Text style={[styles.trendingTitle, { color: colors.text }]}>
                Trending Now
              </Text>
            </View>
            <Text style={[styles.trendingSubtitle, { color: colors.mutedForeground }]}>
              Top 10 by engagement
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
                index={i}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category Chips */}
      <CategoryChips
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Section title */}
      {!searchQuery && !selectedCategory && filteredPrompts.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          ALL PROMPTS
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        renderLoadingSkeleton()
      ) : (
        <FlatList
          data={filteredPrompts}
          renderItem={renderPrompt}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No prompts found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Try a different search or category
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  appTagline: { fontSize: 12, marginTop: 1 },
  connectionWrap: { paddingRight: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  dailySection: {
    marginBottom: 4,
  },

  // Trending
  trendingSection: {
    marginBottom: 4,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  trendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  trendingSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  trendingScroll: {
    paddingLeft: 12,
    paddingRight: 4,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 16,
  },
  row: { justifyContent: 'space-between', paddingHorizontal: 12 },
  listContent: { paddingTop: 4 },
  adBanner: { marginHorizontal: 12, marginVertical: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  skeletonCard: { width: '48%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
});
