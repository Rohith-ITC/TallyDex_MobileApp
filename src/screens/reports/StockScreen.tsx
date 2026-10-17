import React, { useState } from 'react';
import { localData } from '../../db/localData';
import type { ClosingItem } from '../../api/types';
import { useSession } from '../../store/sessionStore';
import { useSync } from '../../store/syncStore';
import { dash, formatDate, formatINR, formatQty } from '../../utils/format';
import { DetailSheet, type DetailSection } from './DetailSheet';
import { FILTERS, nums, ReportFilters, strs, type FilterValues } from './Filters';
import { ReportList } from './ReportList';
import { ReportScaffold } from './ReportScaffold';
import { StockAnalytics } from './StockAnalytics';

const qtyAmt = (qty: unknown, amt: unknown) => `${formatQty(qty)} · ${formatINR(amt)}`;

/** Web columns (ClosingBalancePage) first, then the quantity/amount buckets. */
function closingDetail(it: ClosingItem): DetailSection[] {
  return [
    {
      title: 'Dealer',
      rows: [
        ['Received On', formatDate(it.received_on)],
        ['Company Name', dash(it.company_name)],
        ['Dealer Code', dash(it.dealer_code)],
        ['Dealer Name', dash(it.dealer_name)],
        ['State', dash(it.dealer_state)],
        ['Region', dash(it.dealer_region)],
        ['Division', dash(it.dealer_division)],
      ],
    },
    {
      title: 'Item',
      rows: [
        ['Stock Item Name', dash(it.stock_item_name)],
        ['HO Item Code', dash(it.ho_item_code)],
        ['HO Item Description', dash(it.ho_item_description)],
        ['Stock Group', dash(it.ho_item_group)],
        ['Stock Category', dash(it.ho_item_category)],
      ],
    },
    {
      title: 'Quantity · Amount',
      rows: [
        ['Opening (year)', qtyAmt(it.yearobqty, it.yearobamt)],
        ['Opening (month)', qtyAmt(it.monthobqty, it.monthobamt)],
        ['Inward (year)', qtyAmt(it.yearinqty, it.yearinamt)],
        ['Inward (month)', qtyAmt(it.monthinqty, it.monthinamt)],
        ['Outward (year)', qtyAmt(it.yearoutqty, it.yearoutamt)],
        ['Outward (month)', qtyAmt(it.monthoutqty, it.monthoutamt)],
        ['Closing rate', formatINR(it.cbrate)],
        ['Closing', qtyAmt(it.cbqty, it.cbamt)],
      ],
    },
  ];
}

function StockList({ mapped }: { mapped: boolean }) {
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const version = useSync((s) => s.version);
  const [filters, setFilters] = useState<FilterValues>({});
  const [open, setOpen] = useState<ClosingItem | null>(null);
  const defs = mapped
    ? [FILTERS.dealer, FILTERS.stockGroup, FILTERS.category, FILTERS.state, FILTERS.region, FILTERS.division]
    : [FILTERS.company];

  return (
    <>
      <ReportList<ClosingItem>
        queryKey={['local', 'stock', mapped ? 'mapped' : 'all', orgId, filters, version]}
        fetchPage={(page, limit) =>
          localData.closingPage(
            orgId,
            mapped,
            {
              companyIds: nums(filters, 'company'),
              dealerIds: nums(filters, 'dealer'),
              stockGroups: strs(filters, 'stockGroup'),
              categories: strs(filters, 'category'),
              states: strs(filters, 'state'),
              regions: strs(filters, 'region'),
              divisions: strs(filters, 'division'),
            },
            page,
            limit,
          )
        }
        toRow={(it) => ({
          title: it.ho_item_description || it.stock_item_name || '—',
          subtitle: `${dash(it.dealer_name)}${it.dealer_code ? ` · ${it.dealer_code}` : ''}`,
          meta: it.received_on ? `Received ${formatDate(it.received_on)}` : dash(it.company_name),
          value: formatINR(it.cbamt),
          valueSub: `Qty ${formatQty(it.cbqty)}`,
        })}
        onRowPress={setOpen}
        noun="stock positions"
        header={<ReportFilters defs={defs} values={filters} onChange={setFilters} />}
        emptyTitle="No closing stock found"
        emptyHint={mapped ? 'Only items mapped to HO stock items appear here. Try fewer filters.' : 'Try another company.'}
      />
      <DetailSheet
        visible={!!open}
        title={open ? open.ho_item_description || open.stock_item_name : ''}
        subtitle={open ? `${dash(open.dealer_name)} · Closing ${formatINR(open.cbamt)}` : undefined}
        sections={open ? closingDetail(open) : []}
        onClose={() => setOpen(null)}
      />
    </>
  );
}

export function StockScreen() {
  return (
    <ReportScaffold
      family="stock"
      render={(view) => (view === 'analytics' ? <StockAnalytics /> : <StockList mapped={view === 'mapped'} />)}
    />
  );
}
