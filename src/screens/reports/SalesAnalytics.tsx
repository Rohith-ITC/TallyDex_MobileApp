import React, { useMemo, useState } from 'react';
import { CalendarRange, IndianRupee, MapPin, Package, Receipt, Store, TrendingUp, Undo2, Users } from 'lucide-react-native';
import { BarList, ColumnChart } from '../../components/Charts';
import type { DateRange } from '../../components/DateRangeSheet';
import { useSession } from '../../store/sessionStore';
import { apiDate, formatCount, formatINRShort, formatQty } from '../../utils/format';
import { salesAnalytics } from './aggregate';
import { AnalyticsFrame, ChartCard } from './AnalyticsParts';
import { FILTERS, nums, ReportFilters, strs, type FilterValues } from './Filters';
import { useQuery } from '@tanstack/react-query';
import { OutsideWindowNote, thisMonth, useSalesWindow } from './salesWindow';
import { localData } from '../../db/localData';
import { useSync } from '../../store/syncStore';

const lakhs = (v: number) => formatINRShort(v);

/** Mobile version of SalesAnalyticsPage: same data (mapped sales), same breakdowns. */
export function SalesAnalytics() {
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const version = useSync((s) => s.version);
  const downloaded = useSalesWindow();
  const [range, setRange] = useState<DateRange>(() => downloaded ?? thisMonth());
  const [filters, setFilters] = useState<FilterValues>({});
  const dateFrom = apiDate(range.from);
  const dateTo = apiDate(range.to);

  const q = useQuery({
    queryKey: ['local', 'salesAnalytics', orgId, dateFrom, dateTo, filters, version],
    queryFn: () =>
      localData.allMappedSales(orgId, {
        dateFrom,
        dateTo,
        dealerIds: nums(filters, 'dealer'),
        hoItemIds: nums(filters, 'hoItem'),
        regions: strs(filters, 'region'),
        divisions: strs(filters, 'division'),
      }),
  });

  const a = useMemo(() => salesAnalytics(q.data ?? []), [q.data]);

  return (
    <AnalyticsFrame
      filters={
        <>
          <ReportFilters
            defs={[FILTERS.dealer, FILTERS.hoItem, FILTERS.region, FILTERS.division]}
            values={filters}
            onChange={setFilters}
            range={range}
            onRangeChange={setRange}
          />
          <OutsideWindowNote range={range} downloaded={downloaded} />
        </>
      }
      loading={q.isLoading}
      error={q.error}
      onRetry={() => void q.refetch()}
      rowCount={q.data?.length ?? 0}
      noun="sales entries"
      emptyHint="No mapped sales in this period. Try a wider date range or fewer filters."
      kpis={[
        { label: 'Total Revenue', value: formatINRShort(a.totalRevenue), icon: IndianRupee },
        { label: 'Total Quantity', value: formatQty(a.totalQty), icon: Package },
        { label: 'Avg Revenue/Dealer', value: formatINRShort(a.avgRevenuePerDealer), icon: Store, badge: `${formatCount(a.dealerCount)} dealers` },
        { label: 'Avg Revenue/Product', value: formatINRShort(a.avgRevenuePerProduct), icon: Receipt, badge: `${formatCount(a.productCount)} items` },
      ]}
    >
      <ChartCard icon={TrendingUp} title="Sales over time" sub="Revenue by month">
        <ColumnChart data={a.revenueByMonth} format={lakhs} />
      </ChartCard>
      <ChartCard icon={CalendarRange} title="Quantity over time" sub="Actual quantity by month">
        <ColumnChart data={a.qtyByMonth} format={formatQty} />
      </ChartCard>
      <ChartCard icon={Users} title="Top 10 dealers" sub={`Top 10 make up ${a.top10DealerShare.toFixed(1)}% of revenue`}>
        <BarList data={a.dealers} format={lakhs} />
      </ChartCard>
      <ChartCard icon={Package} title="Top 10 products" sub="By revenue">
        <BarList data={a.products} format={lakhs} />
      </ChartCard>
      <ChartCard icon={MapPin} title="Sales by region">
        <BarList data={a.regions} format={lakhs} />
      </ChartCard>
      <ChartCard icon={MapPin} title="Sales by state">
        <BarList data={a.states} format={lakhs} />
      </ChartCard>
      <ChartCard icon={MapPin} title="Sales by division">
        <BarList data={a.divisions} format={lakhs} />
      </ChartCard>
      <ChartCard icon={Package} title="Top stock groups" sub="By revenue">
        <BarList data={a.stockGroups} format={lakhs} />
      </ChartCard>
      <ChartCard icon={Undo2} title="Sales returns" sub="Credit notes by month">
        <ColumnChart data={a.returnsByMonth} format={lakhs} />
      </ChartCard>
    </AnalyticsFrame>
  );
}
