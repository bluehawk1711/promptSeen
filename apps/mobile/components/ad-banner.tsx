import { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';

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
          { backgroundColor: colors.muted, borderColor: colors.border },
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
        unitId={TestIds.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setAdFailed(true)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  placeholder: {
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
  },
});
