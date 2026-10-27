import React, { useMemo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import dayjs from 'dayjs';
import { Info } from 'lucide-react-native';
import { AppText } from '../../components/AppText';
import { rangeLabel, type DateRange } from '../../components/DateRangeSheet';
import { useSync } from '../../store/syncStore';
import { colors, radii, space } from '../../theme';

export const thisMonth = (): DateRange => ({ from: dayjs().startOf('month'), to: dayjs() });

/** The sales period held locally, from the last download. */
export function useSalesWindow(): DateRange | null {
  const from = useSync((s) => s.info?.run?.sales_from);
  const to = useSync((s) => s.info?.run?.sales_to);
  return useMemo(() => (from && to ? { from: dayjs(from), to: dayjs(to) } : null), [from, to]);
}

/** Shown when the chosen dates reach outside what was downloaded. */
export function OutsideWindowNote({
  range,
  downloaded,
  style,
}: {
  range: DateRange;
  downloaded: DateRange | null;
  style?: StyleProp<ViewStyle>;
}) {
  const setUpdateSheetOpen = useSync((s) => s.setUpdateSheetOpen);
  if (!downloaded || (!range.from.isBefore(downloaded.from, 'day') && !range.to.isAfter(downloaded.to, 'day'))) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => setUpdateSheetOpen(true)} style={[styles.note, style]}>
      <Info size={16} color={colors.info} />
      <AppText variant="caption" color="info" style={styles.noteText}>
        Downloaded sales cover {rangeLabel(downloaded)}. Tap to update with a different period.
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: space.xs,
    marginHorizontal: space.gutter,
    marginBottom: space.xs,
    padding: space.sm,
    borderRadius: radii.control,
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoLine,
  },
  noteText: { flex: 1 },
});
