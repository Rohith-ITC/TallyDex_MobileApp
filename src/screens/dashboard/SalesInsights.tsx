import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ChevronRight,
  Database,
  Hourglass,
  IndianRupee,
  Package,
  PackageX,
  Receipt,
  ReceiptText,
  Store,
  TrendingUp,
} from 'lucide-react-native';
import { AppText } from '../../components/AppText';
import { Badge } from '../../components/Badge';
import { Card, CardHead } from '../../components/Card';
import { ColumnChart } from '../../components/Charts';
import { rangeLabel } from '../../components/DateRangeSheet';
import { useDataStatus } from '../../components/Screen';
import { StatTile } from '../../components/StatTile';
import { ErrorState, Skeleton } from '../../components/StateViews';
import { distributorActivity, LOW_COVER_DAYS, salesSummary, stockAlerts, type StockAlertRow } from '../../db/insights';
import { openDataManagement, openTab } from '../../navigation/navigationRef';
import { useSession } from '../../store/sessionStore';
import { useSync } from '../../store/syncStore';
import { colors, radii, space } from '../../theme';
import { apiDate, formatCount, formatDate, formatINRShort, formatQty } from '../../utils/format';
import { OutsideWindowNote, thisMonth, useSalesWindow } from '../reports/salesWindow';

/** Rows shown before "Show more". */
const PREVIEW = 5;

function useScope() {
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const version = useSync((s) => s.version);
  const hasData = useSync((s) => !!s.info?.hasData);
  return { orgId, version, hasData };
}

/** "Updated 12:16 · Sales 01 Oct – 27 Oct 2026"; opens Data Management. */
export function DataFreshness() {
  const status = useDataStatus();
  const window = useSalesWindow();
  return (
    <Pressable
      testID="dash-freshness"
      accessibilityRole="button"
      accessibilityLabel="Open Data Management"
      onPress={openDataManagement}
      style={({ pressed }) => [styles.fresh, pressed && styles.freshPressed]}
    >
      <Database size={16} color={colors.text3} />
      <View style={styles.flex}>
        <AppText variant="label" color={status?.tone === 'danger' ? 'danger' : 'text2'}>
          {status?.text ?? 'Not downloaded yet'}
        </AppText>
        {window ? (
          <AppText variant="caption" color="text3">
            Sales on this phone: {rangeLabel(window)}
          </AppText>
        ) : null}
      </View>
      <ChevronRight size={16} color={colors.text4} />
    </Pressable>
  );
}

/** This month's sales tiles and the daily trend. */
export function SalesThisMonth({ mapped }: { mapped: boolean }) {
  const { orgId, version, hasData } = useScope();
  const downloaded = useSalesWindow();
  const range = thisMonth();
  const from = apiDate(range.from);
  const to = apiDate(range.to);
  const q = useQuery({
    queryKey: ['local', 'insights', 'sales', orgId, mapped, from, to, version],
    queryFn: () => salesSummary(orgId, mapped, from, to),
    enabled: hasData,
  });
  const loading = !hasData || q.isLoading;
  const s = q.data;
  const tiles = [
    { label: 'Sales value', value: s ? formatINRShort(s.value) : '—', icon: IndianRupee },
    { label: 'Quantity sold', value: s ? formatQty(s.qty) : '—', icon: Package },
    { label: 'Invoices', value: s ? formatCount(s.invoices) : '—', icon: Receipt },
    { label: 'Average invoice', value: s ? formatINRShort(s.avgInvoice) : '—', icon: ReceiptText },
  ];
  const open = () => openTab('Sales', mapped ? 'mapped' : 'all');

  return (
    <>
      <View style={styles.sectionHead}>
        <AppText variant="overline" color="text3">
          Sales · {range.from.format('MMMM YYYY')}
        </AppText>
      </View>
      <OutsideWindowNote range={range} downloaded={downloaded} style={styles.note} />
      {q.isError ? (
        <Card>
          <ErrorState message="Couldn't read the saved sales." onRetry={() => void q.refetch()} />
        </Card>
      ) : (
        <>
          <View style={styles.grid}>
            {[0, 2].map((start) => (
              <View key={start} style={styles.gridRow}>
                {tiles.slice(start, start + 2).map((t) => (
                  <StatTile key={t.label} {...t} loading={loading} onPress={open} testID={`dash-${t.label}`} />
                ))}
              </View>
            ))}
          </View>
          <Card>
            <CardHead icon={TrendingUp} title="Daily sales" sub={`${range.from.format('DD MMM')} – ${range.to.format('DD MMM')}`} />
            {loading ? <Skeleton height={190} /> : <ColumnChart data={s?.daily ?? []} format={formatINRShort} height={130} startAtEnd />}
          </Card>
        </>
      )}
    </>
  );
}

