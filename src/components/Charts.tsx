import React, { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';

export interface Datum {
  label: string;
  value: number;
}

/**
 * Ranked horizontal bars — readable on a phone where a pie chart isn't.
 * Labels sit above each bar so long dealer names don't squeeze the bar.
 */
export function BarList({ data, format, max: maxRows = 10 }: { data: Datum[]; format: (v: number) => string; max?: number }) {
  const rows = data.slice(0, maxRows);
  const total = data.reduce((s, d) => s + Math.max(d.value, 0), 0);
  const top = Math.max(...rows.map((d) => d.value), 0);
  if (!rows.length) {
    return (
      <AppText variant="body" color="text3" style={styles.none}>
        No data available
      </AppText>
    );
  }
  return (
    <View style={styles.list}>
      {rows.map((d, i) => (
        <View key={`${d.label}-${i}`} accessible accessibilityLabel={`${d.label}: ${format(d.value)}`}>
          <View style={styles.listHead}>
            <AppText variant="bodyMedium" numberOfLines={1} style={styles.listLabel}>
              {d.label}
            </AppText>
            <AppText variant="number">{format(d.value)}</AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${top > 0 ? Math.max((d.value / top) * 100, 1.5) : 0}%` }]} />
          </View>
          {total > 0 ? (
            <AppText variant="caption" color="text4" style={styles.share}>
              {((Math.max(d.value, 0) / total) * 100).toFixed(1)}% of total
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Vertical columns over time (months, days). Scrolls sideways past ~6 columns;
 * `startAtEnd` opens on the latest ones.
 */
export function ColumnChart({
  data,
  format,
  height = 150,
  startAtEnd = false,
}: {
  data: Datum[];
  format: (v: number) => string;
  height?: number;
  startAtEnd?: boolean;
}) {
  const scroller = useRef<ScrollView>(null);
  const top = Math.max(...data.map((d) => d.value), 0);
  if (!data.length) {
    return (
      <AppText variant="body" color="text3" style={styles.none}>
        No data available
      </AppText>
    );
  }
  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cols}
      onContentSizeChange={startAtEnd ? () => scroller.current?.scrollToEnd({ animated: false }) : undefined}
    >
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.col} accessible accessibilityLabel={`${d.label}: ${format(d.value)}`}>
          <AppText variant="caption" color="text2" numberOfLines={1} style={styles.colValue}>
            {format(d.value)}
          </AppText>
          <View style={[styles.colTrack, { height }]}>
            <View style={[styles.colFill, { height: `${top > 0 ? Math.max((d.value / top) * 100, 1) : 0}%` }]} />
          </View>
          <AppText variant="caption" color="text3" numberOfLines={1} style={styles.colLabel}>
            {d.label}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  none: { paddingVertical: space.lg, textAlign: 'center' },
  list: { gap: space.sm },
  listHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginBottom: 5 },
  listLabel: { flex: 1 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
  share: { marginTop: 3, fontSize: 11 },
  cols: { gap: space.sm, paddingTop: space.xs, alignItems: 'flex-end', minWidth: '100%' },
  col: { width: 52, alignItems: 'center' },
  colValue: { fontSize: 10.5, marginBottom: 4 },
  colTrack: { width: 28, justifyContent: 'flex-end', borderRadius: radii.sm, backgroundColor: colors.surface3, overflow: 'hidden' },
  colFill: { width: '100%', backgroundColor: colors.accent, borderRadius: radii.sm },
  colLabel: { marginTop: 6, fontSize: 10.5 },
});
