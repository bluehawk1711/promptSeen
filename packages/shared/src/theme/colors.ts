/**
 * Prompt View — Global color theme.
 *
 * Purple-dominant palette matching the logo.
 * Both light and dark modes use purple as the primary accent.
 *
 * PRIMARY is the single source of truth for the brand accent. Use it for
 * static styles (SplashScreen, ShareCard) that render before/without a
 * theme context; everywhere else prefer `colors.primary`.
 */
export const PRIMARY = '#7C3AED';

/** Primary with alpha — for glows, tints, and borders. */
export const withPrimaryOpacity = (opacity: number): string =>
  `rgba(124, 58, 237, ${opacity})`;

const lightColors = {
  // Base colors
  background: '#FFFFFF',
  foreground: '#1A102E',

  // Card colors
  card: '#FFFFFF',
  cardForeground: '#1A102E',

  // Popover colors
  popover: '#FFFFFF',
  popoverForeground: '#1A102E',

  // Primary — purple
  primary: PRIMARY,
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#F3EEFF',
  secondaryForeground: '#5B3D99',

  // Muted colors
  muted: '#F5F0FF',
  mutedForeground: '#8B7AAE',

  // Accent colors
  accent: '#EDE5FE',
  accentForeground: '#5B3D99',

  // Destructive colors
  destructive: '#DC3545',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#E0D5F5',
  input: '#E0D5F5',
  ring: '#7C3AED',

  // Text colors
  text: '#1A102E',
  textMuted: '#8B7AAE',

  // Legacy support
  tint: '#7C3AED',
  icon: '#7B6AA0',
  tabIconDefault: '#8B7AAE',
  tabIconSelected: '#7C3AED',

  // Semantic accent colors
  blue: '#6366F1',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFD60A',
  pink: '#FF6B9D',
  purple: '#A855F7',
  teal: '#5AC8FA',
  indigo: '#6366F1',

  // Semantic states
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
  info: '#6366F1',
  infoForeground: '#ffffff',
  error: '#ef4444',
  errorForeground: '#ffffff',

  // Brand gradients
  gradientStart: '#7C3AED',
  gradientEnd: '#A855F7',
  gradientBg: '#0D0A14',
};

const darkColors = {
  // Base colors — deep purple-dark matching the logo
  background: '#0D0A14',
  foreground: '#E8E0F4',

  // Card colors
  card: '#1A1030',
  cardForeground: '#E8E0F4',

  // Popover colors
  popover: '#1A1030',
  popoverForeground: '#E8E0F4',

  // Primary — purple
  primary: PRIMARY,
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#1F1535',
  secondaryForeground: '#C4B5E0',

  // Muted colors
  muted: '#1F1535',
  mutedForeground: '#9080B8',

  // Accent colors
  accent: '#2D1B50',
  accentForeground: '#C4B5E0',

  // Destructive colors
  destructive: '#FF453A',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#2E2048',
  input: '#2E2048',
  ring: '#7C3AED',

  // Text colors
  text: '#E8E0F4',
  textMuted: '#9080B8',

  // Legacy support
  tint: '#A78BFA',
  icon: '#9080B8',
  tabIconDefault: '#7B6AA0',
  tabIconSelected: '#A78BFA',

  // Semantic accent colors
  blue: '#818CF8',
  green: '#51CF66',
  red: '#FF6B6B',
  orange: '#FFA94D',
  yellow: '#FFD43B',
  pink: '#FF6B9D',
  purple: '#C084FC',
  teal: '#3BC9DB',
  indigo: '#818CF8',

  // Semantic states
  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  info: '#818CF8',
  infoForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',

  // Brand gradients
  gradientStart: '#7C3AED',
  gradientEnd: '#A855F7',
  gradientBg: '#0D0A14',
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
