import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, SlidersHorizontal, X } from 'lucide-react-native';
import { localData } from '../../db/localData';
import type { FilterDropdowns } from '../../api/types';
import { Chip, FilterBar } from '../../components/Chips';
import { DateRangeSheet, rangeLabel, type DateRange } from '../../components/DateRangeSheet';
import { SelectSheet, type SelectOption } from '../../components/SelectSheet';
import { useSession } from '../../store/sessionStore';
import { useSync } from '../../store/syncStore';

export type FilterValues = Record<string, Array<string | number>>;

export interface FilterDef {
  key: string;
  label: string;
  options: (d: FilterDropdowns) => SelectOption<string | number>[];
}

const strings = (xs: string[] | undefined) => (xs ?? []).filter(Boolean).map((s) => ({ value: s, label: s }));

/** Filter fields per report, built from GET /ssv-reports/filters/dropdowns. */
export const FILTERS = {
  company: { key: 'company', label: 'Company', options: (d) => d.companies.map((c) => ({ value: c.id, label: c.name })) },
  dealer: {
    key: 'dealer',
    label: 'Dealer',
    options: (d) => d.dealers.map((x) => ({ value: x.id, label: x.delname, sub: x.delcode })),
  },
  hoItem: {
    key: 'hoItem',
    label: 'HO Item',
    options: (d) => d.hoStockitems.map((x) => ({ value: x.id, label: x.itemdesc, sub: x.itemcode })),
  },
  stockGroup: { key: 'stockGroup', label: 'Stock Group', options: (d) => strings(d.stockgroups) },
  category: { key: 'category', label: 'Category', options: (d) => strings(d.stockcategories) },
  state: { key: 'state', label: 'State', options: (d) => strings(d.states) },
  region: { key: 'region', label: 'Region', options: (d) => strings(d.regions) },
  division: { key: 'division', label: 'Division', options: (d) => strings(d.divisions) },
} satisfies Record<string, FilterDef>;

/** Picker options from the downloaded /filters/dropdowns copy. */
export function useFilterOptions() {
  const orgId = useSession((s) => s.selectedOrg?.id ?? 0);
  const version = useSync((s) => s.version);
  return useQuery({ queryKey: ['local', 'filters', orgId, version], queryFn: () => localData.filters(orgId) });
}

export const nums = (v: FilterValues, k: string) => (v[k] ?? []) as number[];
export const strs = (v: FilterValues, k: string) => (v[k] ?? []) as string[];

/**
 * Chips under the header (rule R13): date range first when the report has
 * one, then one chip per filter with its count, then Clear.
 */
export function ReportFilters({
  defs,
  values,
  onChange,
  range,
  onRangeChange,
}: {
  defs: FilterDef[];
  values: FilterValues;
  onChange: (v: FilterValues) => void;
  range?: DateRange;
  onRangeChange?: (r: DateRange) => void;
}) {
  const options = useFilterOptions();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const open = defs.find((d) => d.key === openKey);
  const anyActive = defs.some((d) => (values[d.key] ?? []).length > 0);

  return (
    <>
      <FilterBar>
        {range && onRangeChange ? (
          <Chip testID="filter-date" icon={Calendar} label={rangeLabel(range)} active onPress={() => setDateOpen(true)} />
        ) : null}
        {defs.map((d) => {
          const count = (values[d.key] ?? []).length;
          return (
            <Chip
              key={d.key}
              testID={`filter-${d.key}`}
              icon={d === defs[0] && !range ? SlidersHorizontal : undefined}
              label={d.label}
              count={count || undefined}
              active={count > 0}
              onPress={() => setOpenKey(d.key)}
            />
          );
        })}
        {anyActive ? <Chip testID="filter-clear" icon={X} label="Clear" onPress={() => onChange({})} /> : null}
      </FilterBar>

      {range && onRangeChange ? (
        <DateRangeSheet visible={dateOpen} value={range} onApply={onRangeChange} onClose={() => setDateOpen(false)} />
      ) : null}

      <SelectSheet
        visible={!!open}
        title={open?.label ?? ''}
        options={open && options.data ? open.options(options.data) : []}
        selected={open ? values[open.key] ?? [] : []}
        emptyText={options.isLoading ? 'Loading options…' : options.isError ? "Couldn't load options. Close and try again." : 'No options available'}
        onClose={() => setOpenKey(null)}
        onApply={(vals) => open && onChange({ ...values, [open.key]: vals })}
      />
    </>
  );
}
