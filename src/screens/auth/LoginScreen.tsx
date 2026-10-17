import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { toApiError } from '../../api/client';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { useSession } from '../../store/sessionStore';
import { colors, radii, space } from '../../theme';
import { AuthLayout } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /auth/login. No OTP or sign-up: the API has neither (decision D3). */
export function LoginScreen({ navigation }: Props) {
  const login = useSession((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email address';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    setServerError(null);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      await login(email, password);
      // RootNavigator swaps to the app (or the first-login password screen).
    } catch (e) {
      setServerError(toApiError(e).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.fields}>
        <TextField
          testID="login-email"
          label="Email ID"
          required
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.email}
          editable={!busy}
        />
        <TextField
          ref={passwordRef}
          testID="login-password"
          label="Password"
          required
          password
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="Password"
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={errors.password}
          editable={!busy}
        />
      </View>

      {serverError ? (
        <View style={styles.message} accessibilityLiveRegion="polite" testID="login-error">
          <AppText variant="label" color="danger" align="center">
            {serverError}
          </AppText>
        </View>
      ) : null}

      <Button testID="login-submit" label="Login" size="lg" onPress={submit} loading={busy} style={styles.button} />

      <Pressable
        testID="login-forgot"
        accessibilityRole="link"
        onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() || undefined })}
        hitSlop={12}
        style={styles.forgot}
      >
        <AppText variant="label" color="text3" style={styles.forgotText}>
          Forgot Password?
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
  forgot: { alignSelf: 'center', marginTop: space.lg, padding: space.xxs },
  forgotText: { fontSize: 13 },
});
