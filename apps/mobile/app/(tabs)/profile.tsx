import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  Monitor,
  Trash2,
  RotateCcw,
  Info,
  Heart,
  Folder,
  Send,
  ChevronRight,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Check,
} from 'lucide-react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { useThemeStore, type ThemeMode } from '@/store/theme';
import { useOnboardingStore } from '@/store/onboarding';
import { useFavoritesStore } from '@/store/favorites';
import { useCollectionsStore } from '@/store/collections';
import { useSubmissionsStore } from '@/store/submissions';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Profile screen — settings, about, and user stats in one place.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { resetOnboarding } = useOnboardingStore();
  const { likedIds, clearFavorites } = useFavoritesStore();
  const { collections } = useCollectionsStore();
  const { mySubmissions, getMyStats } = useSubmissionsStore();

  const submissionStats = getMyStats();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      {/* Stats Overview */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        YOUR STATS
      </Text>
      <View style={styles.statsGrid}>
        {[
          { icon: Heart, count: likedIds.length, label: 'Favorites', color: '#FF3B30' },
          { icon: Folder, count: collections.length, label: 'Collections', color: '#007AFF' },
          { icon: Send, count: submissionStats.total, label: 'Submissions', color: '#34C759' },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <stat.icon size={18} color={stat.color} />
            <Text style={[styles.statCount, { color: colors.text }]}>{stat.count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Submission Status */}
      {submissionStats.total > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            SUBMISSIONS
          </Text>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: Clock, label: 'Pending', count: submissionStats.pending, color: '#FF9500' },
              { icon: CheckCircle, label: 'Approved', count: submissionStats.approved, color: '#34C759' },
              { icon: XCircle, label: 'Rejected', count: submissionStats.rejected, color: '#FF3B30' },
            ].map((item, i) => (
              <View key={item.label}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.statusRow}>
                  <item.icon size={16} color={item.color} />
                  <Text style={[styles.statusLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.statusCount, { color: item.color }]}>{item.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Theme Section */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        APPEARANCE
      </Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = themeMode === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isActive && { backgroundColor: colors.muted }]}
              onPress={() => setThemeMode(option.value)}
            >
              <Icon size={20} color={isActive ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.optionText, { color: isActive ? colors.primary : colors.text }]}>
                {option.label}
              </Text>
              {isActive && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Data Section */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        DATA
      </Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.option} onPress={resetOnboarding}>
          <RotateCcw size={20} color={colors.mutedForeground} />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Reset Onboarding
          </Text>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            if (likedIds.length === 0) return;
            Alert.alert(
              'Clear Favorites',
              `Remove all ${likedIds.length} favorites?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearFavorites },
              ]
            );
          }}
        >
          <Trash2 size={20} color={colors.red} />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Favorites: {likedIds.length} saved
          </Text>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        ABOUT
      </Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.option}>
          <Info size={20} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionText, { color: colors.text }]}>TS Prompt</Text>
            <Text style={[styles.version, { color: colors.mutedForeground }]}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  section: {
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  optionText: { fontSize: 15, flex: 1 },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 46 },
  version: { fontSize: 12, marginTop: 1 },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statCount: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  statusLabel: { fontSize: 14, flex: 1 },
  statusCount: { fontSize: 14, fontWeight: '700' },
});
