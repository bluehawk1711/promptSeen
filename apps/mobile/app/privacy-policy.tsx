import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Mail } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { useAppSettingsStore } from '@/store/app-settings';

/**
 * Privacy Policy — simple, readable policy screen.
 *
 * Content is static and app-branded. The support email comes from remote
 * app settings so users can always reach a real inbox.
 */

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What we collect',
    body: 'We collect minimal data needed to run the app: your app preferences (theme, favorites, collections) stored on your device, and anonymous usage statistics (prompt views, copies, shares) used to improve the experience. No personal information is required to use the app.',
  },
  {
    title: 'How we use your data',
    body: 'Anonymous usage data helps us understand which prompts are popular so we can curate better content. Your favorites and collections stay on your device unless you sign in, in which case they sync securely through Firebase to give you a seamless experience across devices.',
  },
  {
    title: 'Advertising',
    body: 'The app uses Google AdMob to show ads (banners and rewarded video ads) that keep the app free. AdMob may collect device identifiers to serve relevant ads as described in Google\'s Privacy Policy. Rewarded ads are only shown when you choose to watch them.',
  },
  {
    title: 'Data sharing',
    body: 'We do not sell, trade, or rent your personal information to third parties. Data is shared only with the services required to run the app: Google Firebase (hosting, database, authentication) and Google AdMob (advertising), each governed by their own privacy policies.',
  },
  {
    title: 'Data security',
    body: 'All data transmitted between the app and our servers is encrypted using industry-standard TLS. Firestore security rules restrict data access so your information is only readable by you.',
  },
  {
    title: 'Your choices',
    body: 'You can reset your preferences, delete favorites, or clear app data at any time from your device settings. Uninstalling the app removes all locally stored data. To request deletion of any server-side data associated with your account, contact us using the email below.',
  },
  {
    title: 'Children\'s privacy',
    body: 'The app is not directed at children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided personal information, please contact us so we can delete it.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this Privacy Policy from time to time. Changes will be posted within the app, and continued use of the app after an update constitutes acceptance of the revised policy.',
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { settings } = useAppSettingsStore();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.introIcon, { backgroundColor: withPrimaryOpacity(0.12) }]}>
            <ShieldCheck size={26} color={PRIMARY} strokeWidth={2} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>Your privacy matters</Text>
          <Text style={[styles.introText, { color: colors.mutedForeground }]}>
            We collect the minimum data needed to make the app work — nothing more.
            This page explains, in plain language, what we collect and why.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, i) => (
          <View
            key={section.title}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionNumber, { color: PRIMARY }]}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{section.body}</Text>
          </View>
        ))}

        {/* Contact */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Mail size={16} color={PRIMARY} strokeWidth={2.2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact us</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>
            Questions about this policy? Reach us at{' '}
            <Text style={{ color: PRIMARY, fontWeight: '600' }}>
              {settings.supportEmail || 'support@promptseen.com'}
            </Text>
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
          Effective date: September 2026
        </Text>
      </ScrollView>
    </View>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  introCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  introTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  introText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },

  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionNumber: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 24,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
  sectionBody: { fontSize: 13.5, lineHeight: 21 },

  lastUpdated: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});
