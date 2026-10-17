import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';
import { Skeleton } from './StateViews';

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  badge?: string;
  loading?: boolean;
  onPress?: () => void;
  testID?: string;
}

/** The .tile from app.css: label with icon, big Wix number, optional badge. */
export function StatTile({ label, value, icon: Icon, badge, loading, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.icon}>
          <Icon size={16} color={colors.accent} strokeWidth={2.1} />
        </View>
        {badge && !loading ? (
          <View style={styles.badge}>
            <AppText variant="caption" color="accent" style={styles.badgeText}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      {loading ? (
        <Skeleton width={64} height={26} style={styles.valueSkel} />
      ) : (
        <AppText variant="statValue" numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
          {value}
        </AppText>
      )}
      <AppText variant="caption" color="text3" numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 124,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    elevation: 1,
  },
  pressed: { borderColor: colors.accentTint2, backgroundColor: colors.surface2 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.accentTint,
  },
  badgeText: { fontSize: 10.5 },
  value: { marginTop: space.sm, marginBottom: 2 },
  valueSkel: { marginTop: space.sm, marginBottom: 6 },
});
