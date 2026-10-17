import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';
import { AppText } from './AppText';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'accent' | 'mute';

const TONES: Record<Tone, { bg: string; fg: string; line: string }> = {
  ok: { bg: colors.okBg, fg: colors.ok, line: colors.okLine },
  warn: { bg: colors.warnBg, fg: colors.warn, line: colors.warnLine },
  danger: { bg: colors.dangerBg, fg: colors.danger, line: colors.dangerLine },
  info: { bg: colors.infoBg, fg: colors.info, line: colors.infoLine },
  accent: { bg: colors.accentTint, fg: colors.accent, line: colors.accentTint2 },
  mute: { bg: colors.surface3, fg: colors.text3, line: colors.line },
};

export function Badge({ label, tone = 'mute', dot = true }: { label: string; tone?: Tone; dot?: boolean }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.line }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      <AppText variant="caption" style={[styles.text, { color: t.fg }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 11 },
});
