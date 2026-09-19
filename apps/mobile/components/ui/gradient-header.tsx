import { forwardRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, ViewStyle } from 'react-native';

export type GradientHeaderVariant = 'subtle' | 'vivid' | 'dark';

export interface GradientHeaderProps {
  children?: React.ReactNode;
  variant?: GradientHeaderVariant;
  style?: ViewStyle | ViewStyle[];
}

function getHeaderColors(variant: GradientHeaderVariant): [string, string, ...string[]] {
  switch (variant) {
    case 'vivid':
      return ['rgba(124,58,237,0.15)', 'rgba(168,85,247,0.05)', 'transparent'];
    case 'dark':
      return ['rgba(124,58,237,0.25)', 'rgba(168,85,247,0.10)', 'rgba(0,0,0,0.05)'];
    case 'subtle':
    default:
      return ['rgba(124,58,237,0.08)', 'transparent'];
  }
}

export const GradientHeader = forwardRef<View, GradientHeaderProps>(
  ({ children, variant = 'subtle', style }, ref) => {
    const colors = getHeaderColors(variant);

    return (
      <View
        ref={ref}
        style={[
          {
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 20,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
          }}
        />
        <View style={{ padding: 24 }}>
          {children}
        </View>
      </View>
    );
  }
);

GradientHeader.displayName = 'GradientHeader';
