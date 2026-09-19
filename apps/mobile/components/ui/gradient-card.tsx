import { forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';

export type GradientCardVariant = 'border' | 'solid' | 'glow';

export interface GradientCardProps {
  children?: React.ReactNode;
  variant?: GradientCardVariant;
  style?: ViewStyle | ViewStyle[];
}

export const GradientCard = forwardRef<View, GradientCardProps>(
  ({ children, variant = 'border', style }, ref) => {
    const borderColor = useColor('border');
    const cardColor = useColor('card');
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getCardStyle = (): ViewStyle => {
      const base: ViewStyle = {
        borderRadius: 20,
        overflow: 'hidden',
      };

      switch (variant) {
        case 'solid':
          return {
            ...base,
            backgroundColor: isDark ? '#1A1030' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)',
          };
        case 'glow':
          return {
            ...base,
            backgroundColor: isDark ? '#1A1030' : '#FFFFFF',
            borderWidth: 1,
            borderColor: 'rgba(124,58,237,0.2)',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          };
        case 'border':
        default:
          return {
            ...base,
            backgroundColor: cardColor,
            borderWidth: 1,
            borderColor: borderColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          };
      }
    };

    return (
      <View ref={ref} style={[getCardStyle(), style]}>
        {children}
      </View>
    );
  }
);

GradientCard.displayName = 'GradientCard';
