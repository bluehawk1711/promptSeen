import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { Heart, Home, Folder, Send, User } from 'lucide-react-native';

/**
 * Bottom tab navigator — 5 tabs with premium styling.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
          height: 56,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Heart size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color, size }) => (
            <Folder size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="submissions"
        options={{
          title: 'Submit',
          tabBarIcon: ({ color, size }) => (
            <Send size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
