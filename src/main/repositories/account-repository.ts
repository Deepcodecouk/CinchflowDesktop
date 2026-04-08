import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbAccount } from '../../shared/types';

export const accountRepository = {
  findAll(): DbAccount[] {
    const db = getDb();
    return db.prepare('SELECT * FROM accounts ORDER BY name ASC').all() as DbAccount[];
  },

  findById(id: string): DbAccount | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as DbAccount | undefined;
  },

  create(data: { name: string; icon: string; type: string }): DbAccount {
    const db = getDb();
    const id = generateId();
    const now = Date.now();
    db.prepare(
      'INSERT INTO accounts (id, name, icon, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.name, data.icon, data.type, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: { name?: string; icon?: string; type?: string }): DbAccount {
    const db = getDb();
    const now = Date.now();
    const existing = this.findById(id);
    if (!existing) throw new Error(`Account not found: ${id}`);

    db.prepare(
      'UPDATE accounts SET name = ?, icon = ?, type = ?, updated_at = ? WHERE id = ?'
    ).run(
      data.name ?? existing.name,
      data.icon ?? existing.icon,
      data.type ?? existing.type,
      now,
      id,
    );
    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getOpeningBalanceAmount(accountId: string): number {
    const db = getDb();
    const row = db.prepare(
      'SELECT delta_value FROM transactions WHERE account_id = ? AND is_opening_balance = 1'
    ).get(accountId) as { delta_value: number } | undefined;
    return row?.delta_value ?? 0;
  },

  setOpeningBalance(accountId: string, amount: number): void {
    const db = getDb();
    const now = Date.now();
    const existing = db.prepare(
      'SELECT id FROM transactions WHERE account_id = ? AND is_opening_balance = 1'
    ).get(accountId) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        'UPDATE transactions SET delta_value = ?, updated_at = ? WHERE id = ?'
      ).run(amount, now, existing.id);
    } else {
      const id = generateId();
      // Opening balance uses OPENING_BALANCE_EPOCH (-2208988800) as date
      db.prepare(
        `INSERT INTO transactions (id, account_id, category_id, date, description, delta_value, is_opening_balance, is_flagged, created_at, updated_at)
         VALUES (?, ?, NULL, -2208988800, 'Opening Balance', ?, 1, 0, ?, ?)`
      ).run(id, accountId, amount, now, now);
    }
  },
};
