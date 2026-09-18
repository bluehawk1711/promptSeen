import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/custom-tab-bar';

/**
 * Bottom tab navigator — 4 tabs with floating custom tab bar.
 *
 * index    — Photos (main photo prompt feed)
 * videos   — Videos (video prompt feed)
 * favorites — Saved prompts grouped by category
 * profile  — Settings, about, socials
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="videos" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
