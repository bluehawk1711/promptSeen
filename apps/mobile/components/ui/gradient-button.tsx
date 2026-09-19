import { forwardRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { useHaptics } from '@/hooks/useHaptics';
import { CORNERS, FONT_SIZE, HEIGHT } from '@/theme/globals';
import { LucideProps } from 'lucide-react-native';
import {
  GestureResponderEvent,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { ButtonSpinner, SpinnerVariant } from '@/components/ui/spinner';

export type GradientDirection = 'horizontal' | 'diagonal' | 'vertical';

export type GradientButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface GradientButtonProps {
  children?: React.ReactNode;
  label?: string;
  icon?: React.ComponentType<LucideProps>;
  onPress?: () => void;
  size?: GradientButtonSize;
  direction?: GradientDirection;
  disabled?: boolean;
  loading?: boolean;
  loadingVariant?: SpinnerVariant;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

function getGradientColors(direction: GradientDirection): [string, string, ...string[]] {
  switch (direction) {
    case 'diagonal':
      return ['#7C3AED', '#8B5CF6', '#A855F7'];
    case 'vertical':
      return ['#7C3AED', '#A855F7'];
    case 'horizontal':
    default:
      return ['#7C3AED', '#A855F7'];
  }
}

function getGradientStartEnd(direction: GradientDirection): { start: { x: number; y: number }; end: { x: number; y: number } } {
  switch (direction) {
    case 'diagonal':
      return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    case 'vertical':
      return { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
    case 'horizontal':
    default:
      return { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };
  }
}

export const GradientButton = forwardRef<View, GradientButtonProps>(
  (
    {
      children,
      icon,
      onPress,
      size = 'default',
      direction = 'horizontal',
      disabled = false,
      loading = false,
      loadingVariant = 'default',
      style,
      textStyle,
      label,
    },
    ref
  ) => {
    const feedback = useHaptics(true);
    const primaryForegroundColor = '#FFFFFF';

    const scale = useSharedValue(1);

    const getButtonStyle = (): ViewStyle => {
      const base: ViewStyle = {
        borderRadius: CORNERS,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      };

      switch (size) {
        case 'sm':
          return { ...base, height: 44, minWidth: 100 };
        case 'lg':
          return { ...base, height: 54, minWidth: 140 };
        case 'icon':
          return { ...base, height: HEIGHT, width: HEIGHT };
        default:
          return { ...base, height: HEIGHT, minWidth: 120 };
      }
    };

    const getTextStyle = (): TextStyle => ({
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : FONT_SIZE,
      fontWeight: '600',
      color: primaryForegroundColor,
    });

    const getIconSize = (): number => {
      switch (size) {
        case 'sm': return 16;
        case 'lg': return 24;
        case 'icon': return 20;
        default: return 18;
      }
    };

    const handlePressIn = () => {
      if (!disabled && !loading) {
        feedback('impact-light');
        scale.value = withSpring(1.05, { damping: 15, stiffness: 400, mass: 0.5 });
      }
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 400, mass: 0.8 });
    };

    const handlePress = () => {
      if (onPress && !disabled && !loading) onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    }));

    const gradientColors = getGradientColors(direction);
    const gradientProps = getGradientStartEnd(direction);
    const iconSize = getIconSize();

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        accessibilityLabel={label}
      >
        <Animated.View style={[animatedStyle, getButtonStyle(), style]}>
          <LinearGradient
            colors={gradientColors}
            start={gradientProps.start}
            end={gradientProps.end}
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: CORNERS,
                paddingHorizontal: size === 'sm' ? 16 : size === 'lg' ? 28 : 20,
              },
            ]}
          >
            {loading ? (
              <ButtonSpinner size={size} variant={loadingVariant} color={primaryForegroundColor} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {icon && <Icon name={icon} color={primaryForegroundColor} size={iconSize} />}
                {typeof children === 'string' ? (
                  <Text style={[getTextStyle(), textStyle]}>{children}</Text>
                ) : (
                  children
                )}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }
);

GradientButton.displayName = 'GradientButton';
