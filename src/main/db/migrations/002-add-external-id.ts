import type { Migration } from '../migrations';

const migration: Migration = {
  id: 2,
  name: 'Add external_id column for import deduplication',
  up(db) {
    db.exec(`
      ALTER TABLE transactions ADD COLUMN external_id TEXT;
      CREATE INDEX idx_transactions_external_id ON transactions(account_id, external_id);
    `);
  },
};

export default migration;
