import { getDb } from '../db/connection';

export interface CategoryInfo {

  name: string;
  colour: string | null;
  type: string;

}

export function buildCategoryLookup(accountId: string): Map<string, CategoryInfo> {

  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id, c.name, ch.colour, ch.type
    FROM categories c
    JOIN category_headers ch ON ch.id = c.category_header_id
    WHERE ch.account_id = ?
  `).all(accountId) as Array<{ id: string; name: string; colour: string | null; type: string }>;

  const lookup = new Map<string, CategoryInfo>();

  for (const row of rows) {

    lookup.set(row.id, { name: row.name, colour: row.colour, type: row.type });

  }

  return lookup;

}
