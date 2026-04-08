import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbCategoryLink } from '../../shared/types';

export interface CategoryLinkWithNames extends DbCategoryLink {
  source_account_name: string;
  source_category_name: string;
  target_account_name: string;
  target_category_name: string;
}

export const categoryLinkRepository = {
  findAll(): CategoryLinkWithNames[] {
    const db = getDb();

    return db.prepare(`
      SELECT cl.*,
        sa.name as source_account_name,
        sc.name as source_category_name,
        ta.name as target_account_name,
        tc.name as target_category_name
      FROM category_links cl
      JOIN accounts sa ON sa.id = cl.source_account_id
      JOIN categories sc ON sc.id = cl.source_category_id
      JOIN accounts ta ON ta.id = cl.target_account_id
      JOIN categories tc ON tc.id = cl.target_category_id
      ORDER BY cl.created_at DESC
    `).all() as CategoryLinkWithNames[];
  },

  findByAccountId(accountId: string): CategoryLinkWithNames[] {
    const db = getDb();

    return db.prepare(`
      SELECT cl.*,
        sa.name as source_account_name,
        sc.name as source_category_name,
        ta.name as target_account_name,
        tc.name as target_category_name
      FROM category_links cl
      JOIN accounts sa ON sa.id = cl.source_account_id
      JOIN categories sc ON sc.id = cl.source_category_id
      JOIN accounts ta ON ta.id = cl.target_account_id
      JOIN categories tc ON tc.id = cl.target_category_id
      WHERE cl.source_account_id = ? OR cl.target_account_id = ?
      ORDER BY cl.created_at DESC
    `).all(accountId, accountId) as CategoryLinkWithNames[];
  },

  findByCategoryId(categoryId: string): CategoryLinkWithNames[] {
    const db = getDb();

    return db.prepare(`
      SELECT cl.*,
        sa.name as source_account_name,
        sc.name as source_category_name,
        ta.name as target_account_name,
        tc.name as target_category_name
      FROM category_links cl
      JOIN accounts sa ON sa.id = cl.source_account_id
      JOIN categories sc ON sc.id = cl.source_category_id
      JOIN accounts ta ON ta.id = cl.target_account_id
      JOIN categories tc ON tc.id = cl.target_category_id
      WHERE cl.source_category_id = ? OR cl.target_category_id = ?
      ORDER BY cl.created_at DESC
    `).all(categoryId, categoryId) as CategoryLinkWithNames[];
  },

  findLinkedCategory(accountId: string, categoryId: string): { linkedAccountId: string; linkedCategoryId: string } | null {
    const db = getDb();
    const asSource = db.prepare(
      'SELECT target_account_id, target_category_id FROM category_links WHERE source_account_id = ? AND source_category_id = ?',
    ).get(accountId, categoryId) as { target_account_id: string; target_category_id: string } | undefined;

    if (asSource) {
      return { linkedAccountId: asSource.target_account_id, linkedCategoryId: asSource.target_category_id };
    }

    const asTarget = db.prepare(
      'SELECT source_account_id, source_category_id FROM category_links WHERE target_account_id = ? AND target_category_id = ?',
    ).get(accountId, categoryId) as { source_account_id: string; source_category_id: string } | undefined;

    if (asTarget) {
      return { linkedAccountId: asTarget.source_account_id, linkedCategoryId: asTarget.source_category_id };
    }

    return null;
  },

  create(data: {
    source_account_id: string;
    source_category_id: string;
    target_account_id: string;
    target_category_id: string;
  }): DbCategoryLink {
    const db = getDb();
    const id = generateId();
    const now = Date.now();

    db.prepare(
      'INSERT INTO category_links (id, source_account_id, source_category_id, target_account_id, target_category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, data.source_account_id, data.source_category_id, data.target_account_id, data.target_category_id, now, now);

    return db.prepare('SELECT * FROM category_links WHERE id = ?').get(id) as DbCategoryLink;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM category_links WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
