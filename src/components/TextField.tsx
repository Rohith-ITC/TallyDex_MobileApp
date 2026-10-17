import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, radii, sizes, space } from '../theme';
import { AppText, AppTextInput } from './AppText';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  error?: string | null;
  password?: boolean;
  testID?: string;
}

/**
 * The login design's field: label notched into the top border, warm tint at
 * rest, white with an orange border and ring when focused (rule R20).
 */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, required, error, password, testID, onFocus, onBlur, ...input },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.accent : colors.line;

  return (
    <View style={styles.group}>
      <View style={[styles.ring, focused && !error && styles.ringOn]}>
        <View style={[styles.shell, { borderColor, backgroundColor: focused ? colors.surface : colors.fieldTint }]}>
          <AppTextInput
            ref={ref}
            testID={testID}
            accessibilityLabel={label}
            secureTextEntry={password && hidden}
            autoCapitalize={password ? 'none' : input.autoCapitalize}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...input}
            style={[styles.input, password && hidden && styles.passwordInput]}
          />
          {password ? (
            <Pressable
              testID={testID ? `${testID}-toggle` : undefined}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              onPress={() => setHidden((h) => !h)}
              hitSlop={10}
              style={styles.eye}
            >
              {hidden ? <Eye size={20} color={colors.text4} /> : <EyeOff size={20} color={colors.text4} />}
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.labelWrap} pointerEvents="none">
        <AppText variant="label" style={{ color: error ? colors.danger : focused ? colors.accent : colors.text3 }}>
          {label}
          {required ? <AppText variant="label" color="danger"> *</AppText> : null}
        </AppText>
      </View>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { paddingTop: 8 },
  ring: { borderRadius: radii.control + 4, padding: 0, borderWidth: 4, borderColor: colors.transparent, margin: -4 },
  ringOn: { borderColor: colors.accentRing },
  shell: {
    height: sizes.field,
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, height: '100%', paddingHorizontal: space.md + 2, paddingVertical: 0 },
  passwordInput: { letterSpacing: 1.5 },
  eye: { paddingHorizontal: space.sm, height: '100%', justifyContent: 'center' },
  labelWrap: {
    position: 'absolute',
    top: 0,
    left: 12,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
  },
  error: { marginTop: 6, marginLeft: 4 },
});
