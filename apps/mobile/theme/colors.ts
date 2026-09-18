/**
 * Re-export from shared package.
 *
 * Color definitions live in @repo/shared/theme.
 * This file exists so that existing `@/theme/colors` imports continue to work.
 */
export { Colors, darkColors, lightColors, withOpacity, PRIMARY, withPrimaryOpacity, type ColorKeys } from '@repo/shared/theme';
