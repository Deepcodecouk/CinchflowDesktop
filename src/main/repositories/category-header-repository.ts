import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbCategoryHeader, CategoryHierarchy, DbCategory } from '../../shared/types';

export const categoryHeaderRepository = {
  findByAccount(accountId: string): DbCategoryHeader[] {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM category_headers WHERE account_id = ? ORDER BY name ASC'
    ).all(accountId) as DbCategoryHeader[];
  },

  findById(id: string): DbCategoryHeader | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM category_headers WHERE id = ?').get(id) as DbCategoryHeader | undefined;
  },

  findHierarchical(accountId: string): CategoryHierarchy[] {
    const db = getDb();
    const headers = db.prepare(
      'SELECT * FROM category_headers WHERE account_id = ? ORDER BY name ASC'
    ).all(accountId) as DbCategoryHeader[];

    const categories = db.prepare(
      `SELECT c.* FROM categories c
       JOIN category_headers ch ON c.category_header_id = ch.id
       WHERE ch.account_id = ?
       ORDER BY c.name ASC`
    ).all(accountId) as DbCategory[];

    return headers.map((header) => ({
      header,
      categories: categories.filter((c) => c.category_header_id === header.id),
    }));
  },

  create(data: { name: string; type: string; colour: string; account_id: string }): DbCategoryHeader {
    const db = getDb();
    const id = generateId();
    const now = Date.now();
    db.prepare(
      'INSERT INTO category_headers (id, account_id, name, type, colour, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.account_id, data.name, data.type, data.colour, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: { name?: string; type?: string; colour?: string }): DbCategoryHeader {
    const db = getDb();
    const now = Date.now();
    const existing = this.findById(id);
    if (!existing) throw new Error(`Category header not found: ${id}`);

    db.prepare(
      'UPDATE category_headers SET name = ?, type = ?, colour = ?, updated_at = ? WHERE id = ?'
    ).run(
      data.name ?? existing.name,
      data.type ?? existing.type,
      data.colour ?? existing.colour,
      now,
      id,
    );
    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM category_headers WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
