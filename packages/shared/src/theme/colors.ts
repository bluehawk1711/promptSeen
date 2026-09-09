/**
 * PromptSeen — Global color theme.
 *
 * Warm orange/dark palette inspired by the onboarding design.
 * Both light and dark modes use orange as the primary accent.
 */

const lightColors = {
  // Base colors
  background: '#FFFBF5',
  foreground: '#1A0A00',

  // Card colors
  card: '#FFFFFF',
  cardForeground: '#1A0A00',

  // Popover colors
  popover: '#FFFFFF',
  popoverForeground: '#1A0A00',

  // Primary — warm orange
  primary: '#F26522',
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#FFF0E6',
  secondaryForeground: '#8B4513',

  // Muted colors
  muted: '#F5EDE6',
  mutedForeground: '#8B7355',

  // Accent colors
  accent: '#FFF0E6',
  accentForeground: '#8B4513',

  // Destructive colors
  destructive: '#DC3545',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#E8DDD0',
  input: '#E8DDD0',
  ring: '#F26522',

  // Text colors
  text: '#1A0A00',
  textMuted: '#8B7355',

  // Legacy support
  tint: '#F26522',
  icon: '#8B7355',
  tabIconDefault: '#8B7355',
  tabIconSelected: '#F26522',

  // Semantic accent colors
  blue: '#2196F3',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#F26522',
  yellow: '#FFD60A',
  pink: '#FF6B9D',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  indigo: '#5856D6',

  // Semantic states
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
  info: '#3b82f6',
  infoForeground: '#ffffff',
  error: '#ef4444',
  errorForeground: '#ffffff',

  // Brand gradients (for reference)
  gradientStart: '#F26522',
  gradientEnd: '#E85D1A',
  gradientBg: '#1A0A00',
};

const darkColors = {
  // Base colors — deep warm dark
  background: '#0D0500',
  foreground: '#FFF5EB',

  // Card colors
  card: '#1C0E02',
  cardForeground: '#FFF5EB',

  // Popover colors
  popover: '#1C0E02',
  popoverForeground: '#FFF5EB',

  // Primary — bright warm orange
  primary: '#FF7A2E',
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#2A1A0A',
  secondaryForeground: '#FFCBA4',

  // Muted colors
  muted: '#2A1A0A',
  mutedForeground: '#B8956A',

  // Accent colors
  accent: '#2A1A0A',
  accentForeground: '#FFCBA4',

  // Destructive colors
  destructive: '#FF453A',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#3D2510',
  input: '#3D2510',
  ring: '#FF7A2E',

  // Text colors
  text: '#FFF5EB',
  textMuted: '#B8956A',

  // Legacy support
  tint: '#FF7A2E',
  icon: '#B8956A',
  tabIconDefault: '#B8956A',
  tabIconSelected: '#FF7A2E',

  // Semantic accent colors
  blue: '#4DABF7',
  green: '#51CF66',
  red: '#FF6B6B',
  orange: '#FF7A2E',
  yellow: '#FFD43B',
  pink: '#FF6B9D',
  purple: '#CC5DE8',
  teal: '#3BC9DB',
  indigo: '#748FFC',

  // Semantic states
  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',

  // Brand gradients (for reference)
  gradientStart: '#FF7A2E',
  gradientEnd: '#E85D1A',
  gradientBg: '#0D0500',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

// Export individual color schemes for easier access
export { darkColors, lightColors };

// Utility type for color keys
export type ColorKeys = keyof typeof lightColors;

// Helper function to get color with opacity (useful for React Native)
export const withOpacity = (color: string, opacity: number) => {
  if (color.startsWith('rgba')) {
    return color;
  }

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};
