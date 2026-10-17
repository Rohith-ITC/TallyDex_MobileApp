import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { toApiError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { showToast } from '../../components/Toast';
import { useSession } from '../../store/sessionStore';
import { colors, radii, space } from '../../theme';
import { AuthLayout } from './AuthLayout';

/**
 * First login only (user.isFirstLogin): the web forces /change-password?firstLogin=true
 * before the dashboard. Same rules as ChangePasswordPage: at least 6 characters,
 * new and confirm must match.
 */
export function SetPasswordScreen() {
  const passwordSet = useSession((s) => s.passwordSet);
  const logout = useSession((s) => s.logout);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const submit = async () => {
    const e: typeof errors = {};
    if (!current) e.current = 'Enter the password you signed in with';
    if (next.length < 6) e.next = 'Use at least 6 characters';
    if (confirm !== next) e.confirm = 'New passwords do not match';
    setErrors(e);
    setServerError(null);
    if (e.current || e.next || e.confirm) return;
    setBusy(true);
    try {
      const res = await authApi.changePassword(current, next, confirm);
      if (res.success === false) throw new Error(res.message || 'Could not change the password');
      showToast('Password set. Welcome to Tally DEx!');
      passwordSet();
    } catch (err) {
      setServerError(toApiError(err).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome! Set your password" subtitle="This is your first sign-in. Choose a new password to continue.">
      <View style={styles.fields}>
        <TextField
          label="Current password"
          required
          password
          value={current}
          onChangeText={setCurrent}
          returnKeyType="next"
          onSubmitEditing={() => nextRef.current?.focus()}
          error={errors.current}
          testID="setpw-current"
        />
        <TextField
          ref={nextRef}
          label="New password"
          required
          password
          value={next}
          onChangeText={setNext}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={errors.next}
          testID="setpw-new"
        />
        <TextField
          ref={confirmRef}
          label="Confirm new password"
          required
          password
          value={confirm}
          onChangeText={setConfirm}
          returnKeyType="go"
          onSubmitEditing={submit}
          error={errors.confirm}
          testID="setpw-confirm"
        />
      </View>
      {serverError ? (
        <View style={styles.message}>
          <AppText variant="label" color="danger" align="center">
            {serverError}
          </AppText>
        </View>
      ) : null}
      <Button label="Set password" size="lg" onPress={submit} loading={busy} style={styles.button} testID="setpw-submit" />
      <Pressable accessibilityRole="button" onPress={() => void logout()} hitSlop={12} style={styles.back}>
        <AppText variant="label" color="text3">
          Use a different account
        </AppText>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: space.lg },
  message: {
    marginTop: space.lg,
    padding: space.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    backgroundColor: colors.dangerBg,
  },
  button: { marginTop: space.xl },
  back: { alignSelf: 'center', marginTop: space.lg, padding: space.xxs },
});
