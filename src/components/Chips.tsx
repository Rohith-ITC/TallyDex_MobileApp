import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  count?: number;
  onPress: () => void;
  testID?: string;
}

export function Chip({ label, icon: Icon, active, count, onPress, testID }: ChipProps) {
  const fg = active ? colors.accent : colors.text2;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count} selected` : label}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [styles.chip, active && styles.chipOn, pressed && styles.pressed]}
    >
      {Icon ? <Icon size={14} color={fg} strokeWidth={2.2} /> : null}
      <AppText variant="label" style={{ color: fg }} numberOfLines={1}>
        {label}
      </AppText>
      {count ? (
        <View style={styles.count}>
          <AppText variant="caption" color="onAccent" style={styles.countText}>
            {count}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Row of chips under the header showing the active filters (rule R13). */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barContent}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: space.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.accentTint, borderColor: colors.accentTint2 },
  pressed: { opacity: 0.75 },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 10.5, lineHeight: 13 },
  bar: { backgroundColor: colors.canvas },
  barContent: { gap: space.xs, paddingHorizontal: space.gutter, paddingVertical: space.sm },
});
