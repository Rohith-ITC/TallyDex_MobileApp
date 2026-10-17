import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CalendarRange, Clock, Database, HardDrive, RefreshCw, Sparkles, X } from 'lucide-react-native';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card, CardHead } from '../../components/Card';
import { rangeLabel } from '../../components/DateRangeSheet';
import { progressLabel } from '../../components/LocalDataGate';
import { ScopeBar } from '../../components/ScopeBar';
import { useDataStatus } from '../../components/Screen';
import { reportAccess } from '../../constants/modules';
import { localData } from '../../db/localData';
import { SCHEMA_VERSION, TABLES, type TableKey } from '../../db/schema';
import { useSession } from '../../store/sessionStore';
import { STALE_AFTER_MS, useSync } from '../../store/syncStore';
import { datasetsFor } from '../../sync/syncEngine';
import { colors, radii, space } from '../../theme';
import { formatCount, formatDateTime } from '../../utils/format';

const DATASET_LABEL: Record<TableKey, string> = {
  dashboard: 'Dashboard',
  filterOption: 'Filter options',
  sales: 'Sales · All',
  mappedSales: 'Sales · Mapped',
  closing: 'Closing Stock · All',
  mappedClosing: 'Closing Stock · Mapped',
};

const TABLE_LABEL: Record<string, string> = Object.fromEntries(
  (Object.keys(TABLES) as TableKey[]).map((k) => [TABLES[k].name, DATASET_LABEL[k]]),
);

