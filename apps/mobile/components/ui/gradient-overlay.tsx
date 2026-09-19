import { forwardRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';

export type GradientOverlayDirection = 'up' | 'down' | 'diagonal' | 'subtle';

export interface GradientOverlayProps {
  direction?: GradientOverlayDirection;
  style?: ViewStyle | ViewStyle[];
}

function getOverlayColors(direction: GradientOverlayDirection): [string, string, ...string[]] {
  switch (direction) {
    case 'down':
      return ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.3)', 'transparent'];
    case 'diagonal':
      return ['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)'];
    case 'subtle':
      return ['rgba(0,0,0,0.5)', 'transparent'];
    case 'up':
    default:
      return ['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)'];
  }
}

function getOverlayStartEnd(direction: GradientOverlayDirection): { start: { x: number; y: number }; end: { x: number; y: number } } {
  switch (direction) {
    case 'down':
      return { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
    case 'diagonal':
      return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    case 'up':
    default:
      return { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
  }
}

export const GradientOverlay = forwardRef<LinearGradient, GradientOverlayProps>(
  ({ direction = 'up', style }, ref) => {
    const colors = getOverlayColors(direction);
    const { start, end } = getOverlayStartEnd(direction);

    return (
      <LinearGradient
        ref={ref}
        colors={colors}
        start={start}
        end={end}
        pointerEvents="none"
        style={[{ position: 'absolute', inset: 0 }, style]}
      />
    );
  }
);

GradientOverlay.displayName = 'GradientOverlay';
