/**
 * Motion design system — shared animation presets.
 *
 * Centralizes spring configs, timings, and easings so every screen
 * and component animates with the same physical feel.
 */

/** Spring presets — use for entrances, toggles, and anything physical. */
export const SPRING = {
  /** Gentle entrance for cards and sections — restrained, no bounce. */
  gentle: { damping: 24, stiffness: 200, mass: 1 },
  /** Snappy interactions — chips, buttons, small elements. */
  snappy: { damping: 20, stiffness: 260, mass: 0.9 },
  /** Slight bounce for hero elements — used sparingly. */
  bouncy: { damping: 18, stiffness: 220, mass: 1 },
  /** Heavy elements — sheets, modals. */
  heavy: { damping: 26, stiffness: 180, mass: 1 },
} as const;

/** Stagger delays — how much later each item in a list appears. */
export const STAGGER = {
  fast: 30,
  normal: 45,
  slow: 70,
} as const;

/** Press feedback — scale values for tactile buttons. */
export const PRESS = {
  /** Standard pressable (cards, buttons). */
  card: 0.97,
  /** Subtle press (chips, list rows). */
  subtle: 0.98,
  /** Deep press (primary CTAs). */
  deep: 0.95,
} as const;

/** Duration presets for withTiming (ms). */
export const DURATION = {
  fast: 160,
  normal: 240,
  slow: 360,
  cinematic: 550,
} as const;
