import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

export interface DateRange {
  from: Dayjs;
  to: Dayjs;
}

/** Indian financial year starting on 1 April of the year containing `d`. */
const fyStart = (d: Dayjs) => (d.month() >= 3 ? d.year() : d.year() - 1);

export function presetRanges(today = dayjs()) {
  const fy = fyStart(today);
  return [
    { key: 'this-month', label: 'This month', range: { from: today.startOf('month'), to: today } },
    {
      key: 'last-month',
      label: 'Last month',
      range: { from: today.subtract(1, 'month').startOf('month'), to: today.subtract(1, 'month').endOf('month') },
    },
    { key: 'last-3', label: 'Last 3 months', range: { from: today.subtract(2, 'month').startOf('month'), to: today } },
    { key: 'this-fy', label: `This financial year (FY ${fy}-${String(fy + 1).slice(2)})`, range: { from: dayjs(`${fy}-04-01`), to: today } },
    {
      key: 'last-fy',
      label: `Last financial year (FY ${fy - 1}-${String(fy).slice(2)})`,
      range: { from: dayjs(`${fy - 1}-04-01`), to: dayjs(`${fy}-03-31`) },
    },
  ];
}

export const rangeLabel = (r: DateRange) =>
  r.from.year() === r.to.year()
    ? `${r.from.format('DD MMM')} – ${r.to.format('DD MMM YYYY')}`
    : `${r.from.format('DD MMM YY')} – ${r.to.format('DD MMM YY')}`;

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  visible: boolean;
  value: DateRange;
  onApply: (r: DateRange) => void;
  onClose: () => void;
  title?: string;
  /** Shown under the calendar, above the button. */
  note?: React.ReactNode;
  confirmLabel?: string;
  /** false: tapping a preset only selects it, the button confirms (Update flow). */
  presetsApply?: boolean;
}

/** Presets first; a calendar for anything else (tap start, then end). */
export function DateRangeSheet({ visible, value, onApply, onClose, title = 'Date range', note, confirmLabel = 'Apply', presetsApply = true }: Props) {
  const [from, setFrom] = useState<Dayjs>(value.from);
  const [to, setTo] = useState<Dayjs | null>(value.to);
  const [month, setMonth] = useState<Dayjs>(value.to.startOf('month'));
  const presets = useMemo(() => presetRanges(), []);
  const today = dayjs();

  useEffect(() => {
    if (visible) {
      setFrom(value.from);
      setTo(value.to);
      setMonth(value.to.startOf('month'));
    }
  }, [visible, value]);

  const pickDay = (d: Dayjs) => {
    if (to || d.isBefore(from, 'day')) {
      setFrom(d);
      setTo(null);
    } else {
      setTo(d);
    }
  };

  // Monday-first grid for the shown month.
  const first = month.startOf('month');
  const lead = (first.day() + 6) % 7;
  const cells: Array<Dayjs | null> = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: month.daysInMonth() }, (_, i) => first.add(i, 'day')),
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={to ? rangeLabel({ from, to }) : `${from.format('DD MMM YYYY')} – pick an end date`}
      footer={
        <Button
          label={confirmLabel}
          disabled={!to}
          onPress={() => {
            if (to) onApply({ from, to });
            onClose();
          }}
          style={styles.flex}
          testID="daterange-apply"
        />
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.presets}>
          {presets.map((p) => {
            const on = to && p.range.from.isSame(from, 'day') && p.range.to.isSame(to, 'day');
            return (
              <Pressable
                key={p.key}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                onPress={() => {
                  if (presetsApply) {
                    onApply(p.range);
                    onClose();
                  } else {
                    setFrom(p.range.from);
                    setTo(p.range.to);
                    setMonth(p.range.to.startOf('month'));
                  }
                }}
                style={[styles.preset, on && styles.presetOn]}
              >
                <AppText variant="label" style={{ color: on ? colors.accent : colors.text2 }}>
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.monthRow}>
          <Pressable accessibilityLabel="Previous month" onPress={() => setMonth((m) => m.subtract(1, 'month'))} hitSlop={10} style={styles.nav}>
            <ChevronLeft size={20} color={colors.text2} />
          </Pressable>
          <AppText variant="title">{month.format('MMMM YYYY')}</AppText>
          <Pressable
            accessibilityLabel="Next month"
            disabled={month.isSame(today, 'month')}
            onPress={() => setMonth((m) => m.add(1, 'month'))}
            hitSlop={10}
            style={[styles.nav, month.isSame(today, 'month') && styles.navOff]}
          >
            <ChevronRight size={20} color={colors.text2} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {WEEK.map((w, i) => (
            <View key={`w${i}`} style={styles.cell}>
              <AppText variant="caption" color="text4">
                {w}
              </AppText>
            </View>
          ))}
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={styles.cell} />;
            const future = d.isAfter(today, 'day');
            const isStart = d.isSame(from, 'day');
            const isEnd = !!to && d.isSame(to, 'day');
            const inside = !!to && d.isAfter(from, 'day') && d.isBefore(to, 'day');
            return (
              <Pressable
                key={d.format('YYYYMMDD')}
                disabled={future}
                accessibilityLabel={d.format('D MMMM YYYY')}
                onPress={() => pickDay(d)}
                style={[styles.cell, inside && styles.inside]}
              >
                <View style={[styles.day, (isStart || isEnd) && styles.dayOn]}>
                  <AppText
                    variant="bodyMedium"
                    style={{ color: isStart || isEnd ? colors.onAccent : future ? colors.text4 : colors.text }}
                  >
                    {d.date()}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
        {note}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: space.gutter, paddingBottom: space.md },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  preset: {
    paddingHorizontal: space.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  presetOn: { borderColor: colors.accentTint2, backgroundColor: colors.accentTint },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg, marginBottom: space.xs },
  nav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.surface2 },
  navOff: { opacity: 0.35 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' },
  inside: { backgroundColor: colors.accentTint },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.accent },
});
