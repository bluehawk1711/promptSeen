import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { useAuthStore } from '@/store/auth';
import { useFeedbackStore } from '@/store/feedback';
import { useAppSettingsStore } from '@/store/app-settings';
import { GradientButton } from '@/components/ui/gradient-button';
import {
  ChevronLeft,
  Bug,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  Star,
  Send,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
  { value: 'bug' as const, label: 'Bug Report', icon: Bug, color: '#FF4B4B' },
  { value: 'feature' as const, label: 'Feature Request', icon: Lightbulb, color: '#A855F7' },
  { value: 'improvement' as const, label: 'Improvement', icon: TrendingUp, color: '#3B82F6' },
  { value: 'other' as const, label: 'Other', icon: HelpCircle, color: '#6B7280' },
];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { user } = useAuthStore();
  const { sendFeedback, sending } = useFeedbackStore();
  const { appName } = useAppSettingsStore();

  const [category, setCategory] = useState<string>('feature');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) {
      Alert.alert('Missing message', 'Please enter your feedback.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendFeedback({
        userId: user?.uid ?? 'anonymous',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
        userEmail: user?.email ?? '',
        category: CATEGORIES.find((c) => c.value === category)?.value ?? 'other',
        message: message.trim(),
        rating,
      });
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    }
  }, [message, category, rating, user, sendFeedback]);

  const handleStarPress = (star: number) => {
    Haptics.selectionAsync();
    setRating(rating === star ? null : star);
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { paddingTop: insets.top + 80 }]}>
          <View style={[styles.successIcon, { backgroundColor: withPrimaryOpacity(0.12) }]}>
            <CheckCircle size={48} color={PRIMARY} strokeWidth={1.5} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Thank you!</Text>
          <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
            Your feedback has been received. We appreciate you helping improve {appName}.
          </Text>
          <GradientButton
            onPress={() => router.back()}
            style={{ marginTop: 32, alignSelf: 'center', minWidth: 160 }}
          >
            Done
          </GradientButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Send Feedback</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: PRIMARY }]}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isActive ? withPrimaryOpacity(0.1) : colors.card,
                    borderColor: isActive ? withPrimaryOpacity(0.4) : colors.border,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setCategory(cat.value); }}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: isActive ? `${cat.color}20` : colors.muted }]}>
                  <Icon size={18} color={isActive ? cat.color : colors.mutedForeground} strokeWidth={2.2} />
                </View>
                <Text style={[styles.categoryLabel, { color: isActive ? cat.color : colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: PRIMARY }]}>Your Feedback</Text>
        <View style={[styles.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            placeholder="Tell us what is on your mind..."
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
            {message.length}/1000
          </Text>
        </View>

        <Text style={[styles.label, { color: PRIMARY }]}>Rating (optional)</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.6} style={styles.starBtn}>
              <Star
                size={32}
                color={rating && star <= rating ? '#FFD60A' : colors.mutedForeground}
                fill={rating && star <= rating ? '#FFD60A' : 'transparent'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ))}
          {rating && (
            <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent'}
            </Text>
          )}
        </View>

        <GradientButton
          onPress={handleSubmit}
          loading={sending}
          disabled={!message.trim() || sending}
          icon={Send}
          style={{ marginTop: 24, marginHorizontal: 12 }}
        >
          {sending ? 'Sending...' : 'Submit Feedback'}
        </GradientButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  container: { flex: 1, paddingTop: 20 },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2, marginBottom: 10, marginLeft: 20 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  categoryCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  textAreaWrap: {
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  textArea: { fontSize: 15, lineHeight: 22, minHeight: 140 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 13, fontWeight: '500', marginLeft: 4 },
  successContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  successSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
