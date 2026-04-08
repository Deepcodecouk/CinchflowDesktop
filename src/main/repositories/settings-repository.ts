import { getDb } from '../db/connection';
import type { DbSetting } from '../../shared/types';

export const settingsRepository = {
  findAll(): DbSetting[] {
    const db = getDb();
    return db.prepare('SELECT * FROM settings ORDER BY key ASC').all() as DbSetting[];
  },

  findByKey(key: string): DbSetting | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as DbSetting | undefined;
  },

  upsert(key: string, value: string): DbSetting {
    const db = getDb();
    const now = Date.now();
    const existing = this.findByKey(key);

    if (existing) {
      db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?').run(value, now, key);
    } else {
      db.prepare(
        'INSERT INTO settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)'
      ).run(key, value, now, now);
    }

    return this.findByKey(key)!;
  },
};
