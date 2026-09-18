import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Haptics from 'expo-haptics';
import { shareAsync } from 'expo-sharing';
import { Heart, Copy, Sparkles } from 'lucide-react-native';
import type { Prompt } from '@repo/shared/types';
import { PRIMARY, withPrimaryOpacity } from '@/theme/colors';

interface ShareCardProps {
  prompt: Prompt;
  categoryName?: string;
  categoryIcon?: string;
}

export interface ShareCardHandle {
  share: () => Promise<void>;
}

/**
 * Generates a beautiful branded shareable card for a prompt.
 *
 * The card includes:
 * - Prompt image as background
 * - Gradient overlay
 * - Prompt text
 * - App branding (TS Prompt logo)
 * - Category badge
 */
export const ShareCard = forwardRef<ShareCardHandle, ShareCardProps>(
  function ShareCard({ prompt, categoryName, categoryIcon }, ref) {
    const cardRef = useRef<View>(null);

    const share = useCallback(async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 0.9,
          result: 'tmpfile',
        });

        await shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share this prompt',
          UTI: 'public.png',
        });
      } catch (error) {
        // Fallback to text-only share
        const { Share } = require('react-native');
        await Share.share({
          message: `${prompt.text}\n\n— via TS Prompt`,
        });
      }
    }, [prompt]);

    useImperativeHandle(ref, () => ({ share }), [share]);

    return (
      <View style={styles.hiddenContainer}>
        <View ref={cardRef} style={styles.card}>
          {/* Background image */}
          <Image
            source={{ uri: prompt.imageUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />

          {/* Gradient overlays */}
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />

          {/* Content */}
          <View style={styles.content}>
            {/* Top branding */}
            <View style={styles.topRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>PS</Text>
              </View>
              <Text style={styles.brandName}>TS Prompt</Text>
            </View>

            {/* Prompt text */}
            <View style={styles.textContainer}>
              <Text style={styles.promptText} numberOfLines={6}>
                {prompt.text}
              </Text>
            </View>

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              {categoryIcon && categoryName && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                  <Text style={styles.categoryName}>{categoryName}</Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Heart size={11} color="#A89C90" fill="#A89C90" />
                  <Text style={styles.statText}>
                    {prompt.likesCount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Copy size={11} color="#A89C90" />
                  <Text style={styles.statText}>
                    {prompt.copiesCount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Watermark */}
            <View style={styles.watermarkRow}>
              <Sparkles size={10} color="rgba(184,149,106,0.6)" />
              <Text style={styles.watermark}>
                Get more prompts — Download TS Prompt
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  card: {
    width: 400,
    height: 500,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#141210',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  gradientTop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(13,5,0,0.85)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EDE8E4',
    letterSpacing: -0.3,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: withPrimaryOpacity(0.15),
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#A89C90',
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  watermark: {
    fontSize: 11,
    color: 'rgba(184,149,106,0.6)',
  },
});
