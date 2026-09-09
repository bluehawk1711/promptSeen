import { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import type { Category } from '@repo/shared/types';

interface CategoryChipsProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

/**
 * Horizontal scrollable category filter chips with premium pill design.
 */
export const CategoryChips = memo(function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const activeCategories = categories.filter((c) => c.isActive);

  const handleSelect = (slug: string | null) => {
    Haptics.selectionAsync();
    onSelect(slug === selected ? null : slug);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* All chip */}
      <Animated.View entering={FadeInRight.delay(0).springify()}>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor:
                selected === null ? colors.primary : colors.muted,
            },
          ]}
          onPress={() => handleSelect(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              {
                color:
                  selected === null ? colors.primaryForeground : colors.text,
                fontWeight: selected === null ? '700' : '500',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {activeCategories.map((cat, i) => (
        <Animated.View
          key={cat.id}
          entering={FadeInRight.delay((i + 1) * 40).springify()}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor:
                  selected === cat.slug ? cat.color : colors.muted,
              },
            ]}
            onPress={() => handleSelect(cat.slug)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color:
                    selected === cat.slug ? '#fff' : colors.text,
                  fontWeight: selected === cat.slug ? '700' : '500',
                },
              ]}
            >
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
  },
});
