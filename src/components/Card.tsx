import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

/** White surface on the grey canvas (rule R9). */
export function Card({ children, style, onPress, testID, accessibilityLabel }: CardProps) {
  if (!onPress) return <View style={[styles.card, style]} testID={testID}>{children}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

/** Card title row with the accent-tinted lead icon from app.css .card-head. */
export function CardHead({ icon: Icon, title, sub, right }: { icon?: LucideIcon; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.head}>
      {Icon ? (
        <View style={styles.leadIcon}>
          <Icon size={17} color={colors.accent} strokeWidth={2.1} />
        </View>
      ) : null}
      <View style={styles.headText}>
        <AppText variant="title">{title}</AppText>
        {sub ? (
          <AppText variant="caption" color="text3">
            {sub}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    elevation: 1,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  pressed: { backgroundColor: colors.surface2, borderColor: colors.accentTint2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  leadIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
});
