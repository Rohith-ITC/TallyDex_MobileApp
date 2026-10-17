import type { ColType, TableDef } from './schema';

export type Scalar = string | number | null;

function coerce(v: unknown, type: ColType): Scalar {
  if (v === null || v === undefined || v === '') return null;
  if (type === 'TEXT') return typeof v === 'object' ? JSON.stringify(v) : String(v);
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return type === 'INTEGER' ? Math.trunc(n) : n;
}

export interface SplitRow {
  /** Values for the table's API columns, in `Object.keys(def.columns)` order. */
  values: Scalar[];
  /** Fields the schema has no column for, or null when there are none. */
  extra: Record<string, unknown> | null;
}

/**
 * Splits one API row into typed column values and the leftover fields that go
 * into json_data. Numbers that arrive as strings ("12.50") are stored as numbers.
 */
export function splitRow(def: Pick<TableDef, 'columns'>, row: Record<string, unknown>): SplitRow {
  const cols = def.columns;
  const values = Object.keys(cols).map((c) => coerce(row[c], cols[c]));
  let extra: Record<string, unknown> | null = null;
  for (const k of Object.keys(row)) {
    if (k in cols) continue;
    (extra ??= {})[k] = row[k];
  }
  return { values, extra };
}

/** Collects the extra keys seen during one download, for schema_extra_key. */
export class ExtraKeyLog {
  private seen = new Map<string, { table: string; key: string; example: string; count: number }>();

  add(table: string, extra: Record<string, unknown> | null) {
    if (!extra) return;
    for (const [key, v] of Object.entries(extra)) {
      const id = `${table}\u0000${key}`;
      const cur = this.seen.get(id);
      if (cur) {
        cur.count += 1;
        if (cur.example === 'null' && v !== null && v !== undefined) cur.example = JSON.stringify(v).slice(0, 200);
      } else {
        this.seen.set(id, { table, key, example: JSON.stringify(v ?? null).slice(0, 200), count: 1 });
      }
    }
  }

  entries() {
    return [...this.seen.values()];
  }
}
