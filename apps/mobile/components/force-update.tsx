import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { RefreshCw, Download, Sparkles } from 'lucide-react-native';

import { useAppSettingsStore, APP_VERSION } from '@/store/app-settings';
import { PRIMARY, withPrimaryOpacity } from '@/theme/colors';

/**
 * Force update gate — blocks the app when the installed version is
 * below the minimum required by remote settings.
 *
 * Wrap the app root; renders children only when no blocking update is needed.
 */
export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const { settings, appName, fetchSettings, forceRefetchSettings, updateRequirement, loaded } = useAppSettingsStore();

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  // Don't block on loading — render children optimistically
  if (!loaded) {
    return <>{children}</>;
  }

  const requirement = updateRequirement();
  const isBlocked = requirement === 'hard';

  if (isBlocked) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.orb} />
        <Animated.View style={styles.card}>
          <View style={styles.iconCircle}>
            <Sparkles size={34} color={PRIMARY} />
          </View>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.body}>
            Version {settings.minVersion} or newer is required to keep using{' '}
            {appName}. Please update to the latest version from the Play Store.
          </Text>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Installed</Text>
            <Text style={styles.versionValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Required</Text>
            <Text style={styles.versionValue}>{settings.minVersion}</Text>
          </View>
          <Animated.View>
            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={() => {
                const url =
                  settings.playStoreUrl ||
                  'https://play.google.com/store/apps/details?id=com.promptgallery.app';
                void Linking.openURL(url);
              }}
            >
              <Download size={18} color="#fff" />
              <Text style={styles.buttonText}>Update from Play Store</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              void forceRefetchSettings();
            }}
          >
            <RefreshCw size={14} color="rgba(255,245,235,0.6)" />
            <Text style={styles.retryText}>Re-check</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A1A' },
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  orb: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: withPrimaryOpacity(0.1),
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: '#14142B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: withPrimaryOpacity(0.25),
    padding: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: withPrimaryOpacity(0.14),
    borderWidth: 1.5,
    borderColor: withPrimaryOpacity(0.35),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EDE8E4',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#A89C90',
    textAlign: 'center',
    marginBottom: 18,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withPrimaryOpacity(0.15),
  },
  versionLabel: { fontSize: 13, color: '#A89C90' },
  versionValue: { fontSize: 13, fontWeight: '700', color: '#EDE8E4', fontVariant: ['tabular-nums'] },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  retryText: { fontSize: 13, color: 'rgba(255,245,235,0.6)', fontWeight: '600' },
});
