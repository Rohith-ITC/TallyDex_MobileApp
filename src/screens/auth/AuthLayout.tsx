import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { LogoMark, Wordmark } from '../../components/Logo';
import { getAppVersionName } from '../../config/appVersion';
import { colors, space } from '../../theme';

/** White single column from login/styles.css: logo, wordmark, form, footer. */
export function AuthLayout({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" translucent backgroundColor={colors.transparent} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          <View style={styles.brand}>
            <LogoMark size={76} />
            <Wordmark size={34} />
          </View>
          {title ? (
            <View style={styles.titleBlock}>
              <AppText variant="display" align="center" style={styles.title}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="body" color="text3" align="center">
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          ) : null}
          {children}
        </View>
        <View style={styles.footer}>
          <AppText variant="caption" color="text4" align="center">
            © <AppText variant="label" color="accent">IT</AppText> <AppText variant="label">Catalyst</AppText> Software India Pvt Ltd. 2026
          </AppText>
          <AppText variant="caption" color="text4" align="center" style={styles.version}>
            Version {getAppVersionName()}
          </AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, paddingHorizontal: space.xl, justifyContent: 'space-between' },
  // Fills the space above the footer and centres the logo + form in it.
  column: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', gap: space.sm, marginBottom: space.xxl },
  titleBlock: { alignItems: 'center', gap: 6, marginTop: -space.md, marginBottom: space.xl },
  title: { fontSize: 22 },
  footer: { marginTop: space.xxl, alignItems: 'center' },
  version: { marginTop: 4, fontSize: 11 },
});
