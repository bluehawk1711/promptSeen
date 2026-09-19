import { forwardRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { ViewStyle } from 'react-native';

export type GradientBadgeDirection = 'horizontal' | 'diagonal' | 'vertical';
export type GradientBadgeSize = 'default' | 'sm' | 'lg';

export interface GradientBadgeProps {
  children?: React.ReactNode;
  direction?: GradientBadgeDirection;
  size?: GradientBadgeSize;
  style?: ViewStyle;
}

function getBadgeSize(size: GradientBadgeSize): { height: number; paddingHorizontal: number; fontSize: number } {
  switch (size) {
    case 'sm':
      return { height: 20, paddingHorizontal: 8, fontSize: 10 };
    case 'lg':
      return { height: 30, paddingHorizontal: 14, fontSize: 14 };
    default:
      return { height: 24, paddingHorizontal: 10, fontSize: 12 };
  }
}

export const GradientBadge = forwardRef<LinearGradient, GradientBadgeProps>(
  ({ children, direction = 'horizontal', size = 'default', style }, ref) => {
    const { height, paddingHorizontal, fontSize } = getBadgeSize(size);

    const gradientColors: [string, string, ...string[]] =
      direction === 'diagonal'
        ? ['#7C3AED', '#8B5CF6', '#A855F7']
        : ['#7C3AED', '#A855F7'];

    const gradientStartEnd =
      direction === 'vertical'
        ? { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }
        : direction === 'diagonal'
          ? { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
          : { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };

    return (
      <LinearGradient
        ref={ref}
        colors={gradientColors}
        start={gradientStartEnd.start}
        end={gradientStartEnd.end}
        style={[
          {
            height,
            paddingHorizontal,
            borderRadius: height / 2,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          },
          style,
        ]}
      >
        <Text style={{ fontSize, fontWeight: '600', color: '#FFFFFF' }}>
          {children}
        </Text>
      </LinearGradient>
    );
  }
);

GradientBadge.displayName = 'GradientBadge';
