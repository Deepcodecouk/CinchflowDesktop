import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbCashflowComment } from '../../shared/types';

export const cashflowCommentRepository = {
  findByAccountAndYearMonth(accountId: string, year: number, month: number): DbCashflowComment[] {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM cashflow_comments WHERE account_id = ? AND year = ? AND month = ?',
    ).all(accountId, year, month) as DbCashflowComment[];
  },

  findByAccountAndYear(accountId: string, year: number): DbCashflowComment[] {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM cashflow_comments WHERE account_id = ? AND year = ?',
    ).all(accountId, year) as DbCashflowComment[];
  },

  upsert(accountId: string, categoryId: string | null, year: number, month: number, comment: string): DbCashflowComment {
    const db = getDb();
    const now = Date.now();

    const existing = db.prepare(
      'SELECT id FROM cashflow_comments WHERE account_id = ? AND category_id IS ? AND year = ? AND month = ?',
    ).get(accountId, categoryId, year, month) as { id: string } | undefined;

    if (existing) {
      db.prepare('UPDATE cashflow_comments SET comment = ?, updated_at = ? WHERE id = ?')
        .run(comment, now, existing.id);
      return db.prepare('SELECT * FROM cashflow_comments WHERE id = ?').get(existing.id) as DbCashflowComment;
    }

    const id = generateId();
    db.prepare(
      'INSERT INTO cashflow_comments (id, account_id, category_id, year, month, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, accountId, categoryId, year, month, comment, now, now);
    return db.prepare('SELECT * FROM cashflow_comments WHERE id = ?').get(id) as DbCashflowComment;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM cashflow_comments WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
