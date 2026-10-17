/**
 * The local database: one table per API dataset. Each table lists the API
 * fields it keeps as typed columns; any other field in a response row goes into
 * that row's `json_data` (a JSON object) and is logged in `schema_extra_key`,
 * so it can be promoted to a real column later with a migration (see
 * MIGRATIONS below).
 *
 * Columns starting with `_` are the app's own (scope, keys, derived values),
 * never API fields.
 */

export type ColType = 'INTEGER' | 'REAL' | 'TEXT';

export interface TableDef {
  name: string;
  /** API fields stored as typed columns, in API naming. */
  columns: Record<string, ColType>;
  /** The app's own columns, before the API ones. */
  own: string[];
  primaryKey?: string[];
  indexes?: string[][];
}

const SALES_COLUMNS: Record<string, ColType> = {
  id: 'INTEGER',
  cotablid: 'INTEGER',
  guid: 'TEXT',
  company_name: 'TEXT',
  company_guid: 'TEXT',
  vchid: 'INTEGER',
  vchno: 'TEXT',
  vchdt: 'TEXT',
  vchtype: 'TEXT',
  vchtyperesname: 'TEXT',
  partyled: 'TEXT',
  partyledid: 'INTEGER',
  ledmstid: 'INTEGER',
  ledname: 'TEXT',
  itemid: 'INTEGER',
  itemname: 'TEXT',
  stockitem_name: 'TEXT',
  ho_itemcode: 'TEXT',
  ho_itemdesc: 'TEXT',
  ho_dealer_delcode: 'TEXT',
  ho_dealer_delname: 'TEXT',
  actlqty: 'REAL',
  bildqty: 'REAL',
  altactlqty: 'REAL',
  altbildqty: 'REAL',
  unitsybl: 'TEXT',
  rate: 'REAL',
  disc: 'REAL',
  amt: 'REAL',
};

const MAPPED_SALES_COLUMNS: Record<string, ColType> = {
  ...SALES_COLUMNS,
  stockitem_mstid: 'INTEGER',
  stockitem_alias: 'TEXT',
  stockitem_partno: 'TEXT',
  mapped_ho_stockitem_id: 'INTEGER',
  mapped_ho_itemcode: 'TEXT',
  mapped_ho_itemdesc: 'TEXT',
  mapped_packsize: 'REAL',
  ho_stockitem_id: 'INTEGER',
  ho_stockgroup: 'TEXT',
  ho_stockcategory: 'TEXT',
  mapped_ho_dealer_id: 'INTEGER',
  mapped_ho_delcode: 'TEXT',
  mapped_ho_delname: 'TEXT',
  ho_dealer_id: 'INTEGER',
  ho_dealer_state: 'TEXT',
  ho_dealer_region: 'TEXT',
  ho_dealer_division: 'TEXT',
};

const BUCKETS = ['yearob', 'monthob', 'yearin', 'monthin', 'yearout', 'monthout', 'cb'];
const CLOSING_COLUMNS: Record<string, ColType> = {
  received_on: 'TEXT',
  company_name: 'TEXT',
  dealer_code: 'TEXT',
  dealer_name: 'TEXT',
  dealer_state: 'TEXT',
  dealer_region: 'TEXT',
  dealer_division: 'TEXT',
  stock_item_name: 'TEXT',
  ho_item_code: 'TEXT',
  ho_item_description: 'TEXT',
  ho_item_group: 'TEXT',
  ho_item_category: 'TEXT',
  ...Object.fromEntries(BUCKETS.flatMap((b) => [[`${b}qty`, 'REAL'], [`${b}rate`, 'REAL'], [`${b}amt`, 'REAL']])),
};

export const TABLES = {
  dashboard: {
    name: 'dashboard_stats',
    own: ['_user_id', '_org_id', '_synced_at', 'json_data'],
    primaryKey: ['_user_id', '_org_id'],
    columns: {
      role: 'TEXT',
      totalUsers: 'INTEGER',
      newUsersLast30Days: 'INTEGER',
      totalOrganizations: 'INTEGER',
      newOrganizationsLast30Days: 'INTEGER',
      totalModules: 'INTEGER',
      activeTallyConnections: 'INTEGER',
      activeUsersLast24Hours: 'INTEGER',
      lastLoginAt: 'TEXT',
    },
  },
  /** Every list in /ssv-reports/filters/dropdowns, one row per option. */
  filterOption: {
    name: 'filter_option',
    own: ['_org_id', '_kind', 'json_data'],
    primaryKey: ['_org_id', '_kind', 'value'],
    columns: { value: 'TEXT', label: 'TEXT', code: 'TEXT' },
  },
  sales: {
    name: 'sales_entry',
    own: ['_org_id', '_date', 'json_data'],
    primaryKey: ['_org_id', 'id'],
    indexes: [['_org_id', '_date'], ['_org_id', 'cotablid']],
    columns: SALES_COLUMNS,
  },
  mappedSales: {
    name: 'mapped_sales_entry',
    own: ['_org_id', '_date', 'json_data'],
    primaryKey: ['_org_id', 'id'],
    indexes: [['_org_id', '_date'], ['_org_id', 'ho_dealer_id'], ['_org_id', 'ho_stockitem_id']],
    columns: MAPPED_SALES_COLUMNS,
  },
  closing: {
    name: 'closing_balance',
    own: ['_rid', '_org_id', 'json_data'],
    indexes: [['_org_id', 'company_name']],
    columns: CLOSING_COLUMNS,
  },
  mappedClosing: {
    name: 'mapped_closing_balance',
    own: ['_rid', '_org_id', 'json_data'],
    indexes: [['_org_id', 'dealer_code'], ['_org_id', 'ho_item_group']],
    columns: CLOSING_COLUMNS,
  },
} satisfies Record<string, TableDef>;

