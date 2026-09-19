import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Share2,
  Lock,
  Check,
  Copy,
  Play,
  Heart,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { LayoutGrid } from 'lucide-react-native';

import { usePromptsStore } from '@/store/prompts';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFavoritesStore } from '@/store/favorites';
import { useCategoriesStore } from '@/store/categories';
import { PRIMARY, withPrimaryOpacity } from '@/theme/colors';
import { useRewardAd } from '@/components/reward-ad';
import { VideoPlayer } from '@/components/video-player';
import { useRelatedPromptsQuery } from '@/lib/queries';
import { trackEvent, trackStat } from '@/lib/analytics';
import { hasPlayableVideo } from '@repo/shared/video';
import { Colors } from '@/theme/colors';
import { LikeButton } from '@/components/animated';
import { PromptCard } from '@/components/prompt-card';
import { prefetchPromptImages } from '@/lib/prefetch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Prompt Detail — premium dark screen per design:
 * floating pill header (back, like chip, share), hero image card below
 * the header (no overlap), blurred prompt string card, unlock/copy CTA,
 * and related prompts.
 *
 * Copy Prompt plays a video (reward) ad first — the prompt is copied
 * only after the ad completes.
 */
export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  const { prompts, incrementShares, incrementLikes, decrementLikes } = usePromptsStore();
  const { likedIds, toggleLike, isUnlocked } = useFavoritesStore();
  const { getCategoryById } = useCategoriesStore();
  const { showRewardAd } = useRewardAd();

  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const blurTargetRef = useRef(null);

  const prompt = prompts.find((p) => p.id === id);
  const isLiked = prompt ? likedIds.includes(prompt.id) : false;
  const isPremiumLocked = prompt?.isPremium && !isUnlocked(prompt.id);
  const category = prompt ? getCategoryById(prompt.categoryIds?.[0]) : null;

  useEffect(() => {
    if (id) {
      trackEvent('prompt_view', { promptId: id });
      trackStat('promptViews');
    }
  }, [id]);

  // Prefetch adjacent prompt images (next 4 in the same category) for instant scroll
  useEffect(() => {
    if (!prompt) return;
    const categoryId = prompt.categoryIds?.[0];
    if (!categoryId) return;

    const categoryPrompts = prompts
      .filter((p) => p.categoryIds?.includes(categoryId) && p.id !== prompt.id)
      .slice(0, 4);

    if (categoryPrompts.length > 0) {
      prefetchPromptImages(categoryPrompts);
    }
  }, [prompt?.id]);

  // Related prompts
  const {
    data: morePrompts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: relatedLoading,
  } = useRelatedPromptsQuery(
    prompt?.categoryIds?.[0] ?? '',
    prompt?.id ?? ''
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Handlers ──────────────────────────────────────────────────────

  /** Copy after a completed video ad. Non-premium prompts also gate on ad. */
  const handleCopy = async () => {
    if (!prompt || isPremiumLocked || copied) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUnlocking(true);
    try {
      // Play video ad first — copy only after it completes
      const completed = await showRewardAd(prompt.id);
      if (!completed) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(prompt.text);
      setCopied(true);
      trackEvent('prompt_copy', { promptId: prompt.id });
      trackStat('copies');
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setUnlocking(false);
    }
  };

  const handleLike = () => {
    if (!prompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasLiked = toggleLike(prompt.id);
    if (wasLiked) {
      incrementLikes(prompt.id);
    } else {
      decrementLikes(prompt.id);
    }
    trackEvent(wasLiked ? 'prompt_like' : 'prompt_unlike', { promptId: prompt.id });
    if (wasLiked) trackStat('likes');
  };

  const handleShare = async () => {
    if (!prompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const deepLink = `promptgallery://prompt/${prompt.id}`;
      await Share.share({
        message: `${prompt.text}\n\nCheck this prompt on PromptSeen: ${deepLink}`,
        url: deepLink,
      });
    } catch {}
    incrementShares(prompt.id);
    trackEvent('prompt_share', { promptId: prompt.id });
    trackStat('shares');
  };

  const handleUnlock = async () => {
    if (!prompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUnlocking(true);
    try {
      await showRewardAd(prompt.id);
      trackEvent('premium_unlock', { promptId: prompt.id });
    } finally {
      setUnlocking(false);
    }
  };

  const handlePlayVideo = () => {
    if (!prompt || !hasPlayableVideo(prompt.video)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPremiumLocked) {
      void handleUnlock();
      return;
    }
    setShowVideo(true);
    trackEvent('prompt_video_play', { promptId: prompt.id });
  };

  if (!prompt) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.notFoundCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.notFoundIcon, { backgroundColor: withPrimaryOpacity(0.12) }]}>
            <Text style={styles.notFoundEmoji}>🔍</Text>
          </View>
          <Text style={[styles.notFoundTitle, { color: colors.text }]}>Prompt Not Found</Text>
          <Text style={[styles.notFoundDesc, { color: colors.mutedForeground }]}>
            This prompt may have been removed or the link is invalid.
          </Text>
          <TouchableOpacity
            style={[styles.notFoundBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            activeOpacity={0.85}
          >
            <ChevronLeft size={18} color="#fff" />
            <Text style={styles.notFoundBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const video = hasPlayableVideo(prompt.video) ? prompt.video : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Floating Pill Header (on top, image scrolls below it) ──── */}
      <View
        style={[
          styles.headerBar,
          { top: insets.top + 4 },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.headerBtn, styles.headerBtnGlass]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Prompt Details
        </Text>

        {/* Like count pill — solid orange */}
        <TouchableOpacity
          style={[styles.headerBtn, styles.likeChip]}
          onPress={handleLike}
          activeOpacity={0.8}
        >
          <Heart
            size={13}
            color="#fff"
            fill={isLiked ? '#fff' : 'transparent'}
          />
          <Text style={styles.likeChipText}>{prompt.likesCount}</Text>
        </TouchableOpacity>

        {/* Share button — glass circle */}
        <TouchableOpacity
          style={[styles.headerBtn, styles.headerBtnGlass]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={17} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const isNearBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
          if (isNearBottom) loadMore();
        }}
        scrollEventThrottle={100}
      >
        {/* ── Hero Image Card — below the header, never overlapping ── */}
        <Animated.View
          style={styles.imageFrame}
        >
          <Image
            source={prompt.imageUrl}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />

          {/* Top scrim so glass buttons read over the image */}
          <View style={styles.topScrim} pointerEvents="none" />

          {/* Video play button */}
          {hasPlayableVideo(prompt.video) && (
            <TouchableOpacity
              style={styles.playOverlay}
              onPress={handlePlayVideo}
              activeOpacity={0.85}
            >
              <View style={styles.playCircle}>
                <Play size={28} color="#fff" fill="#fff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Status badge — lowercase pill like the reference */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {category ? category.name.toLowerCase() : 'trending'}
            </Text>
          </View>
        </Animated.View>

        {/* ── Video Player (injected inline when playing) ───────────── */}
        {showVideo && video && (
          <Animated.View

            style={[styles.videoSection, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.videoHeader}>
              <Text style={[styles.videoHeaderText, { color: colors.primary }]}>
                {video.type === 'youtube' ? 'YouTube video' : 'Prompt video'}
              </Text>
              <TouchableOpacity onPress={() => setShowVideo(false)} activeOpacity={0.7}>
                <Text style={[styles.videoClose, { color: colors.mutedForeground }]}>Close</Text>
              </TouchableOpacity>
            </View>
            <VideoPlayer video={video} fallbackThumbnailUrl={prompt.imageUrl} />
          </Animated.View>
        )}

        {/* ── Prompt String Card — always blurred ───────────────────── */}
        <Animated.View
          style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.promptCardHeader}>
            <Text style={[styles.promptLabel, { color: colors.primary }]}>PROMPT STRING</Text>
            <View style={styles.promptStats}>
              <View style={styles.promptStatItem}>
                <Copy size={12} color={colors.mutedForeground} />
                <Text style={[styles.promptStatText, { color: colors.mutedForeground }]}>
                  {prompt.copiesCount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.promptStatItem}>
                <Share2 size={12} color={colors.mutedForeground} />
                <Text style={[styles.promptStatText, { color: colors.mutedForeground }]}>
                  {prompt.shareCount?.toLocaleString() ?? '0'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.promptTextWrap} ref={blurTargetRef}>
            {isPremiumLocked ? (
              <>
                <Text style={[styles.promptText, styles.blurredText, { color: colors.text }]} numberOfLines={4}>
                  {prompt.text}
                </Text>
                {/* Guaranteed frost: a strong veil OVER the text. Real blur is
                    layered on top where the platform supports it, but the
                    frosted look never depends on BlurView rendering. */}
                <View
                  style={[styles.frostVeil, { backgroundColor: isDark ? 'rgba(16,10,5,0.58)' : 'rgba(255,255,255,0.62)' }]}
                  pointerEvents="none"
                />
                <BlurView
                  intensity={isDark ? 60 : 50}
                  tint={isDark ? 'dark' : 'light'}
                  blurMethod="dimezisBlurView"
                  blurTarget={blurTargetRef}
                  style={styles.blurOverlay}
                >
                  <TouchableOpacity
                    style={styles.blurTouchable}
                    onPress={handleUnlock}
                    activeOpacity={0.8}
                  >
                    <View style={styles.lockPill}>
                      <Lock size={13} color={colors.primary} />
                      <Text style={[styles.lockText, { color: colors.primary }]}>
                        Tap to unlock prompt
                      </Text>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              </>
            ) : (
              <>
                <Text style={[styles.promptText, styles.blurredText, { color: colors.text }]} numberOfLines={6}>
                  {prompt.text}
                </Text>
                <View
                  style={[styles.frostVeil, { backgroundColor: isDark ? 'rgba(16,10,5,0.55)' : 'rgba(255,255,255,0.6)' }]}
                  pointerEvents="none"
                />
                <BlurView
                  intensity={isDark ? 55 : 45}
                  tint={isDark ? 'dark' : 'light'}
                  blurMethod="dimezisBlurView"
                  blurTarget={blurTargetRef}
                  style={styles.blurOverlay}
                >
                  <TouchableOpacity
                    style={styles.blurTouchable}
                    onPress={handleCopy}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.lockPill, styles.copyPill]}>
                      {copied ? (
                        <Check size={13} color="#51CF66" strokeWidth={3} />
                      ) : (
                        <Copy size={13} color="#51CF66" />
                      )}
                      <Text style={[styles.lockText, { color: '#51CF66' }]}>
                        {copied ? 'Copied to clipboard' : 'Tap to reveal & copy'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              </>
            )}
          </View>
        </Animated.View>

        {/* ── Action Button — orange gradient CTA ──────────────────── */}
        {isPremiumLocked ? (
          <Animated.View
          >
            <TouchableOpacity
              style={[styles.ctaWrap, unlocking && { opacity: 0.7 }]}
              onPress={handleUnlock}
              disabled={unlocking}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                {unlocking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Lock size={17} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>
                  {unlocking ? 'Unlocking...' : 'Unlock Prompt'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
          >
            <TouchableOpacity
              style={[styles.ctaWrap, unlocking && { opacity: 0.7 }]}
              onPress={handleCopy}
              disabled={unlocking}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                {unlocking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : copied ? (
                  <Check size={17} color="#fff" strokeWidth={3} />
                ) : (
                  <Copy size={17} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>
                  {unlocking
                    ? 'Watch ad to copy...'
                    : copied
                      ? 'Copied!'
                      : 'Copy Prompt'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Generate with AI ──────────────────────────────────────── */}
        <View style={styles.aiSection}>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: '#10A37F', borderColor: '#10A37F' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(`https://chatgpt.com/?q=${encodeURIComponent(prompt.text)}`);
            }}
            activeOpacity={0.85}
          >
            <Sparkles size={16} color="#fff" />
            <Text style={styles.aiButtonText}>Generate with ChatGPT</Text>
            <ExternalLink size={13} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: '#1A73E8', borderColor: '#1A73E8' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(`https://gemini.google.com/app?prompt=${encodeURIComponent(prompt.text)}`);
            }}
            activeOpacity={0.85}
          >
            <Sparkles size={16} color="#fff" />
            <Text style={styles.aiButtonText}>Generate with Gemini</Text>
            <ExternalLink size={13} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* ── Related Prompts ────────────────────────────────────────── */}
        {morePrompts.length > 0 && (
          <Animated.View
            style={styles.moreSection}
          >
            <View style={styles.moreHeader}>
              <LayoutGrid size={16} color={PRIMARY} />
              <Text style={[styles.moreTitle, { color: colors.text }]}>
                More Prompts
              </Text>
            </View>

            <View style={styles.moreGrid}>
              {morePrompts.map((rp, i) => (
                <PromptCard key={rp.id} prompt={rp} isLiked={likedIds.includes(rp.id)} index={Math.min(i, 6)} compact />
              ))}
            </View>

            {isFetchingNextPage && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={[styles.loadingMoreText, { color: colors.mutedForeground }]}>
                  Loading more...
                </Text>
              </View>
            )}

            {!hasNextPage && !relatedLoading && (
              <View style={styles.endOfList}>
                <View style={[styles.endOfListDot, { backgroundColor: colors.border }]} />
                <Text style={[styles.endOfListText, { color: colors.mutedForeground }]}>
                  That's all the related prompts for now
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {relatedLoading && morePrompts.length === 0 && (
          <View style={styles.moreSection}>
            <View style={styles.moreHeader}>
              <LayoutGrid size={16} color={PRIMARY} />
              <Text style={[styles.moreTitle, { color: colors.text }]}>More Prompts</Text>
            </View>
            <View style={styles.loadingMore}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={[styles.loadingMoreText, { color: colors.mutedForeground }]}>
                Loading related prompts...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15 },

  // ── Not Found ────────────────────────────────────────────────────
  notFoundCard: {
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
  },
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  notFoundEmoji: { fontSize: 32 },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  notFoundDesc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  notFoundBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Floating Pill Header ─────────────────────────────────────────
  headerBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnGlass: {
    width: 34,
    backgroundColor: 'rgba(120,110,100,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(140,130,120,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  likeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  likeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },

  // ── Hero Image ─────────────────────────────────────────────────────
  imageFrame: {
    margin: 14,
    marginTop: 100,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },
  heroImage: {
    width: SCREEN_WIDTH - 28,
    height: SCREEN_WIDTH - 28,
  },
  topScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  // Glass action buttons ON the hero image (unused after dedup, kept minimal)
  categoryBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(238,140,60,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },

  // ── Video ──────────────────────────────────────────────────────────
  videoSection: {
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(30,24,18,0.65)',
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  videoHeaderText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  videoClose: { fontSize: 12, fontWeight: '600' },

  // ── Prompt Card ────────────────────────────────────────────────────
  promptCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(30,24,18,0.65)',
    padding: 16,
    shadowColor: '#5B5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  promptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  promptLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  promptStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promptStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promptStatText: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  promptTextWrap: {
    minHeight: 132,
    borderRadius: 12,
    overflow: 'hidden',
  },
  promptText: { fontSize: 15, lineHeight: 24, fontWeight: '500', padding: 4 },
  blurredText: { opacity: 0.5 },
  frostVeil: {
    ...StyleSheet.absoluteFill,
  },

  // Blur overlay
  blurOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Locked / blur overlay
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(60,50,40,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(140,130,120,0.2)',
  },
  copyPill: {
    borderColor: 'rgba(81,207,102,0.35)',
    // Dark glass in BOTH themes so the green text always reads clearly
    backgroundColor: 'rgba(8,18,11,0.78)',
  },
  lockText: { fontSize: 13, fontWeight: '700' },

  // ── Buttons ──────────────────────────────────────────────────────────
  ctaWrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // ── AI Generate Buttons ──────────────────────────────────────────
  aiSection: {
    marginHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── Related Prompts ────────────────────────────────────────────────
  moreSection: { marginTop: 4 },
  moreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  moreTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    columnGap: 10,
    rowGap: 10,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: { fontSize: 13, fontWeight: '500' },
  endOfList: { alignItems: 'center', paddingVertical: 18, gap: 8 },
  endOfListDot: { width: 6, height: 6, borderRadius: 3 },
  endOfListText: { fontSize: 12, fontWeight: '500' },
});
