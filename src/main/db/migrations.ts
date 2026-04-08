import type Database from 'better-sqlite3';
import { getDb } from './connection';

// Import all migrations
import migration001 from './migrations/001-schema';
import migration002 from './migrations/002-add-external-id';

export interface Migration {
  id: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  migration001,
  migration002,
].sort((a, b) => a.id - b.id);

export function runMigrations(): void {
  const db = getDb();

  // Ensure _migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  // Get the highest applied migration
  const lastMigration = db.prepare(
    'SELECT MAX(id) as max_id FROM _migrations'
  ).get() as { max_id: number | null };
  const lastId = lastMigration?.max_id ?? 0;

  // Run pending migrations
  const pending = migrations.filter((m) => m.id > lastId);
  if (pending.length === 0) return;

  const runAll = db.transaction(() => {
    for (const migration of pending) {
      console.log(`Running migration ${migration.id}: ${migration.name}`);
      migration.up(db);
      db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)').run(
        migration.id,
        migration.name
      );
    }
  });

  runAll();
  console.log(`Applied ${pending.length} migration(s)`);
}
