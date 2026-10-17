import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ApiError, toApiError } from '../../api/client';
import { AppText } from '../../components/AppText';
import { Card, CardHead } from '../../components/Card';
import { StatTile } from '../../components/StatTile';
import { EmptyState, ErrorState } from '../../components/StateViews';
import { colors, space } from '../../theme';
import { formatCount } from '../../utils/format';

export interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  badge?: string;
}

/**
 * Shared frame for both analytics views: filters, then the loading, error or
 * empty state, then KPI tiles and chart cards. Rows come from the local
 * database, so there's no download progress here.
 */
export function AnalyticsFrame({
  filters,
  loading,
  error,
  onRetry,
  rowCount,
  noun,
  emptyHint,
  kpis,
  children,
}: {
  filters: React.ReactNode;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  rowCount: number;
  noun: string;
  emptyHint: string;
  kpis: Kpi[];
  children: React.ReactNode;
}) {
  const err = error ? (error instanceof ApiError ? error : toApiError(error)) : null;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <Card style={styles.progress}>
        <ActivityIndicator color={colors.accent} />
        <AppText variant="title" align="center">
          Crunching the numbers
        </AppText>
      </Card>
    );
  } else if (err) {
    body = (
      <Card>
        <ErrorState message={err.message} onRetry={onRetry} />
      </Card>
    );
  } else if (rowCount === 0) {
    body = (
      <Card>
        <EmptyState title="Nothing to analyse yet" hint={emptyHint} />
      </Card>
    );
  } else {
    body = (
      <>
        <AppText variant="caption" color="text3">
          Based on {formatCount(rowCount)} {noun}
        </AppText>
        <View style={styles.grid}>
          {[0, 2].map((start) => (
            <View key={start} style={styles.gridRow}>
              {kpis.slice(start, start + 2).map((k) => (
                <StatTile key={k.label} label={k.label} value={k.value} icon={k.icon} badge={k.badge} />
              ))}
            </View>
          ))}
        </View>
        {children}
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.bleed}>{filters}</View>
      {body}
    </ScrollView>
  );
}

export function ChartCard({ icon, title, sub, children }: { icon: LucideIcon; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHead icon={icon} title={title} sub={sub} />
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingBottom: space.xxl, gap: space.md },
  bleed: { marginHorizontal: -space.gutter, marginBottom: -space.xs },
  progress: { alignItems: 'center', gap: space.xs, paddingVertical: space.xxl },
  grid: { gap: space.sm },
  gridRow: { flexDirection: 'row', gap: space.sm },
});
