import { useMemo, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { useFavoritesStore } from '@/store/favorites';
import { usePromptsStore } from '@/store/prompts';
import { useCategoriesStore } from '@/store/categories';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt, Category } from '@repo/shared/types';

/**
 * Favorites screen — favorites grouped by category.
 *
 * Each category with favorites gets its own section: a labeled header
 * (emoji icon + name + count) followed by that category's cards in a
 * 2-column grid. Categories appear in their defined order.
 */
export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { likedIds } = useFavoritesStore();
  const { prompts } = usePromptsStore();
  const { categories } = useCategoriesStore();

  const favoritePrompts = useMemo(
    () => prompts.filter((p) => likedIds.includes(p.id)),
    [prompts, likedIds]
  );

  // Group favorites by their first category, preserving category order.
  // Prompts whose category was deleted fall into "Other" at the end.
  const sections = useMemo(() => {
    const byCategory = new Map<string, Prompt[]>();
    for (const prompt of favoritePrompts) {
      const key = prompt.categoryIds?.[0] ?? '__other__';
      const list = byCategory.get(key);
      if (list) list.push(prompt);
      else byCategory.set(key, [prompt]);
    }

    const result: Array<{
      category: Category | null;
      prompts: Prompt[];
      key: string;
    }> = [];

    for (const category of categories) {
      const list = byCategory.get(category.id);
      if (list && list.length > 0) {
        result.push({ category, prompts: list, key: category.id });
        byCategory.delete(category.id);
      }
    }
    // Leftovers with no matching category
    const other = byCategory.get('__other__');
    if (other && other.length > 0) {
      result.push({ category: null, prompts: other, key: '__other__' });
    }
    return result;
  }, [favoritePrompts, categories]);

  // Flatten into rows for FlashList: section header rows + card pair rows
  const rows = useMemo(() => {
    const list: Array<
      | { type: 'header'; title: string; icon: string; count: number; key: string; sectionIndex: number }
      | { type: 'cards'; items: Prompt[]; key: string }
    > = [];
    sections.forEach((section, sectionIndex) => {
      list.push({
        type: 'header',
        title: section.category?.name ?? 'Other',
        icon: section.category?.icon ?? '📌',
        count: section.prompts.length,
        key: `header-${section.key}`,
        sectionIndex,
      });
      for (let i = 0; i < section.prompts.length; i += 2) {
        list.push({
          type: 'cards',
          items: section.prompts.slice(i, i + 2),
          key: `cards-${section.key}-${section.prompts[i].id}`,
        });
      }
    });
    return list;
  }, [sections]);

  const renderRow = ({
    item,
    index,
  }: {
    item: (typeof rows)[number];
    index: number;
  }) => {
    if (item.type === 'header') {
      return (
        <Animated.View
          style={styles.sectionHeader}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: withPrimaryOpacity(0.12) }]}>
            <Text style={[styles.countText, { color: PRIMARY }]}>{item.count}</Text>
          </View>
        </Animated.View>
      );
    }
    return (
      <View style={styles.cardRow}>
        {item.items.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} isLiked index={0} compact />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: 'rgba(255,75,75,0.1)' }]}>
            <Heart size={15} color="#FF4B4B" fill="#FF4B4B" strokeWidth={2.2} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {favoritePrompts.length} saved prompt
              {favoritePrompts.length !== 1 ? 's' : ''}
              {sections.length > 1 ? ` in ${sections.length} categories` : ''}
            </Text>
          </View>
        </View>
      </View>

      <FlashList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyFavorites colors={colors} />}
      />
    </View>
  );
}

/**
 * Animated empty state — gently pulsing heart with premium copy.
 */
function EmptyFavorites({ colors }: { colors: (typeof Colors)['dark'] | (typeof Colors)['light'] }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={styles.empty}
    >
      <View style={[styles.emptyIconOuter, { backgroundColor: 'rgba(255,75,75,0.08)' }]}>
        <Animated.View style={heartStyle}>
          <Heart size={30} color="#FF4B4B" fill="#FF4B4B" strokeWidth={2} />
        </Animated.View>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No favorites yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Tap the heart on any prompt to save it here
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
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
    paddingTop: 4,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, flex: 1 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cardRow: {
    flexDirection: 'row',
  },
  empty: { alignItems: 'center', paddingTop: 70, gap: 12 },
  emptyIconOuter: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 250, lineHeight: 21 },
});