/** Distributors (Tally companies) with and without sales this month. */
export function DistributorActivityCard({ mapped }: { mapped: boolean }) {
  const { orgId, version, hasData } = useScope();
  const range = thisMonth();
  const from = apiDate(range.from);
  const to = apiDate(range.to);
  const [expanded, setExpanded] = useState(false);
  const q = useQuery({
    queryKey: ['local', 'insights', 'distributors', orgId, mapped, from, to, version],
    queryFn: () => distributorActivity(orgId, mapped, from, to),
    enabled: hasData,
  });
  const d = q.data;
  const rows = d ? (expanded ? d.silent : d.silent.slice(0, PREVIEW)) : [];

  return (
    <Card testID="dash-distributors">
      <CardHead
        icon={Store}
        title="Distributors"
        sub="No sales this month: worth a call or visit"
        right={d ? <Badge label={`${formatCount(d.active)} of ${formatCount(d.total)} active`} tone={d.silent.length ? 'warn' : 'ok'} /> : undefined}
      />
      {!hasData || q.isLoading ? (
        <Skeleton height={120} />
      ) : q.isError ? (
        <ErrorState message="Couldn't read the saved sales." onRetry={() => void q.refetch()} />
      ) : !d?.total ? (
        <AppText variant="body" color="text3" style={styles.none}>
          No distributors in the downloaded data.
        </AppText>
      ) : !d.silent.length ? (
        <AppText variant="body" color="text3" style={styles.none}>
          Every distributor has sales this month.
        </AppText>
      ) : (
        <>
          {rows.map((r, i) => (
            <View key={r.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={styles.flex}>
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {r.name}
                </AppText>
                <AppText variant="caption" color="text3">
                  {r.lastSale ? `Last sale ${formatDate(r.lastSale)}` : 'No sales in the downloaded period'}
                </AppText>
              </View>
            </View>
          ))}
          <MoreToggle total={d.silent.length} expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
        </>
      )}
    </Card>
  );
}

/** Out-of-stock and low-cover lines from closing stock. */
export function StockAlertsCards({ mapped }: { mapped: boolean }) {
  const { orgId, version, hasData } = useScope();
  const today = apiDate(dayjs());
  const q = useQuery({
    queryKey: ['local', 'insights', 'stock', orgId, mapped, today, version],
    queryFn: () => stockAlerts(orgId, mapped, dayjs(today)),
    enabled: hasData,
  });
  const loading = !hasData || q.isLoading;
  const a = q.data;
  return (
    <>
      <AlertCard
        testID="dash-out-of-stock"
        icon={PackageX}
        title="Out of stock"
        sub="Ran out this month at the dealer"
        tone="danger"
        loading={loading}
        error={q.isError ? () => void q.refetch() : undefined}
        count={a?.outOfStock.count ?? 0}
        rows={a?.outOfStock.rows ?? []}
        empty="Nothing has run out this month."
        detail={(r) => (r.monthOutQty > 0 ? `Sold ${formatQty(r.monthOutQty)} this month` : 'Closing 0')}
        mapped={mapped}
      />
      <AlertCard
        testID="dash-low-cover"
        icon={Hourglass}
        title="Running low"
        sub={`Less than ${LOW_COVER_DAYS} days left at this month's sales rate`}
        tone="warn"
        loading={loading}
        error={q.isError ? () => void q.refetch() : undefined}
        count={a?.lowCover.count ?? 0}
        rows={a?.lowCover.rows ?? []}
        empty="No item is running low."
        detail={(r) => `${formatQty(r.closingQty)} left · ${coverLabel(r.coverDays)}`}
        mapped={mapped}
      />
    </>
  );
}

const coverLabel = (d: number | null) => (d === null ? '—' : d < 1 ? 'under a day' : `${Math.floor(d)} day${Math.floor(d) === 1 ? '' : 's'}`);

function AlertCard({
  testID,
  icon,
  title,
  sub,
  tone,
  loading,
  error,
  count,
  rows,
  empty,
  detail,
  mapped,
}: {
  testID: string;
  icon: typeof PackageX;
  title: string;
  sub: string;
  tone: 'danger' | 'warn';
  loading: boolean;
  error?: () => void;
  count: number;
  rows: StockAlertRow[];
  empty: string;
  detail: (r: StockAlertRow) => string;
  mapped: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, PREVIEW);
  return (
    <Card testID={testID}>
      <CardHead icon={icon} title={title} sub={sub} right={!loading && !error ? <Badge label={formatCount(count)} tone={count ? tone : 'ok'} /> : undefined} />
      {loading ? (
        <Skeleton height={120} />
      ) : error ? (
        <ErrorState message="Couldn't read the saved stock." onRetry={error} />
      ) : !count ? (
        <AppText variant="body" color="text3" style={styles.none}>
          {empty}
        </AppText>
      ) : (
        <>
          {shown.map((r, i) => (
            <View key={`${r.dealer}-${r.item}-${i}`} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={styles.flex}>
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {r.item}
                </AppText>
                <AppText variant="caption" color="text3" numberOfLines={1}>
                  {r.dealer}
                </AppText>
              </View>
              <AppText variant="caption" color={tone} style={styles.rowRight}>
                {detail(r)}
              </AppText>
            </View>
          ))}
          <MoreToggle total={rows.length} expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
          {expanded && count > rows.length ? (
            <AppText variant="caption" color="text3" style={styles.capNote}>
              Showing {formatCount(rows.length)} of {formatCount(count)}. The full list is in Closing Stock.
            </AppText>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => openTab('Stock', mapped ? 'mapped' : 'all')} style={styles.link}>
            <AppText variant="label" color="accent">
              Open Closing Stock
            </AppText>
            <ChevronRight size={14} color={colors.accent} />
          </Pressable>
        </>
      )}
    </Card>
  );
}

function MoreToggle({ total, expanded, onToggle }: { total: number; expanded: boolean; onToggle: () => void }) {
  if (total <= PREVIEW) return null;
  return (
    <Pressable accessibilityRole="button" onPress={onToggle} style={styles.more}>
      <AppText variant="label" color="accent">
        {expanded ? 'Show less' : `Show all ${formatCount(total)}`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionHead: { paddingHorizontal: space.xxs, marginTop: space.xs },
  note: { marginHorizontal: 0, marginBottom: 0 },
  grid: { gap: space.sm },
  gridRow: { flexDirection: 'row', gap: space.sm },
  fresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  freshPressed: { backgroundColor: colors.surface2 },
  none: { paddingVertical: space.md, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs, minHeight: 48 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  rowRight: { maxWidth: '45%', textAlign: 'right' },
  more: { alignSelf: 'center', paddingVertical: space.xs, paddingHorizontal: space.md, minHeight: 40, justifyContent: 'center' },
  capNote: { textAlign: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 2, minHeight: 40, paddingHorizontal: space.xxs },
});
