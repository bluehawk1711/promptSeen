/**
 * Prompt View — Global color theme.
 *
 * Blue-purple palette matching the new logo.
 * Both light and dark modes use blue as the primary accent.
 *
 * PRIMARY is the single source of truth for the brand accent. Use it for
 * static styles (SplashScreen, ShareCard) that render before/without a
 * theme context; everywhere else prefer `colors.primary`.
 */
export const PRIMARY = '#5B5BFF';

/** Primary with alpha — for glows, tints, and borders. */
export const withPrimaryOpacity = (opacity: number): string =>
  `rgba(91, 91, 255, ${opacity})`;

const lightColors = {
  // Base colors
  background: '#FFFFFF',
  foreground: '#1A1A2E',

  // Card colors
  card: '#FFFFFF',
  cardForeground: '#1A1A2E',

  // Popover colors
  popover: '#FFFFFF',
  popoverForeground: '#1A1A2E',

  // Primary — blue
  primary: PRIMARY,
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#F0F0FF',
  secondaryForeground: '#3D3D8A',

  // Muted colors
  muted: '#F4F4FC',
  mutedForeground: '#7A7A9E',

  // Accent colors
  accent: '#EDEDFE',
  accentForeground: '#4040B0',

  // Destructive colors
  destructive: '#DC3545',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#E0E0F0',
  input: '#E0E0F0',
  ring: '#5B5BFF',

  // Text colors
  text: '#1A1A2E',
  textMuted: '#7A7A9E',

  // Legacy support
  tint: '#5B5BFF',
  icon: '#6B6BAA',
  tabIconDefault: '#7A7A9E',
  tabIconSelected: '#5B5BFF',

  // Semantic accent colors
  blue: '#5B5BFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFD60A',
  pink: '#FF6B9D',
  purple: '#8B5CF6',
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

  // Brand gradients
  gradientStart: '#5B5BFF',
  gradientEnd: '#7C3AED',
  gradientBg: '#0A0A1A',
};

const darkColors = {
  // Base colors — cool dark matching the blue-purple logo
  background: '#0A0A1A',
  foreground: '#E8E8F0',

  // Card colors
  card: '#14142B',
  cardForeground: '#E8E8F0',

  // Popover colors
  popover: '#14142B',
  popoverForeground: '#E8E8F0',

  // Primary — blue
  primary: PRIMARY,
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#1C1C35',
  secondaryForeground: '#C0C0E0',

  // Muted colors
  muted: '#1C1C35',
  mutedForeground: '#8888B0',

  // Accent colors
  accent: '#1E1E40',
  accentForeground: '#C0C0E0',

  // Destructive colors
  destructive: '#FF453A',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#2A2A4A',
  input: '#2A2A4A',
  ring: '#5B5BFF',

  // Text colors
  text: '#E8E8F0',
  textMuted: '#8888B0',

  // Legacy support
  tint: '#7C8CFF',
  icon: '#8888B0',
  tabIconDefault: '#6B6BAA',
  tabIconSelected: '#7C8CFF',

  // Semantic accent colors
  blue: '#7C8CFF',
  green: '#51CF66',
  red: '#FF6B6B',
  orange: '#FFA94D',
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

  // Brand gradients
  gradientStart: '#5B5BFF',
  gradientEnd: '#7C3AED',
  gradientBg: '#0A0A1A',
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
