import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbImport } from '../../shared/types';

export const importRepository = {
  createImport(accountId: string): DbImport {
    const db = getDb();
    const id = generateId();
    const now = Date.now();
    db.prepare('INSERT INTO imports (id, account_id, created_at) VALUES (?, ?, ?)').run(id, accountId, now);
    return { id, account_id: accountId, created_at: now };
  },

  getHistory(accountId: string): Array<DbImport & { transaction_count: number }> {
    const db = getDb();
    return db.prepare(`
      SELECT i.*, COUNT(t.id) as transaction_count
      FROM imports i
      LEFT JOIN transactions t ON t.import_id = i.id
      WHERE i.account_id = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all(accountId) as Array<DbImport & { transaction_count: number }>;
  },

  rollback(importId: string): number {
    const db = getDb();
    const result = db.prepare('DELETE FROM transactions WHERE import_id = ?').run(importId);
    db.prepare('DELETE FROM imports WHERE id = ?').run(importId);
    return result.changes;
  },
};