const formatBytes = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Status of the saved copy and the controls for it: update, auto-update, new API fields. */
export function DataManagementScreen() {
  const navigation = useNavigation();
  const org = useSession((s) => s.selectedOrg);
  const role = useSession((s) => s.user?.role);
  const modules = useSession((s) => s.modules);
  const sync = useSync();
  const status = useDataStatus();
  const included = datasetsFor(reportAccess(role, modules));

  const extra = useQuery({ queryKey: ['local', 'extraKeys', sync.version], queryFn: localData.extraKeys });
  const size = useQuery({ queryKey: ['local', 'dbSize', sync.version], queryFn: localData.sizeBytes });

  const run = sync.info?.run;
  const finished = run?.finished_at ? dayjs(run.finished_at) : null;
  const nextAuto = finished ? finished.add(STALE_AFTER_MS, 'millisecond') : null;
  const salesWindow = run?.sales_from && run.sales_to ? rangeLabel({ from: dayjs(run.sales_from), to: dayjs(run.sales_to) }) : null;
  const pct = sync.progress ? Math.round(((sync.progress.stepIndex - 1) / sync.progress.stepCount) * 100) : 0;
  const totalRows = Object.values(sync.info?.datasets ?? {}).reduce((n, d) => n + (d?.rows ?? 0), 0);

  return (
    <View style={styles.root}>
      <AppHeader title="Data Management" left="back" onLeftPress={() => navigation.goBack()} />
      {org ? <ScopeBar name={org.name} status={status} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <CardHead icon={RefreshCw} title="Saved data" sub="Screens read this copy; the server is only called to update it." />
          {sync.running ? (
            <>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(pct, 4)}%` }]} />
              </View>
              <AppText variant="caption" color="text2" style={styles.line} testID="dm-progress">
                {progressLabel(sync.progress)}
              </AppText>
            </>
          ) : (
            <View style={styles.kv}>
              <AppText variant="caption" color="text3">
                Last updated
              </AppText>
              <AppText variant="bodyMedium">{finished ? formatDateTime(finished.toISOString()) : 'Never'}</AppText>
            </View>
          )}
          {sync.lastError && !sync.running ? (
            <View style={styles.error}>
              <AppText variant="caption" color="danger">
                Last update failed: {sync.lastError}. The data shown is from the previous successful update.
              </AppText>
            </View>
          ) : null}
          <View style={styles.actions}>
            {sync.running ? (
              <Button label="Cancel" variant="ghost" icon={X} onPress={sync.cancel} style={styles.flex} testID="dm-cancel" />
            ) : null}
            <Button
              label={sync.running ? 'Restart' : 'Update now'}
              icon={RefreshCw}
              onPress={() => sync.setUpdateSheetOpen(true)}
              style={styles.flex}
              testID="dm-update"
            />
          </View>
        </Card>

        <Card>
          <CardHead icon={Clock} title="Automatic updates" />
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <AppText variant="bodyMedium">Update automatically</AppText>
              <AppText variant="caption" color="text3">
                When the saved data is more than 24 hours old, it's downloaded again in the background with the same sales period.
              </AppText>
            </View>
            <Switch
              testID="dm-auto"
              accessibilityLabel="Update automatically"
              value={sync.autoUpdate}
              onValueChange={sync.setAutoUpdate}
              trackColor={{ true: colors.accent, false: colors.line }}
              thumbColor={colors.surface}
            />
          </View>
          {sync.autoUpdate && nextAuto ? (
            <AppText variant="caption" color="text4" style={styles.line}>
              Next automatic update after {formatDateTime(nextAuto.toISOString())}
            </AppText>
          ) : null}
        </Card>

        {included.some((k) => k === 'sales' || k === 'mappedSales') ? (
          <Card>
            <CardHead icon={CalendarRange} title="Sales period" />
            <AppText variant="bodyMedium">{salesWindow ?? 'Not downloaded yet'}</AppText>
            <AppText variant="caption" color="text3" style={styles.line}>
              Choose a different period with Update now. Closing stock is always the current position.
            </AppText>
          </Card>
        ) : null}

        <Card>
          <CardHead icon={Database} title="Downloaded datasets" sub={`${formatCount(totalRows)} rows in total`} />
          {(Object.keys(DATASET_LABEL) as TableKey[]).map((k, i) => {
            const d = sync.info?.datasets[k];
            const on = included.includes(k);
            return (
              <View key={k} style={[styles.row, i > 0 && styles.rowBorder]}>
                <View style={styles.flex}>
                  <AppText variant="bodyMedium">{DATASET_LABEL[k]}</AppText>
                  <AppText variant="caption" color="text4">
                    {on ? (d ? `Updated ${formatDateTime(d.syncedAt)}` : 'Waiting for the first download') : 'Not enabled for your organization'}
                  </AppText>
                </View>
                {on && d ? <AppText variant="number">{formatCount(d.rows)}</AppText> : <Badge label={on ? 'Pending' : 'Off'} tone={on ? 'warn' : 'mute'} />}
              </View>
            );
          })}
        </Card>

        <Card>
          <CardHead
            icon={Sparkles}
            title="New fields from the API"
            sub="Fields the app has no column for yet. They're kept in json_data and can be made columns in an app update."
          />
          {extra.data?.length ? (
            extra.data.map((e, i) => (
              <View key={`${e.table_name}.${e.key}`} style={[styles.field, i > 0 && styles.rowBorder]}>
                <View style={styles.fieldHead}>
                  <AppText variant="title" style={styles.mono}>
                    {e.key}
                  </AppText>
                  <Badge label={TABLE_LABEL[e.table_name] ?? e.table_name} tone="info" dot={false} />
                </View>
                <AppText variant="caption" color="text3" numberOfLines={2}>
                  Example: {e.example}
                </AppText>
                <AppText variant="caption" color="text4">
                  First seen {formatDateTime(e.first_seen_at)} · in {formatCount(e.seen_count)} rows
                </AppText>
              </View>
            ))
          ) : (
            <AppText variant="body" color="text3">
              {extra.isLoading ? 'Checking…' : 'None so far. Every field the API sends has its own column.'}
            </AppText>
          )}
        </Card>

        <Card>
          <CardHead icon={HardDrive} title="Storage" />
          <View style={styles.kv}>
            <AppText variant="caption" color="text3">
              Database size
            </AppText>
            <AppText variant="bodyMedium">{size.data ? formatBytes(size.data) : '—'}</AppText>
          </View>
          <View style={styles.kv}>
            <AppText variant="caption" color="text3">
              Schema version
            </AppText>
            <AppText variant="bodyMedium">{SCHEMA_VERSION}</AppText>
          </View>
          <AppText variant="caption" color="text4" style={styles.line}>
            Logging out deletes all saved data from this phone.
          </AppText>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.gutter, gap: space.md, paddingBottom: space.xxl },
  flex: { flex: 1 },
  line: { marginTop: space.xs },
  track: { height: 6, borderRadius: radii.pill, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radii.pill },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  error: {
    marginTop: space.sm,
    padding: space.sm,
    borderRadius: radii.control,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerLine,
  },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  field: { paddingVertical: 10, gap: 3 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
  mono: { fontSize: 14 },
});
