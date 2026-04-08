import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import { NotFoundError } from '../errors';
import type { DbTransaction, TransactionSearchParams, TransactionWithCategory } from '../../shared/types';

export const transactionRepository = {
  findByMonth(accountId: string, year: number, month: number): TransactionWithCategory[] {
    const db = getDb();
    const startDate = new Date(Date.UTC(year, month - 1, 1)).getTime() / 1000;
    const endDate = new Date(Date.UTC(year, month, 1)).getTime() / 1000;

    return db.prepare(`
      SELECT t.*,
        c.name as category_name,
        ch.type as category_type,
        ch.colour as category_colour
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN category_headers ch ON c.category_header_id = ch.id
      WHERE t.account_id = ?
        AND t.is_opening_balance = 0
        AND t.date >= ? AND t.date < ?
      ORDER BY t.date DESC, t.created_at DESC
    `).all(accountId, startDate, endDate) as TransactionWithCategory[];
  },

  getOpeningBalanceForMonth(accountId: string, year: number, month: number): number {
    const db = getDb();
    const startDate = new Date(Date.UTC(year, month - 1, 1)).getTime() / 1000;

    const result = db.prepare(`
      SELECT COALESCE(SUM(delta_value), 0) as total
      FROM transactions
      WHERE account_id = ? AND date < ?
    `).get(accountId, startDate) as { total: number };

    return result.total;
  },

  findById(id: string): DbTransaction | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as DbTransaction | undefined;
  },

  create(data: {
    account_id: string;
    date: number;
    description: string;
    category_id: string | null;
    delta_value: number;
  }): DbTransaction {
    const db = getDb();
    const id = generateId();
    const now = Date.now();

    db.prepare(`
      INSERT INTO transactions (id, account_id, category_id, date, description, delta_value,
        is_opening_balance, is_flagged, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(id, data.account_id, data.category_id, data.date, data.description, data.delta_value, now, now);

    return this.findById(id)!;
  },

  update(id: string, data: {
    date: number;
    description: string;
    category_id: string | null;
    delta_value: number;
  }): DbTransaction {
    const db = getDb();
    const now = Date.now();
    const existing = this.findById(id);

    if (!existing) {
      throw new NotFoundError(`Transaction not found: ${id}`);
    }

    const clearRule = data.category_id !== existing.category_id && existing.categorised_by_rule_id;

    db.prepare(`
      UPDATE transactions SET date = ?, description = ?, category_id = ?, delta_value = ?,
        categorised_by_rule_id = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.date,
      data.description,
      data.category_id,
      data.delta_value,
      clearRule ? null : existing.categorised_by_rule_id,
      now,
      id,
    );

    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const transaction = this.findById(id);

    if (transaction?.is_opening_balance) {
      return false;
    }

    const result = db.prepare('DELETE FROM transactions WHERE id = ? AND is_opening_balance = 0').run(id);
    return result.changes > 0;
  },

  updateNote(id: string, note: string | null): DbTransaction {
    const db = getDb();
    const now = Date.now();

    db.prepare('UPDATE transactions SET user_note = ?, updated_at = ? WHERE id = ?').run(note, now, id);
    return this.findById(id)!;
  },

  toggleFlag(id: string): DbTransaction {
    const db = getDb();
    const now = Date.now();

    db.prepare(
      'UPDATE transactions SET is_flagged = CASE WHEN is_flagged = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
    ).run(now, id);

    return this.findById(id)!;
  },

  search(params: TransactionSearchParams): TransactionWithCategory[] {
    const db = getDb();
    const conditions: string[] = ['t.is_opening_balance = 0'];
    const values: unknown[] = [];

    if (params.accountId) {
      conditions.push('t.account_id = ?');
      values.push(params.accountId);
    }

    if (params.query) {
      conditions.push('(t.description LIKE ? OR t.user_note LIKE ?)');
      const like = `%${params.query}%`;
      values.push(like, like);
    }

    if (params.dateFrom !== undefined) {
      conditions.push('t.date >= ?');
      values.push(params.dateFrom);
    }

    if (params.dateTo !== undefined) {
      conditions.push('t.date < ?');
      values.push(params.dateTo);
    }

    if (params.minAmount !== undefined) {
      conditions.push('ABS(t.delta_value) >= ?');
      values.push(params.minAmount);
    }

    if (params.maxAmount !== undefined) {
      conditions.push('ABS(t.delta_value) <= ?');
      values.push(params.maxAmount);
    }

    if (params.flagged !== undefined) {
      conditions.push('t.is_flagged = ?');
      values.push(params.flagged ? 1 : 0);
    }

    if (params.categoryId !== undefined) {
      if (params.categoryId === null) {
        conditions.push('t.category_id IS NULL');
      } else {
        conditions.push('t.category_id = ?');
        values.push(params.categoryId);
      }
    }

    return db.prepare(`
      SELECT t.*, c.name as category_name, ch.type as category_type, ch.colour as category_colour
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN category_headers ch ON ch.id = c.category_header_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.date DESC
      LIMIT 200
    `).all(...values) as TransactionWithCategory[];
  },
};
