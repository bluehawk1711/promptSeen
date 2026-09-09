import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Send, Clock, CheckCircle, XCircle, FileText } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { useSubmissionsStore } from '@/store/submissions';
import type { PromptSubmission } from '@repo/shared/types';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: '#FF9500', label: 'Pending Review' },
  approved: { icon: CheckCircle, color: '#34C759', label: 'Approved' },
  rejected: { icon: XCircle, color: '#FF3B30', label: 'Rejected' },
} as const;

/**
 * Submissions screen — shows user's submitted prompts with status.
 */
export default function SubmissionsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { mySubmissions, getMyStats } = useSubmissionsStore();
  const stats = useMemo(() => getMyStats(), [mySubmissions]);

  const renderSubmission = ({ item, index }: { item: PromptSubmission; index: number }) => {
    const config = STATUS_CONFIG[item.status];
    const StatusIcon = config.icon;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <StatusIcon size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>

          {/* Prompt text */}
          <Text style={[styles.promptText, { color: colors.text }]} numberOfLines={3}>
            {item.text}
          </Text>

          {/* Review note (if rejected) */}
          {item.status === 'rejected' && item.reviewNote && (
            <View style={[styles.reviewNote, { backgroundColor: '#FF3B3010' }]}>
              <Text style={[styles.reviewNoteText, { color: '#FF3B30' }]}>
                {item.reviewNote}
              </Text>
            </View>
          )}

          {/* Date */}
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            Submitted {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Submissions</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {stats.total} submission{stats.total !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Pending', count: stats.pending, color: '#FF9500' },
          { label: 'Approved', count: stats.approved, color: '#34C759' },
          { label: 'Rejected', count: stats.rejected, color: '#FF3B30' },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <FlashList
        data={mySubmissions}
        renderItem={renderSubmission}
        keyExtractor={(item) => item.id}

        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.empty}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <FileText size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No submissions yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Submit your own prompts for review by the admin team
            </Text>
          </Animated.View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCount: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  list: { paddingHorizontal: 12 },
  card: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  promptText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  reviewNote: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  reviewNoteText: { fontSize: 12, lineHeight: 18 },
  date: { fontSize: 11, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 240, lineHeight: 20 },
});
