import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, sizes, space } from '../theme';
import { AppText } from './AppText';

export interface ScopeStatus {
  text: string;
  tone: 'muted' | 'busy' | 'danger';
}

/** Which organization a tenant screen is reading (rule R15), and how fresh its data is. */
export function ScopeBar({ name, onPress, status }: { name: string; onPress?: () => void; status?: ScopeStatus }) {
  return (
    <Pressable
      testID="scope-bar"
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Organization ${name}${status ? `, ${status.text}` : ''}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.bar, pressed && { backgroundColor: colors.surface2 }]}
    >
      <View style={styles.dot} />
      <AppText variant="overline" color="text4">
        Organization
      </AppText>
      <AppText variant="label" numberOfLines={1} style={styles.name}>
        {name}
      </AppText>
      {onPress ? <ChevronDown size={16} color={colors.text3} /> : null}
      {status ? (
        <View style={styles.status}>
          {status.tone === 'busy' ? <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} /> : null}
          <AppText
            variant="caption"
            numberOfLines={1}
            style={[styles.statusText, { color: status.tone === 'danger' ? colors.danger : status.tone === 'busy' ? colors.accent : colors.text4 }]}
          >
            {status.text}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.scopeBar,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.gutter,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  name: { flexShrink: 1, fontSize: 13 },
  status: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, minWidth: 90 },
  spinner: { transform: [{ scale: 0.7 }] },
  statusText: { fontSize: 11 },
});
