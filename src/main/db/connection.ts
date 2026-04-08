import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

let db: Database.Database | null = null;

export function getDbPath(): string {
  const isTest = process.env.NODE_ENV === 'test';
  const filename = isTest ? 'test.db' : 'cinchflow.db';

  // In packaged app, use userData; in development, use _data/ relative to project root
  let dir: string;
  if (app.isPackaged) {
    dir = path.join(app.getPath('userData'), '_data');
  } else {
    dir = path.join(process.cwd(), '_data');
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return path.join(dir, filename);
}

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = getDbPath();
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function checkpointWal(): void {
  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)');
  }
}

export function transaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDb();
  const exec = database.transaction(() => fn(database));
  return exec();
}