export type TableKey = keyof typeof TABLES;

/** Tables that are downloaded with staging copies and swapped in atomically. */
export const DATA_TABLES: TableKey[] = ['dashboard', 'filterOption', 'sales', 'mappedSales', 'closing', 'mappedClosing'];

const OWN_TYPES: Record<string, string> = {
  _rid: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  _org_id: 'INTEGER NOT NULL',
  _user_id: 'INTEGER NOT NULL',
  _kind: 'TEXT NOT NULL',
  _date: 'TEXT',
  _synced_at: 'TEXT',
  json_data: 'TEXT',
};

const q = (id: string) => `"${id}"`;

export function createTableSql(def: TableDef, name = def.name): string {
  const cols = [
    ...def.own.map((c) => `${q(c)} ${OWN_TYPES[c]}`),
    ...Object.entries(def.columns).map(([c, t]) => `${q(c)} ${t}`),
  ];
  if (def.primaryKey) cols.push(`PRIMARY KEY (${def.primaryKey.map(q).join(', ')})`);
  return `CREATE TABLE IF NOT EXISTS ${q(name)} (${cols.join(', ')})`;
}

export function createIndexSql(def: TableDef): string[] {
  return (def.indexes ?? []).map(
    (cols) => `CREATE INDEX IF NOT EXISTS ${q(`ix_${def.name}_${cols.join('_')}`)} ON ${q(def.name)} (${cols.map(q).join(', ')})`,
  );
}

export const stagingName = (def: TableDef) => `${def.name}__staging`;

/** Bookkeeping tables. */
export const META_SQL = [
  // One row per organization: the last download, its sales period and outcome.
  `CREATE TABLE IF NOT EXISTS "sync_run" (
     "_org_id" INTEGER PRIMARY KEY,
     "started_at" TEXT, "finished_at" TEXT, "status" TEXT, "error" TEXT,
     "sales_from" TEXT, "sales_to" TEXT, "trigger" TEXT)`,
  // Rows per dataset after the last successful download.
  `CREATE TABLE IF NOT EXISTS "sync_state" (
     "_org_id" INTEGER NOT NULL, "dataset" TEXT NOT NULL,
     "row_count" INTEGER, "synced_at" TEXT,
     PRIMARY KEY ("_org_id", "dataset"))`,
  // API fields the schema doesn't have a column for (they live in json_data).
  `CREATE TABLE IF NOT EXISTS "schema_extra_key" (
     "table_name" TEXT NOT NULL, "key" TEXT NOT NULL,
     "first_seen_at" TEXT, "last_seen_at" TEXT, "example" TEXT, "seen_count" INTEGER,
     PRIMARY KEY ("table_name", "key"))`,
];

/**
 * Versioned migrations, run in order on open (PRAGMA user_version). Version 1
 * is the tables above. To promote a field that has been arriving in json_data:
 * add it to the table's `columns` above AND append a migration here, e.g.
 *
 *   { version: 2, statements: promoteColumnSql('sales_entry', 'new_field', 'TEXT') },
 *
 * Existing rows get the value copied out of json_data; new downloads fill the
 * column directly.
 */
export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [];

export function promoteColumnSql(table: string, column: string, type: ColType): string[] {
  const path = `'$.' || '${column.replace(/'/g, "''")}'`;
  return [table, `${table}__staging`].flatMap((t) => [
    `ALTER TABLE ${q(t)} ADD COLUMN ${q(column)} ${type}`,
    `UPDATE ${q(t)} SET ${q(column)} = json_extract(json_data, ${path}),
       json_data = NULLIF(json_remove(json_data, ${path}), '{}')
     WHERE json_data IS NOT NULL AND json_type(json_data, ${path}) IS NOT NULL`,
  ]).concat([`DELETE FROM "schema_extra_key" WHERE table_name = '${table}' AND key = '${column.replace(/'/g, "''")}'`]);
}

export const SCHEMA_VERSION = Math.max(1, ...MIGRATIONS.map((m) => m.version));
