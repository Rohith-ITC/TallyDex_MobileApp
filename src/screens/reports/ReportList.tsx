import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react-native';
import { toApiError } from '../../api/client';
import type { Paged } from '../../api/types';
import { AppText } from '../../components/AppText';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/StateViews';
import { colors, radii, space } from '../../theme';
import { formatCount } from '../../utils/format';

export const PAGE_SIZE = 50;

export interface RowView {
  title: string;
  subtitle: string;
  meta?: string;
  value: string;
  valueSub?: string;
}

interface Props<T> {
  queryKey: readonly unknown[];
  fetchPage: (page: number, limit: number) => Promise<Paged<T>>;
  toRow: (item: T) => RowView;
  onRowPress: (item: T) => void;
  /** "1,240 vouchers" */
  noun: string;
  header?: React.ReactNode;
  emptyTitle: string;
  emptyHint: string;
}

/**
 * Card rows instead of the web table (rule R10), read 50 at a time from the
 * local database as the user scrolls (rule R14). Tapping a row opens the full
 * record. Refreshing is the Update action, not pull-to-refresh.
 */
export function ReportList<T>({ queryKey, fetchPage, toRow, onRowPress, noun, header, emptyTitle, emptyHint }: Props<T>) {
  const q = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam, PAGE_SIZE),
    getNextPageParam: (last) => {
      const p = last.pagination;
      if (!p) return undefined;
      if (p.totalPages ? p.page < p.totalPages : last.items.length === PAGE_SIZE) return (p.page || 1) + 1;
      return undefined;
    },
  });

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const total = q.data?.pages[0]?.pagination?.total ?? items.length;
  const error = q.error ? toApiError(q.error) : null;

  const listHeader = (
    <View>
      {/* The filter bar carries its own gutter, so it bleeds to the screen edges. */}
      <View style={styles.bleed}>{header}</View>
      {!q.isLoading && !error && items.length > 0 ? (
        <AppText variant="caption" color="text3" style={styles.count} testID="report-count">
          {formatCount(total)} {noun}
          {items.length < total ? ` · showing ${formatCount(items.length)}` : ''}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(_, i) => String(i)}
      contentContainerStyle={styles.content}
      ListHeaderComponent={listHeader}
      ItemSeparatorComponent={Separator}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (q.hasNextPage && !q.isFetchingNextPage && !q.isError) void q.fetchNextPage();
      }}
      initialNumToRender={12}
      windowSize={9}
      renderItem={({ item }) => {
        const r = toRow(item);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${r.title}, ${r.value}`}
            onPress={() => onRowPress(item)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowMain}>
              <AppText variant="title" numberOfLines={1} style={styles.rowTitle}>
                {r.title}
              </AppText>
              <AppText variant="caption" color="text3" numberOfLines={1}>
                {r.subtitle}
              </AppText>
              {r.meta ? (
                <AppText variant="caption" color="text4" numberOfLines={1}>
                  {r.meta}
                </AppText>
              ) : null}
            </View>
            <View style={styles.rowRight}>
              <AppText variant="number" align="right">
                {r.value}
              </AppText>
              {r.valueSub ? (
                <AppText variant="caption" color="text3" align="right">
                  {r.valueSub}
                </AppText>
              ) : null}
            </View>
            <ChevronRight size={16} color={colors.text4} />
          </Pressable>
        );
      }}
      ListEmptyComponent={
        q.isLoading ? (
          <SkeletonRows />
        ) : error ? (
          <ErrorState message={error.message} isNetwork={error.isNetwork} onRetry={() => void q.refetch()} />
        ) : (
          <EmptyState title={emptyTitle} hint={emptyHint} />
        )
      }
      ListFooterComponent={
        q.isFetchingNextPage ? (
          <ActivityIndicator color={colors.accent} style={styles.more} />
        ) : q.isError && items.length ? (
          <Pressable onPress={() => void q.fetchNextPage()} style={styles.more} accessibilityRole="button">
            <AppText variant="label" color="accent" align="center">
              Couldn't load more. Tap to retry.
            </AppText>
          </Pressable>
        ) : null
      }
    />
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingBottom: space.xxl, flexGrow: 1 },
  bleed: { marginHorizontal: -space.gutter },
  count: { marginBottom: space.xs, marginTop: space.xxs },
  sep: { height: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 68,
    paddingVertical: space.sm,
    paddingLeft: space.md,
    paddingRight: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowPressed: { backgroundColor: colors.surface2, borderColor: colors.accentTint2 },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14.5 },
  rowRight: { alignItems: 'flex-end', maxWidth: '42%' },
  more: { paddingVertical: space.lg },
});
