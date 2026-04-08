import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbCategorisationRule, CreateCategorisationRuleData, UpdateCategorisationRuleData } from '../../shared/types';

export const categorisationRuleRepository = {
  findByAccount(accountId: string): DbCategorisationRule[] {
    const db = getDb();
    return db.prepare('SELECT * FROM categorisation_rules WHERE account_id = ? ORDER BY match_text ASC')
      .all(accountId) as DbCategorisationRule[];
  },

  findById(id: string): DbCategorisationRule | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM categorisation_rules WHERE id = ?').get(id) as DbCategorisationRule | undefined;
  },

  create(accountId: string, data: CreateCategorisationRuleData): DbCategorisationRule {
    const db = getDb();
    const id = generateId();
    const now = Date.now();
    db.prepare(`
      INSERT INTO categorisation_rules (id, account_id, category_id, match_text, match_type, min_amount, max_amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, accountId, data.category_id, data.match_text, data.match_type, data.min_amount, data.max_amount, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: UpdateCategorisationRuleData): DbCategorisationRule {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) throw new Error(`Rule not found: ${id}`);

    const now = Date.now();
    db.prepare(`
      UPDATE categorisation_rules SET
        category_id = ?, match_text = ?, match_type = ?,
        min_amount = ?, max_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.category_id ?? existing.category_id,
      data.match_text ?? existing.match_text,
      data.match_type ?? existing.match_type,
      data.min_amount !== undefined ? data.min_amount : existing.min_amount,
      data.max_amount !== undefined ? data.max_amount : existing.max_amount,
      now,
      id,
    );
    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM categorisation_rules WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
