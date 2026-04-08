import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbCategory } from '../../shared/types';

export const categoryRepository = {
  findById(id: string): DbCategory | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as DbCategory | undefined;
  },

  create(data: { name: string; category_header_id: string }): DbCategory {
    const db = getDb();
    const id = generateId();
    const now = Date.now();
    db.prepare(
      'INSERT INTO categories (id, category_header_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, data.category_header_id, data.name, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: { name?: string; category_header_id?: string }): DbCategory {
    const db = getDb();
    const now = Date.now();
    const existing = this.findById(id);
    if (!existing) throw new Error(`Category not found: ${id}`);

    db.prepare(
      'UPDATE categories SET name = ?, category_header_id = ?, updated_at = ? WHERE id = ?'
    ).run(
      data.name ?? existing.name,
      data.category_header_id ?? existing.category_header_id,
      now,
      id,
    );
    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
