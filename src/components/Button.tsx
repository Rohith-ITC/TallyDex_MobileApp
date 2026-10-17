import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, sizes, space } from '../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'dark' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'lg' | 'sm';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHT = { sm: sizes.buttonSm, md: sizes.button, lg: sizes.buttonAuth };

/** One primary (orange gradient) per screen (rule R19); others dark, ghost or danger. */
export function Button({ label, onPress, variant = 'primary', size = 'md', icon: Icon, loading, disabled, style, testID }: Props) {
  const inactive = disabled || loading;
  const fg =
    variant === 'primary' || variant === 'dark' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text2;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {Icon ? <Icon size={size === 'sm' ? 15 : 18} color={fg} strokeWidth={2.1} /> : null}
          <AppText variant={size === 'sm' ? 'buttonSm' : 'button'} style={{ color: fg }}>
            {label}
          </AppText>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size], borderRadius: size === 'sm' ? radii.sm : radii.control },
        variant === 'dark' && { backgroundColor: pressed ? colors.text2 : colors.text },
        variant === 'ghost' && { backgroundColor: pressed ? colors.surface2 : colors.surface, borderColor: colors.line, borderWidth: 1 },
        variant === 'danger' && { backgroundColor: pressed ? colors.dangerLine : colors.dangerBg, borderColor: colors.dangerLine, borderWidth: 1 },
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {({ pressed }) =>
        variant === 'primary' ? (
          <LinearGradient
            colors={pressed ? [colors.accentLo, colors.accent] : [colors.accent, colors.accentHi]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.gradient, { borderRadius: size === 'sm' ? radii.sm : radii.control }]}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', justifyContent: 'center' },
  gradient: { justifyContent: 'center' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
  },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.985 }] },
});
