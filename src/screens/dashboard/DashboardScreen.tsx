import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Boxes,
  ChartColumn,
  ChevronRight,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { localData } from '../../db/localData';
import { AppText } from '../../components/AppText';
import { Card, CardHead } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { StatTile } from '../../components/StatTile';
import { ErrorState } from '../../components/StateViews';
import { reportAccess, VIEW_LABEL, type ReportFamily, type ReportView } from '../../constants/modules';
import { openTab } from '../../navigation/navigationRef';
import { useSession } from '../../store/sessionStore';
import { useSync } from '../../store/syncStore';
import { colors, radii, space } from '../../theme';
import { DataFreshness, DistributorActivityCard, SalesThisMonth, StockAlertsCards } from './SalesInsights';
import { dashboardTiles } from './tiles';

const greetingFor = (h: number) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

export function DashboardScreen() {
  const user = useSession((s) => s.user);
  const modules = useSession((s) => s.modules);
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const isAdmin = user?.role === 'SUPEROWNER' || user?.role === 'OWNER';
  const version = useSync((s) => s.version);
  const hasData = useSync((s) => !!s.info?.hasData);
  const running = useSync((s) => s.running);
  const lastError = useSync((s) => s.lastError);
  const startSync = useSync((s) => s.start);

  // Saved copy only: the API is called by the download, never by this screen.
  const q = useQuery({
    queryKey: ['local', 'dashboard', user?.id, orgId, version],
    queryFn: () => localData.dashboard(user?.id ?? 0, orgId),
    enabled: !!user && hasData,
  });
  const tiles = dashboardTiles(user?.role, q.data ?? undefined);
  const firstDownloadFailed = !hasData && !running && !!lastError;
  const access = useMemo(() => reportAccess(user?.role, modules), [user?.role, modules]);

  const hasReports = access.sales.length > 0 || access.stock.length > 0;
  // Each view has its own download; the All one holds every row.
  const salesMapped = !access.sales.includes('all');
  const stockMapped = !access.stock.includes('all');

  const shortcuts: Array<{ family: ReportFamily; view: ReportView; title: string; icon: LucideIcon }> = [
    ...access.sales.map((v) => ({ family: 'sales' as const, view: v, title: `Sales · ${VIEW_LABEL[v]}`, icon: v === 'analytics' ? TrendingUp : ChartColumn })),
    ...access.stock.map((v) => ({ family: 'stock' as const, view: v, title: `Closing Stock · ${VIEW_LABEL[v]}`, icon: v === 'analytics' ? TrendingUp : Boxes })),
  ];

  return (
    <Screen title="Dashboard" tenant>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greeting}>
          <View style={styles.glow} />
          <AppText variant="overline" color="accent">
            {dayjs().format('dddd, DD MMM YYYY')}
          </AppText>
          <AppText variant="display" color="chromeText" style={styles.greetTitle}>
            {greetingFor(dayjs().hour())}, {user?.firstName || 'there'}
          </AppText>
          <AppText variant="body" color="chromeMuted">
            {isAdmin ? 'System overview and management at a glance.' : "Here's what's happening with your account today."}
          </AppText>
        </View>

        {firstDownloadFailed ? (
          <Card>
            <ErrorState message={`The first download didn't finish: ${lastError}`} onRetry={() => void startSync(null, 'first')} />
          </Card>
        ) : (
          <>
            {hasReports ? <DataFreshness /> : null}
            {access.sales.length ? (
              <>
                <SalesThisMonth mapped={salesMapped} />
                <DistributorActivityCard mapped={salesMapped} />
              </>
            ) : null}
            {access.stock.length ? (
              <>
                <Section title="Stock at dealers" />
                <StockAlertsCards mapped={stockMapped} />
              </>
            ) : null}
            {hasReports ? <Section title="Account" /> : null}
            <View style={styles.grid}>
              {[0, 2].map((start) => (
                <View key={start} style={styles.gridRow}>
                  {tiles.slice(start, start + 2).map((t) => (
                    <StatTile key={t.label} label={t.label} value={t.value} badge={t.badge} icon={t.icon} loading={!hasData || q.isLoading} testID={`tile-${t.label}`} />
                  ))}
                </View>
              ))}
            </View>
          </>
        )}

        {shortcuts.length ? (
          <Card>
            <CardHead icon={ChartColumn} title="Reports" sub="Secondary sales and stock from your distributors" />
            {shortcuts.map((s, i) => (
              <Pressable
                key={`${s.family}-${s.view}`}
                testID={`shortcut-${s.family}-${s.view}`}
                accessibilityRole="button"
                accessibilityLabel={s.title}
                onPress={() => openTab(s.family === 'sales' ? 'Sales' : 'Stock', s.view)}
                style={({ pressed }) => [styles.link, i > 0 && styles.linkBorder, pressed && styles.linkPressed]}
              >
                <s.icon size={18} color={colors.text3} />
                <AppText variant="bodyMedium" style={styles.linkText}>
                  {s.title}
                </AppText>
                <ChevronRight size={18} color={colors.text4} />
              </Pressable>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Section({ title }: { title: string }) {
  return (
    <AppText variant="overline" color="text3" style={styles.section}>
      {title}
    </AppText>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: space.xxs, marginTop: space.xs },
  content: { padding: space.gutter, gap: space.md, paddingBottom: space.xxl },
  greeting: {
    backgroundColor: colors.chrome,
    borderRadius: radii.card,
    padding: space.lg,
    gap: 6,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.18,
  },
  greetTitle: { marginTop: 2 },
  grid: { gap: space.sm },
  gridRow: { flexDirection: 'row', gap: space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.xxs },
  linkBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  linkPressed: { backgroundColor: colors.surface2 },
  linkText: { flex: 1 },
});
