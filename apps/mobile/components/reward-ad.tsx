import { useCallback } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { useFavoritesStore } from '@/store/favorites';
import { trackEvent, trackStat } from '@/lib/analytics';

/**
 * Hook to show a reward ad and unlock a premium prompt.
 *
 * Usage:
 * ```tsx
 * const { showRewardAd } = useRewardAd();
 * await showRewardAd('prompt-id-123');
 * ```
 */
export function useRewardAd() {
  const { unlockPremium } = useFavoritesStore();

  const showRewardAd = useCallback(
    (promptId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const rewarded = RewardedAd.createForAdRequest(
          process.env.EXPO_PUBLIC_ADMOB_REWARD_AD_UNIT_ID ?? ''
        );

        let resolved = false;

        const safeResolve = (value: boolean) => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(value);
          }
        };

        const unsubLoaded = rewarded.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            rewarded.show();
          }
        );

        const unsubEarned = rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            unlockPremium(promptId);
            trackEvent('ad_reward_complete', { promptId });
            trackStat('adImpressions');
            safeResolve(true);
          }
        );

        const unsubClosed = rewarded.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            safeResolve(false);
          }
        );

        const unsubError = rewarded.addAdEventListener(
          AdEventType.ERROR,
          () => {
            safeResolve(false);
          }
        );

        const cleanup = () => {
          unsubLoaded();
          unsubEarned();
          unsubClosed();
          unsubError();
        };

        rewarded.load();
      });
    },
    [unlockPremium]
  );

  return { showRewardAd };
}
