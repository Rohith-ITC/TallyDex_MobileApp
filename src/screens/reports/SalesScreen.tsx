import React, { useState } from 'react';
import type { SalesItem } from '../../api/types';
import type { DateRange } from '../../components/DateRangeSheet';
import { localData } from '../../db/localData';
import { useSession } from '../../store/sessionStore';
import { useSync } from '../../store/syncStore';
import { apiDate, dash, formatDate, formatINR, formatQty, toNum } from '../../utils/format';
import { DetailSheet, type DetailSection } from './DetailSheet';
import { FILTERS, nums, ReportFilters, strs, type FilterValues } from './Filters';
import { ReportList } from './ReportList';
import { ReportScaffold } from './ReportScaffold';
import { OutsideWindowNote, thisMonth, useSalesWindow } from './salesWindow';
import { SalesAnalytics } from './SalesAnalytics';

/** Same columns as the web tables (SalesReportPage / MappedSalesPage), in order. */
function salesDetail(it: SalesItem, mapped: boolean): DetailSection[] {
  const dealer: Array<[string, string]> = [
    ['Company Name', dash(it.company_name)],
    ['Dealer Code', dash(it.ho_dealer_delcode)],
    ['Dealer Name', dash(it.ho_dealer_delname)],
  ];
  if (mapped) {
    dealer.push(['Dealer State', dash(it.ho_dealer_state)], ['Dealer Region', dash(it.ho_dealer_region)], ['Dealer Division', dash(it.ho_dealer_division)]);
  }
  const item: Array<[string, string]> = mapped
    ? [
        ['HO Item Code', dash(it.ho_itemcode)],
        ['HO Item Description', dash(it.ho_itemdesc)],
        ['HO Stock Group', dash(it.ho_stockgroup)],
        ['HO Stock Category', dash(it.ho_stockcategory)],
      ]
    : [
        ['Stock Item Name', dash(it.stockitem_name || it.itemname)],
        ['HO Item Code', dash(it.ho_itemcode)],
        ['HO Item Description', dash(it.ho_itemdesc)],
      ];
  return [
    { title: 'Dealer', rows: dealer },
    {
      title: 'Voucher',
      rows: [
        ['Voucher No', dash(it.vchno)],
        ['Date', formatDate(it.vchdt)],
        ['Voucher Type', dash(it.vchtype)],
        ['Party Ledger', dash(it.partyled)],
      ],
    },
    { title: 'Item', rows: item },
    {
      title: 'Amounts',
      rows: [
        ['Actual Qty', formatQty(it.actlqty)],
        ['Billed Qty', formatQty(it.bildqty)],
        ['Unit', dash(it.unitsybl)],
        ['Rate', formatINR(it.rate)],
        ['Discount', formatINR(it.disc)],
        ['Amount', formatINR(it.amt)],
      ],
    },
  ];
}

function SalesList({ mapped }: { mapped: boolean }) {
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const version = useSync((s) => s.version);
  const downloaded = useSalesWindow();
  const [range, setRange] = useState<DateRange>(() => downloaded ?? thisMonth());
  const [filters, setFilters] = useState<FilterValues>({});
  const [open, setOpen] = useState<SalesItem | null>(null);

  const dateFrom = apiDate(range.from);
  const dateTo = apiDate(range.to);
  const defs = mapped ? [FILTERS.dealer, FILTERS.hoItem, FILTERS.region, FILTERS.division] : [FILTERS.company];

  return (
    <>
      <ReportList<SalesItem>
        queryKey={['local', 'sales', mapped ? 'mapped' : 'all', orgId, dateFrom, dateTo, filters, version]}
        fetchPage={(page, limit) =>
          localData.salesPage(
            orgId,
            mapped,
            {
              dateFrom,
              dateTo,
              companyIds: nums(filters, 'company'),
              dealerIds: nums(filters, 'dealer'),
              hoItemIds: nums(filters, 'hoItem'),
              regions: strs(filters, 'region'),
              divisions: strs(filters, 'division'),
            },
            page,
            limit,
          )
        }
        toRow={(it) => ({
          title: (mapped ? it.ho_dealer_delname : it.partyled) || it.partyled || '—',
          subtitle: mapped ? dash(it.ho_itemdesc) : dash(it.stockitem_name || it.itemname),
          meta: `${it.vchno} · ${formatDate(it.vchdt)} · ${it.vchtype}`,
          value: formatINR(it.amt),
          valueSub: `${formatQty(it.bildqty)} ${it.unitsybl ?? ''}`.trim(),
        })}
        onRowPress={setOpen}
        noun="entries"
        header={
          <>
            <ReportFilters defs={defs} values={filters} onChange={setFilters} range={range} onRangeChange={setRange} />
            <OutsideWindowNote range={range} downloaded={downloaded} />
          </>
        }
        emptyTitle="No sales in this period"
        emptyHint={mapped ? 'Only vouchers whose dealer and items are mapped appear here. Try a wider date range or fewer filters.' : 'Try a wider date range or another company.'}
      />
      <DetailSheet
        visible={!!open}
        title={open ? `${open.vchtype} ${open.vchno}` : ''}
        subtitle={open ? `${formatDate(open.vchdt)} · ${formatINR(toNum(open.amt))}` : undefined}
        sections={open ? salesDetail(open, mapped) : []}
        onClose={() => setOpen(null)}
      />
    </>
  );
}

export function SalesScreen() {
  return (
    <ReportScaffold
      family="sales"
      render={(view) => (view === 'analytics' ? <SalesAnalytics /> : <SalesList mapped={view === 'mapped'} />)}
    />
  );
}

