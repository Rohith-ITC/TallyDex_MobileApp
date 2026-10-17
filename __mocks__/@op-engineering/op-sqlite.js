// Jest stand-in for op-sqlite backed by Node's built-in SQLite, so tests run
// the app's real SQL (schema, swap, JSON functions) against a real engine.
const { DatabaseSync } = require('node:sqlite');

let current = null;

function makeDb() {
  const raw = new DatabaseSync(':memory:');
  const run = (sql, params = []) => {
    const rows = raw.prepare(sql).all(...params);
    return { rows, rowsAffected: 0 };
  };
  let chain = Promise.resolve();
  const db = {
    raw,
    execute: async (sql, params) => run(sql, params),
    executeSync: (sql, params) => run(sql, params),
    executeBatch: async (commands) => {
      for (const [sql, params] of commands) {
        if (Array.isArray(params) && Array.isArray(params[0])) params.forEach((p) => run(sql, p));
        else run(sql, params ?? []);
      }
      return { rowsAffected: 0 };
    },
    // Transactions are serialised, like the native queue.
    transaction: (fn) => {
      const next = chain.then(async () => {
        raw.exec('BEGIN');
        try {
          await fn({ execute: async (sql, params) => run(sql, params) });
          raw.exec('COMMIT');
        } catch (e) {
          raw.exec('ROLLBACK');
          throw e;
        }
      });
      chain = next.catch(() => {});
      return next;
    },
    close: () => raw.close(),
    delete: () => {},
  };
  return db;
}

module.exports = {
  open: () => {
    current = current ?? makeDb();
    return current;
  },
  /** Test helper: start the next open() with an empty database. */
  __reset: () => {
    current = null;
  },
  __current: () => current,
};
