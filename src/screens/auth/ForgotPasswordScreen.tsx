import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { toApiError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radii, space } from '../../theme';
import { AuthLayout } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

/** POST /auth/forgot-password. The emailed link opens the web portal (decision D8). */
export function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setResult({
        ok: res.success !== false,
        text: res.data?.message || res.message || 'If that email is registered, a reset link is on its way.',
      });
    } catch (e) {
      setResult({ ok: false, text: toApiError(e).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a link to set a new password.">
      <TextField
        testID="forgot-email"
        label="Email ID"
        required
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError(null);
        }}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={submit}
        error={error}
      />
      {result ? (
        <View style={[styles.message, result.ok ? styles.ok : styles.bad]} accessibilityLiveRegion="polite">
          <AppText variant="label" color={result.ok ? 'ok' : 'danger'} align="center">
            {result.text}
          </AppText>
        </View>
      ) : null}
      <Button label="Send reset link" variant="dark" size="lg" onPress={submit} loading={busy} style={styles.button} testID="forgot-submit" />
      <Pressable accessibilityRole="link" onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
        <AppText variant="label" color="accent">
          Back to Login
        </AppText>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: space.lg, padding: space.sm, borderRadius: radii.sm, borderWidth: 1 },
  ok: { backgroundColor: colors.okBg, borderColor: colors.okLine },
  bad: { backgroundColor: colors.dangerBg, borderColor: colors.dangerLine },
  button: { marginTop: space.xl },
  back: { alignSelf: 'center', marginTop: space.lg, padding: space.xxs },
});
