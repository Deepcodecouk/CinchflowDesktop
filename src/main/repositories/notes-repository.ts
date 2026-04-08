import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbNote } from '../../shared/types';

export const notesRepository = {
  findAll(): DbNote[] {
    const db = getDb();
    return db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as DbNote[];
  },

  findById(id: string): DbNote | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as DbNote | undefined;
  },

  create(data: { title: string; content: string }): DbNote {
    const db = getDb();
    const id = generateId();
    const now = Date.now();
    db.prepare('INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, data.title, data.content, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: { title?: string; content?: string }): DbNote {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) throw new Error(`Note not found: ${id}`);

    const now = Date.now();
    db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?')
      .run(data.title ?? existing.title, data.content ?? existing.content, now, id);
    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
