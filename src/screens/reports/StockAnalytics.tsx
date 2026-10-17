import React, { useMemo, useState } from 'react';
import { Boxes, IndianRupee, Layers, MapPin, Package, Store, Tags } from 'lucide-react-native';
import { BarList } from '../../components/Charts';
import { useSession } from '../../store/sessionStore';
import { formatCount, formatINRShort, formatQty } from '../../utils/format';
import { stockAnalytics } from './aggregate';
import { AnalyticsFrame, ChartCard } from './AnalyticsParts';
import { FILTERS, nums, ReportFilters, strs, type FilterValues } from './Filters';
import { useQuery } from '@tanstack/react-query';
import { localData } from '../../db/localData';
import { useSync } from '../../store/syncStore';

/** Mobile version of ClosingBalanceAnalyticsPage (mapped closing balance). */
export function StockAnalytics() {
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const version = useSync((s) => s.version);
  const [filters, setFilters] = useState<FilterValues>({});

  const q = useQuery({
    queryKey: ['local', 'stockAnalytics', orgId, filters, version],
    queryFn: () =>
      localData.allMappedClosing(orgId, {
        dealerIds: nums(filters, 'dealer'),
        stockGroups: strs(filters, 'stockGroup'),
        categories: strs(filters, 'category'),
        states: strs(filters, 'state'),
        regions: strs(filters, 'region'),
        divisions: strs(filters, 'division'),
      }),
  });

  const a = useMemo(() => stockAnalytics(q.data ?? []), [q.data]);

  return (
    <AnalyticsFrame
      filters={
        <ReportFilters
          defs={[FILTERS.dealer, FILTERS.stockGroup, FILTERS.category, FILTERS.state, FILTERS.region, FILTERS.division]}
          values={filters}
          onChange={setFilters}
        />
      }
      loading={q.isLoading}
      error={q.error}
      onRetry={() => void q.refetch()}
      rowCount={q.data?.length ?? 0}
      noun="stock positions"
      emptyHint="No mapped closing stock yet. Try fewer filters."
      kpis={[
        { label: 'Total Closing Value', value: formatINRShort(a.totalValue), icon: IndianRupee },
        { label: 'Total Closing Quantity', value: formatQty(a.totalQty), icon: Boxes },
        { label: 'Dealers', value: formatCount(a.dealerCount), icon: Store },
        { label: 'HO Items', value: formatCount(a.itemCount), icon: Package },
      ]}
    >
      <ChartCard icon={Layers} title="Top 10 stock groups by value">
        <BarList data={a.groupsByValue} format={formatINRShort} />
      </ChartCard>
      <ChartCard icon={Layers} title="Top 10 stock groups by quantity">
        <BarList data={a.groupsByQty} format={formatQty} />
      </ChartCard>
      <ChartCard icon={Tags} title="Top 10 stock categories by value">
        <BarList data={a.categoriesByValue} format={formatINRShort} />
      </ChartCard>
      <ChartCard icon={Store} title="Top 10 dealers by value">
        <BarList data={a.dealers} format={formatINRShort} />
      </ChartCard>
      <ChartCard icon={Package} title="Top 10 items by value">
        <BarList data={a.items} format={formatINRShort} />
      </ChartCard>
      <ChartCard icon={MapPin} title="Closing value by state">
        <BarList data={a.states} format={formatINRShort} />
      </ChartCard>
      <ChartCard icon={MapPin} title="Closing value by region">
        <BarList data={a.regions} format={formatINRShort} />
      </ChartCard>
    </AnalyticsFrame>
  );
}
