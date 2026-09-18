import { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { trackEvent, trackStat } from '@/lib/analytics';

interface AdBannerProps {
  style?: object;
}

/** Banner ad component — shows AdMob banner between content. */
export const AdBanner = memo(function AdBanner({ style }: AdBannerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [adFailed, setAdFailed] = useState(false);

  if (adFailed) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(255,122,46,0.06)' : 'rgba(242,101,34,0.04)',
            borderColor: colorScheme === 'dark' ? 'rgba(255,122,46,0.15)' : 'rgba(242,101,34,0.12)',
          },
          style,
        ]}
      >
        <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
          Ad
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID ?? ''}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setAdFailed(true)}
        onAdLoaded={() => {
          trackEvent('ad_impression');
          trackStat('adImpressions');
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  placeholder: {
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
  },
});
