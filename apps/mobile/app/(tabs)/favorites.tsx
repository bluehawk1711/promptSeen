import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { useFavoritesStore } from '@/store/favorites';
import { usePromptsStore } from '@/store/prompts';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt } from '@repo/shared/types';

/**
 * Favorites screen — shows all liked prompts with premium empty state.
 */
export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { likedIds } = useFavoritesStore();
  const { prompts } = usePromptsStore();

  const favoritePrompts = useMemo(
    () => prompts.filter((p) => likedIds.includes(p.id)),
    [prompts, likedIds]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {favoritePrompts.length} saved prompt{favoritePrompts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlashList
        data={favoritePrompts}
        renderItem={({ item, index }) => (
          <PromptCard prompt={item} isLiked index={index} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}

        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.empty}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Heart size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No favorites yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap the heart on any prompt to save it here
            </Text>
          </Animated.View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  listContent: { paddingTop: 4, paddingHorizontal: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 240, lineHeight: 20 },
});
