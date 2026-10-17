import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { LogoMark, Wordmark } from '../../components/Logo';
import { colors, space } from '../../theme';

/** Shown while the saved session is read from the keychain. */
export function SplashScreen() {
  return (
    <View style={styles.wrap} testID="splash">
      <StatusBar barStyle="light-content" translucent backgroundColor={colors.transparent} />
      <LogoMark size={88} />
      <Wordmark onDark size={30} />
      <ActivityIndicator color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.chrome, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  spinner: { marginTop: space.xl },
});
