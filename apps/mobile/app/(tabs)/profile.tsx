import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Share } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated from 'react-native-reanimated';
import {
  Moon,
  Sun,
  Monitor,
  Heart,
  ChevronRight,
  Check,
  Share2,
  Star,
  Mail,
  Send as TelegramIcon,
  Camera as InstagramIcon,
  MessageCircle,
  Globe,
  Play as YoutubeIcon,
  ThumbsUp as FacebookIcon,
  Music2,
  ShieldCheck,
  MessageSquarePlus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { useThemeStore, type ThemeMode } from '@/store/theme';
import { useFavoritesStore } from '@/store/favorites';
import { useAppSettingsStore, APP_VERSION } from '@/store/app-settings';
import { CountUp } from '@/components/animated';
import { GradientCard } from '@/components/ui/gradient-card';
import { GradientHeader } from '@/components/ui/gradient-header';

const THEME_OPTIONS: { value: ThemeMode; label: string; subtitle: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', subtitle: 'Bright & clean look', icon: Sun },
  { value: 'dark', label: 'Dark', subtitle: 'Easy on the eyes', icon: Moon },
  { value: 'system', label: 'System', subtitle: 'Match device setting', icon: Monitor },
];

/** Icon for a social platform key. */
function socialIcon(platform: string): typeof Globe {
  switch (platform) {
    case 'telegram':
      return TelegramIcon;
    case 'instagram':
      return InstagramIcon;
    case 'whatsapp':
      return MessageCircle;
    case 'x':
      return Globe;
    case 'youtube':
      return YoutubeIcon;
    case 'facebook':
      return FacebookIcon;
    case 'tiktok':
      return Music2;
    default:
      return Globe;
  }
}

/** Brand color per social platform. */
function socialColor(platform: string): string {
  switch (platform) {
    case 'telegram':
      return '#2AABEE';
    case 'instagram':
      return '#E4405F';
    case 'whatsapp':
      return '#25D366';
    case 'x':
      return '#FFFFFF';
    case 'youtube':
      return '#FF0000';
    case 'facebook':
      return '#1877F2';
    case 'tiktok':
      return '#FF0050';
    default:
      return PRIMARY;
  }
}

/** Subtitle for a social platform when the admin hasn't set one. */
function socialDefaultSubtitle(platform: string): string {
  switch (platform) {
    case 'telegram':
      return 'Join our Telegram channel';
    case 'instagram':
      return 'Follow us on Instagram';
    case 'whatsapp':
      return 'Join our WhatsApp channel';
    case 'youtube':
      return 'Subscribe on YouTube';
    case 'facebook':
      return 'Follow us on Facebook';
    default:
      return 'Follow us';
  }
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { likedIds } = useFavoritesStore();
  const { settings, appName } = useAppSettingsStore();
  const activeSocials = [...settings.socialLinks]
    .filter((l) => l.isActive)
    .sort((a, b) => a.order - b.order);

  const stats = [
    { icon: Heart, count: likedIds.length, label: 'Favorites', subtitle: 'Prompts you saved', color: '#FF4B4B' },
  ];

  const openLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card — glowing logo, app name, version badge ────────── */}
        <Animated.View
          style={styles.heroWrap}
        >
          <GradientCard variant="glow" style={styles.heroCard}>
            {/* Glow rings behind the logo */}
            <View style={styles.heroGlowRing}>
              <View style={[styles.heroGlowRing2, { backgroundColor: withPrimaryOpacity(0.08) }]} />
              <View style={styles.heroLogo}>
                <Image
                  source={require('@/assets/images/app_logo-transparent.png')}
                  style={styles.heroLogoImage}
                  contentFit="contain"
                />
              </View>
            </View>

            <Text style={[styles.heroAppName, { color: colors.text }]}>{appName}</Text>
            <Text style={[styles.heroTagline, { color: colors.mutedForeground }]}>
              Your AI-Powered Creative Companion
            </Text>

            <View style={[styles.heroVersionBadge, { borderColor: withPrimaryOpacity(0.35) }]}>
              <Text style={[styles.heroVersionText, { color: PRIMARY }]}>
                v{APP_VERSION} · Build {APP_VERSION.split('.')[2] ?? '0'}
              </Text>
            </View>
          </GradientCard>
        </Animated.View>

        {/* ── Account — privacy, stats, appearance ───────────────── */}
        <Text style={[styles.sectionTitle, { color: PRIMARY }]}>Account</Text>

        {/* Privacy Policy row (per reference) */}
        <Animated.View>
          <TouchableOpacity
            style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/privacy-policy');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(77,171,247,0.14)' }]}>
              <ShieldCheck size={18} color="#4DABF7" strokeWidth={2.2} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Privacy Policy</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                How we handle your data
              </Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Animated.View>

        {/* Favorites — tappable, opens the Favorites tab */}
        <View style={[styles.rowCardStack, { marginTop: 10 }]}>
          {stats.map((stat) => (
            <TouchableOpacity
              key={stat.label}
              style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/favorites');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: `${stat.color}1F` }]}>
                <stat.icon size={18} color={stat.color} strokeWidth={2.2} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{stat.label}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  {stat.subtitle}
                </Text>
              </View>
              <CountUp
                value={stat.count}
                style={[styles.rowCount, { color: PRIMARY }]}
              />
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Appearance — individual row-cards with checkmark on active */}
        <Text style={[styles.sectionTitle, { color: PRIMARY }]}>Appearance</Text>
        <View style={styles.rowCardStack}>
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = themeMode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.rowCard,
                  { backgroundColor: colors.card, borderColor: isActive ? withPrimaryOpacity(0.4) : colors.border },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemeMode(option.value);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.rowIconWrap,
                    {
                      backgroundColor: isActive ? withPrimaryOpacity(0.14) : colors.muted,
                    },
                  ]}
                >
                  <Icon
                    size={18}
                    color={isActive ? PRIMARY : colors.mutedForeground}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text
                    style={[
                      styles.rowTitle,
                      { color: isActive ? PRIMARY : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    {option.subtitle}
                  </Text>
                </View>
                {isActive && (
                  <View style={[styles.checkmark, { backgroundColor: PRIMARY }]}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Support & Feedback ───────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: PRIMARY }]}>Support & Feedback</Text>
        <View style={styles.rowCardStack}>
          {/* Send Feedback — opens feedback form */}
          <Animated.View>
            <TouchableOpacity
              style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/feedback' as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(124,58,237,0.14)' }]}>
                <MessageSquarePlus size={18} color={PRIMARY} strokeWidth={2.2} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Send Feedback</Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  Report bugs, suggest features
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View>
            <TouchableOpacity
              style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void Share.share({ message: `Download ${appName} — your AI prompt companion!` });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(81,207,102,0.14)' }]}>
                <Share2 size={18} color="#51CF66" strokeWidth={2.2} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Share App</Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  Tell your friends
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Animated.View>

          {(
            <Animated.View>
              <TouchableOpacity
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openLink(settings.playStoreUrl || 'https://play.google.com/store/search?q=prompt%20seen')}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(255,214,10,0.14)' }]}>
                  <Star size={18} color="#FFD60A" strokeWidth={2.2} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Rate Us</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    Leave a review
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {(
            <Animated.View>
              <TouchableOpacity
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openLink(settings.supportEmail ? `mailto:${settings.supportEmail}` : 'mailto:support@promptseen.com')}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(228,64,95,0.14)' }]}>
                  <Mail size={18} color="#E4405F" strokeWidth={2.2} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Contact Support</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    Get help & feedback
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* ── Connect With Us — from remote settings ───────────────────── */}
        {activeSocials.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: PRIMARY }]}>Connect With Us</Text>
            <View style={styles.rowCardStack}>
              {activeSocials.map((link, i) => {
                const Icon = socialIcon(link.platform);
                const tint = socialColor(link.platform);
                return (
                  <Animated.View
                    key={link.id}
                  >
                    <TouchableOpacity
                      style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => openLink(link.url)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.rowIconWrap, { backgroundColor: `${tint}1F` }]}>
                        <Icon size={18} color={tint} strokeWidth={2.2} />
                      </View>
                      <View style={styles.rowTextWrap}>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>{link.label}</Text>
                        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                          {link.subtitle ?? socialDefaultSubtitle(link.platform)}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        {/* ── About — from remote settings ─────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: PRIMARY }]}>About</Text>
        <Animated.View>
          <GradientCard variant="border" style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutLogo}>
                <Image
                  source={require('@/assets/images/app_logo-transparent.png')}
                  style={styles.aboutLogoImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.aboutHeaderText}>
                <Text style={[styles.aboutAppName, { color: colors.text }]}>{appName}</Text>
                <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
                  v{APP_VERSION}
                </Text>
              </View>
            </View>
            {settings.aboutText ? (
              <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
                {settings.aboutText}
              </Text>
            ) : null}
          </GradientCard>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  // ── Hero Card ────────────────────────────────────────────────────────
  heroWrap: { marginHorizontal: 12, marginTop: 8 },
  heroCard: {
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroGlowRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: withPrimaryOpacity(0.35),
    backgroundColor: withPrimaryOpacity(0.06),
  },
  heroGlowRing2: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  heroLogo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0A14',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  heroLogoImage: { width: 56, height: 56 },
  heroAppName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  heroTagline: { fontSize: 13, fontWeight: '500', marginBottom: 16 },
  heroVersionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: withPrimaryOpacity(0.06),
  },
  heroVersionText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // ── Section titles — orange, left accent bar like reference ────────
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 26,
    marginBottom: 10,
    marginLeft: 20,
  },

  // ── Individual row-cards (reference style) ─────────────────────────
  rowCardStack: { gap: 12 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  rowSubtitle: { fontSize: 12, marginTop: 2 },

  // ── Grouped section card (appearance, submissions) ──────────────────
  section: {
    marginHorizontal: 12,
    borderRadius: 16,
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
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },

  // ── Stats ────────────────────────────────────────────────────────────
  rowCount: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },


  // ── About ────────────────────────────────────────────────────────────
  aboutCard: {
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 16,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aboutLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0A14',
    overflow: 'hidden',
  },
  aboutLogoImage: { width: 36, height: 36 },
  aboutHeaderText: { flex: 1 },
  aboutAppName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  aboutVersion: { fontSize: 12, marginTop: 2, fontVariant: ['tabular-nums'] },
  aboutText: { fontSize: 13, lineHeight: 21 },
});
