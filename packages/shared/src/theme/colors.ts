/**
 * TS Prompt — Global color theme.
 *
 * Warm orange/dark palette inspired by the onboarding design.
 * Both light and dark modes use orange as the primary accent.
 *
 * PRIMARY is the single source of truth for the brand accent. Use it for
 * static styles (SplashScreen, ShareCard) that render before/without a
 * theme context; everywhere else prefer `colors.primary`.
 */
export const PRIMARY = '#EE6123';

/** Primary with alpha — for glows, tints, and borders. */
export const withPrimaryOpacity = (opacity: number): string =>
  `rgba(238, 97, 35, ${opacity})`;

const lightColors = {
  // Base colors — matching admin panel light mode
  background: '#FFFFFF',
  foreground: '#2B2B2B',

  // Card colors
  card: '#FFFFFF',
  cardForeground: '#2B2B2B',

  // Popover colors
  popover: '#FFFFFF',
  popoverForeground: '#2B2B2B',

  // Primary — warm orange (admin panel primary)
  primary: PRIMARY,
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#F7F5F3',
  secondaryForeground: '#7A4A2B',

  // Muted colors
  muted: '#F4F2F0',
  mutedForeground: '#8F8A84',

  // Accent colors
  accent: '#FDF0E7',
  accentForeground: '#B44A1E',

  // Destructive colors
  destructive: '#DC3545',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#E8E4E0',
  input: '#E8E4E0',
  ring: '#EE6123',

  // Text colors
  text: '#2B2B2B',
  textMuted: '#8F8A84',

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
  // Base colors — deep warm dark matching the admin panel
  background: '#141210',
  foreground: '#EDE8E4',

  // Card colors
  card: '#211E1B',
  cardForeground: '#EDE8E4',

  // Popover colors
  popover: '#211E1B',
  popoverForeground: '#EDE8E4',

  // Primary — warm orange (admin panel primary oklch(0.6988 0.1843 49.1654) ≈ #E85D2A)
  primary: PRIMARY,
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#2B2723',
  secondaryForeground: '#F5C9A8',

  // Muted colors
  muted: '#2B2723',
  mutedForeground: '#A89C90',

  // Accent colors
  accent: '#3A2418',
  accentForeground: '#F5C9A8',

  // Destructive colors
  destructive: '#FF453A',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#37322D',
  input: '#37322D',
  ring: '#EE6123',

  // Text colors
  text: '#EDE8E4',
  textMuted: '#A89C90',

  // Legacy support
  tint: '#FF7A2E',
  icon: '#B8956A',
  tabIconDefault: '#B8956A',
  tabIconSelected: '#FF7A2E',

  // Semantic accent colors
  blue: '#4DABF7',
  green: '#51CF66',
  red: '#FF6B6B',
  orange: '#EE6123',
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
  gradientStart: '#EE6123',
  gradientEnd: '#D14E15',
  gradientBg: '#141210',
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
