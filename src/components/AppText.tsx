import React from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, type TextProps } from 'react-native';
import { colors, type ColorToken, type as typeScale, type TypeToken } from '../theme';

/** Text follows the system font size, but no more than 1.3x so layouts hold. */
const MAX_SCALE = 1.3;

export interface AppTextProps extends TextProps {
  variant?: TypeToken;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

/** Use instead of react-native's Text in screens and components. */
export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={MAX_SCALE}
      {...rest}
      style={[typeScale[variant], { color: colors[color] }, align ? { textAlign: align } : null, style]}
    />
  );
}

/** Use instead of react-native's TextInput. */
export const AppTextInput = React.forwardRef<TextInput, TextInputProps>(function AppTextInput({ style, ...rest }, ref) {
  return (
    <TextInput
      ref={ref}
      maxFontSizeMultiplier={MAX_SCALE}
      placeholderTextColor={colors.text4}
      selectionColor={colors.accent}
      cursorColor={colors.accent}
      {...rest}
      style={[typeScale.bodyMedium, styles.input, style]}
    />
  );
});

const styles = StyleSheet.create({
  input: { color: colors.text, fontSize: 15 },
});
