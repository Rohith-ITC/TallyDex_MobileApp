import { open, type DB } from '@op-engineering/op-sqlite';
import { log } from '../utils/log';
import {
  createIndexSql,
  createTableSql,
  DATA_TABLES,
  META_SQL,
  MIGRATIONS,
  SCHEMA_VERSION,
  stagingName,
  TABLES,
  type TableDef,
} from './schema';
import type { Scalar } from './rows';

const DB_NAME = 'tallydex.db';

let db: DB | null = null;
let ready: Promise<DB> | null = null;

async function init(): Promise<DB> {
  const d = open({ name: DB_NAME });
  await d.execute('PRAGMA journal_mode = WAL');
  const current = Number((await d.execute('PRAGMA user_version')).rows[0]?.user_version ?? 0);

  await d.transaction(async (tx) => {
    for (const sql of META_SQL) await tx.execute(sql);
    for (const key of DATA_TABLES) {
      const def: TableDef = TABLES[key];
      await tx.execute(createTableSql(def));
      await tx.execute(createTableSql(def, stagingName(def)));
      for (const ix of createIndexSql(def)) await tx.execute(ix);
    }
    // A fresh install was just created with every column, so migrations only
    // run on a database that already existed at an older version.
    if (current > 0) {
      for (const m of MIGRATIONS.filter((x) => x.version > current).sort((a, b) => a.version - b.version)) {
        for (const sql of m.statements) await tx.execute(sql);
      }
    }
  });
  if (current !== SCHEMA_VERSION) await d.execute(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  db = d;
  return d;
}

/** The opened, migrated database (opened once, on first use). */
export function getDb(): Promise<DB> {
  if (db) return Promise.resolve(db);
  ready ??= init().catch((e) => {
    ready = null;
    log.error('database open failed', e);
    throw e;
  });
  return ready;
}

export async function query<T = Record<string, Scalar>>(sql: string, params: Scalar[] = []): Promise<T[]> {
  const d = await getDb();
  return (await d.execute(sql, params)).rows as unknown as T[];
}

export async function queryOne<T = Record<string, Scalar>>(sql: string, params: Scalar[] = []): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}

/** Removes every downloaded row (logout). The schema stays. */
export async function wipeAllData(): Promise<void> {
  const d = await getDb();
  await d.transaction(async (tx) => {
    for (const key of DATA_TABLES) {
      const def: TableDef = TABLES[key];
      await tx.execute(`DELETE FROM "${def.name}"`);
      await tx.execute(`DELETE FROM "${stagingName(def)}"`);
    }
    await tx.execute('DELETE FROM "sync_run"');
    await tx.execute('DELETE FROM "sync_state"');
    // Examples in the new-field log can be company data too.
    await tx.execute('DELETE FROM "schema_extra_key"');
  });
}
