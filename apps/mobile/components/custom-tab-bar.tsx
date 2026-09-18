import { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images, Clapperboard, Heart, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, withPrimaryOpacity } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPRING } from '@/lib/animations';

const TAB_ICONS: Record<string, typeof Images> = {
  index: Images,
  videos: Clapperboard,
  favorites: Heart,
  profile: User,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Photos',
  videos: 'Videos',
  favorites: 'Favorites',
  profile: 'Profile',
};

interface TabBarProps {
  state: {
    index: number;
    routes: Array<{ name: string }>;
  };
  navigation: {
    navigate: (name: string) => void;
  };
}

/**
 * Premium floating tab bar — warm glass pill with springy icon bounce,
 * soft glow on active tab, and refined spacing.
 */
export const CustomTabBar = memo(function CustomTabBar({
  state,
  navigation,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.outerWrap, { paddingBottom: insets.bottom + 8 }]}>
      <View
        style={[
          styles.tabBar,
          styles.tabBarShadow,
          {
            backgroundColor: isDark ? 'rgba(24,20,17,0.94)' : 'rgba(255,255,255,0.96)',
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[route.name] ?? Images;
          const label = TAB_LABELS[route.name] ?? route.name;

          return (
            <TabItem
              key={route.name}
              icon={Icon}
              label={label}
              isFocused={isFocused}
              colors={colors}
              isDark={isDark}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
});

interface TabItemProps {
  icon: typeof Images;
  label: string;
  isFocused: boolean;
  colors: (typeof Colors)['dark'];
  isDark: boolean;
  onPress: () => void;
}

const TabItem = memo(function TabItem({
  icon: Icon,
  label,
  isFocused,
  colors,
  isDark,
  onPress,
}: TabItemProps) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING.snappy);
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -1]) },
    ],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.5, 1]) }],
  }));

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={styles.iconOuter}>
        {/* Active background — ONE squircle layer, no stacking */}
        <Animated.View
          style={[
            styles.activePill,
            { backgroundColor: withPrimaryOpacity(0.14) },
            pillStyle,
          ]}
        />
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <Icon
            size={21}
            color={isFocused ? colors.primary : isDark ? '#7A6E61' : '#8F8478'}
            strokeWidth={isFocused ? 2.3 : 1.9}
          />
        </Animated.View>
      </View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.primary : isDark ? '#7A6E61' : '#8F8478',
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(24,20,17,0.94)',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  } as ViewStyle,
  tabBarShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 4,
  },
  iconOuter: {
    width: 46,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    width: 46,
    height: 34,
    borderRadius: 12,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
});
