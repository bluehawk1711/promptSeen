import { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Heart,
  Share2,
  Lock,
  Check,
  MoreHorizontal,
  Bookmark,
  Copy,
  LayoutGrid,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { usePromptsStore } from '@/store/prompts';
import { useFavoritesStore } from '@/store/favorites';
import { useCategoriesStore } from '@/store/categories';
import { useRewardAd } from '@/components/reward-ad';
import { ShareCard } from '@/components/share-card';
import { useRelatedPromptsQuery } from '@/lib/queries';
import { trackEvent, trackStat } from '@/lib/analytics';
import type { Prompt } from '@repo/shared/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Prompt Detail — premium dark theme with blurred locked content,
 * golden image frame, and infinite-scroll "More Prompts" grid.
 *
 * Related prompts are fetched with useInfiniteQuery:
 * - Initial load: 10 items
 * - Each page: 10 more items
 * - Cached for 2.5 minutes (staleTime)
 * - Scroll triggers getNextPageParam when near bottom
 */
export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { prompts, incrementShares } = usePromptsStore();
  const { likedIds, toggleLike, isUnlocked } = useFavoritesStore();
  const { getCategoryById } = useCategoriesStore();
  const { showRewardAd } = useRewardAd();

  const shareCardRef = useRef<any>(null);

  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const prompt = prompts.find((p) => p.id === id);
  const isLiked = prompt ? likedIds.includes(prompt.id) : false;
  const isPremiumLocked = prompt?.isPremium && !isUnlocked(prompt.id);
  const category = prompt ? getCategoryById(prompt.categoryId) : null;

  // Track prompt view on mount
  useState(() => {
    if (id) {
      trackEvent('prompt_view', { promptId: id });
      trackStat('promptViews');
    }
  });

  // ── Infinite scroll related prompts ─────────────────────────────────
  const {
    data: relatedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: relatedLoading,
  } = useRelatedPromptsQuery(
    prompt?.categoryId ?? '',
    prompt?.id ?? ''
  );

  // Flatten all pages into a single array
  const morePrompts = useMemo(() => {
    if (!relatedData?.pages) return [];
    return relatedData.pages.flatMap((page) => page.prompts);
  }, [relatedData]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCopy = async () => {
    if (!prompt || isPremiumLocked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(prompt.text);
    setCopied(true);
    trackEvent('prompt_copy', { promptId: prompt.id });
    trackStat('copies');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!prompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (shareCardRef.current?.share) {
      await shareCardRef.current.share();
    } else {
      const { Share } = require('react-native');
      await Share.share({
        message: `${prompt.text}\n\n— via PromptSeen`,
      });
    }

    incrementShares(prompt.id);
    trackEvent('prompt_share', { promptId: prompt.id });
    trackStat('shares');
  };

  const handleLike = () => {
    if (!prompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasLiked = toggleLike(prompt.id);
    trackEvent(wasLiked ? 'prompt_like' : 'prompt_unlike', { promptId: prompt.id });
    if (wasLiked) trackStat('likes');
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

  if (!prompt) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Prompt not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hidden ShareCard */}
      <ShareCard
        ref={shareCardRef}
        prompt={prompt}
        categoryName={category?.name}
        categoryIcon={category?.icon}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        onScroll={(e) => {
          // Trigger load more when user scrolls near the bottom
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const isNearBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
          if (isNearBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={100}
      >
        {/* ── Hero Image with Golden Frame ──────────────────────────── */}
        <View style={styles.heroSection}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={[styles.headerTitle, { top: insets.top + 12 }]}
            numberOfLines={1}
          >
            Prompt Detail
          </Text>

          {/* Bookmark & Menu */}
          <TouchableOpacity
            style={[styles.headerAction, { top: insets.top + 10, right: 52 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Bookmarked', 'Added to your bookmarks');
            }}
            activeOpacity={0.7}
          >
            <Bookmark size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerAction, { top: insets.top + 10, right: 16 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const { Share } = require('react-native');
              Share.share({
                message: `Check out this prompt on PromptSeen:\n${prompt.text}\n\nhttps://promptseen.app/prompt/${prompt.id}`,
              });
            }}
            activeOpacity={0.7}
          >
            <MoreHorizontal size={20} color="#fff" />
          </TouchableOpacity>

          {/* Image with golden frame */}
          <View style={styles.imageFrame}>
            <Image
              source={{ uri: prompt.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Golden border glow */}
            <View style={styles.goldenBorder} />

            {/* Share button (top-left) */}
            <TouchableOpacity
              style={styles.imageActionLeft}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 size={18} color="#fff" />
            </TouchableOpacity>

            {/* Heart button (top-right) */}
            <TouchableOpacity
              style={styles.imageActionRight}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Heart
                size={18}
                color={isLiked ? '#FF3B30' : '#fff'}
                fill={isLiked ? '#FF3B30' : 'transparent'}
              />
            </TouchableOpacity>

            {/* Category badge */}
            {category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {category.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Prompt String Card ────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.promptCard}
        >
          {/* Header row */}
          <View style={styles.promptCardHeader}>
            <Text style={styles.promptLabel}>PROMPT STRING</Text>
            <View style={styles.promptStats}>
              <Copy size={13} color="#B8956A" />
              <Text style={styles.promptStatText}>
                {prompt.copiesCount.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Prompt text (blurred if locked) */}
          <View style={styles.promptTextWrap}>
            {isPremiumLocked ? (
              <>
                {/* Blurred text effect */}
                <View style={styles.blurredOverlay}>
                  <Text style={styles.blurredText} numberOfLines={4}>
                    {prompt.text}
                  </Text>
                  <View style={styles.blurMask} />
                </View>
                {/* Lock overlay */}
                <TouchableOpacity
                  style={styles.lockOverlay}
                  onPress={handleUnlock}
                  activeOpacity={0.8}
                >
                  <Lock size={14} color="#FF7A2E" />
                  <Text style={styles.lockText}>Tap to unlock prompt</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.promptText}>{prompt.text}</Text>
            )}
          </View>
        </Animated.View>

        {/* ── Unlock Button ─────────────────────────────────────────── */}
        {isPremiumLocked && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={[styles.unlockButton, unlocking && styles.unlockButtonLoading]}
              onPress={handleUnlock}
              disabled={unlocking}
              activeOpacity={0.85}
            >
              {unlocking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Lock size={18} color="#fff" />
              )}
              <Text style={styles.unlockButtonText}>
                {unlocking ? 'Unlocking...' : 'Unlock Prompt'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Copy Button (when unlocked) ──────────────────────────── */}
        {!isPremiumLocked && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              {copied ? (
                <Check size={18} color="#fff" />
              ) : (
                <Copy size={18} color="#fff" />
              )}
              <Text style={styles.copyButtonText}>
                {copied ? 'Copied!' : 'Copy Prompt'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── More Prompts (infinite scroll) ───────────────────────── */}
        {morePrompts.length > 0 && (
          <View style={styles.moreSection}>
            <View style={styles.moreHeader}>
              <LayoutGrid size={16} color="#FF7A2E" />
              <Text style={styles.moreTitle}>
                More Prompts ({morePrompts.length})
              </Text>
            </View>

            <View style={styles.moreGrid}>
              {morePrompts.map((rp, i) => {
                const rpCategory = getCategoryById(rp.categoryId);
                return (
                  <TouchableOpacity
                    key={rp.id}
                    style={styles.moreCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/prompt/${rp.id}`);
                    }}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: rp.imageUrl }}
                      style={styles.moreCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.moreCardOverlay} />
                    <View style={styles.moreCardContent}>
                      <Text style={styles.moreCardTitle} numberOfLines={2}>
                        {rp.text}
                      </Text>
                      <Text style={styles.moreCardCategory} numberOfLines={1}>
                        {rpCategory?.name ?? 'Prompt'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#FF7A2E" />
                <Text style={styles.loadingMoreText}>Loading more prompts...</Text>
              </View>
            )}

            {/* End of list indicator */}
            {!hasNextPage && morePrompts.length > 10 && (
              <View style={styles.endOfList}>
                <Text style={styles.endOfListText}>You've seen all related prompts</Text>
              </View>
            )}
          </View>
        )}

        {/* Loading state for related prompts */}
        {relatedLoading && morePrompts.length === 0 && (
          <View style={styles.moreSection}>
            <View style={styles.moreHeader}>
              <LayoutGrid size={16} color="#FF7A2E" />
              <Text style={styles.moreTitle}>More Prompts</Text>
            </View>
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#FF7A2E" />
              <Text style={styles.loadingMoreText}>Loading related prompts...</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0500',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0500',
  },
  emptyText: {
    color: '#B8956A',
    fontSize: 15,
  },

  // ── Header ──────────────────────────────────────────────────────────
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    position: 'absolute',
    left: 64,
    right: 140,
    color: '#FFF5EB',
    fontSize: 17,
    fontWeight: '700',
    zIndex: 10,
  },
  headerAction: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // ── Hero Image ──────────────────────────────────────────────────────
  heroSection: {
    position: 'relative',
  },
  imageFrame: {
    margin: 14,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: SCREEN_WIDTH - 28,
    height: SCREEN_WIDTH - 28,
  },
  goldenBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,180,50,0.4)',
  },
  imageActionLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  imageActionRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,122,46,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Prompt Card ─────────────────────────────────────────────────────
  promptCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#1C0E02',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,122,46,0.15)',
    padding: 16,
  },
  promptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF7A2E',
    letterSpacing: 0.5,
  },
  promptStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promptStatText: {
    fontSize: 12,
    color: '#B8956A',
    fontWeight: '500',
  },
  promptTextWrap: {
    minHeight: 80,
  },
  promptText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#FFF5EB',
    fontWeight: '500',
  },

  // Blurred / locked state
  blurredOverlay: {
    position: 'relative',
  },
  blurredText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#FFF5EB',
    fontWeight: '500',
    opacity: 0.15,
  },
  blurMask: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28,14,2,0.85)',
  },
  lockOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  lockText: {
    fontSize: 13,
    color: '#FF7A2E',
    fontWeight: '600',
  },

  // ── Unlock Button ───────────────────────────────────────────────────
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#FF7A2E',
    shadowColor: '#FF7A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  unlockButtonLoading: {
    opacity: 0.7,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Copy Button ─────────────────────────────────────────────────────
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#FF7A2E',
    shadowColor: '#FF7A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── More Prompts (infinite scroll) ──────────────────────────────────
  moreSection: {
    marginTop: 4,
  },
  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  moreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF5EB',
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  moreCard: {
    width: (SCREEN_WIDTH - 38) / 2,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1C0E02',
  },
  moreCardImage: {
    width: '100%',
    height: '100%',
  },
  moreCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  moreCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(13,5,0,0.8)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  moreCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF5EB',
    lineHeight: 17,
    marginBottom: 3,
  },
  moreCardCategory: {
    fontSize: 10,
    color: '#B8956A',
    fontWeight: '500',
  },

  // ── Loading / End states ────────────────────────────────────────────
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#B8956A',
    fontWeight: '500',
  },
  endOfList: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  endOfListText: {
    fontSize: 12,
    color: '#6B5A4A',
    fontWeight: '500',
  },
});
