import type { Migration } from '../migrations';

const migration: Migration = {
  id: 1,
  name: 'Full schema - all tables and indexes',
  up(db) {
    db.exec(`
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE,
        icon TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('current', 'savings', 'credit')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE category_headers (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name TEXT NOT NULL COLLATE NOCASE,
        type TEXT NOT NULL CHECK(type IN ('income_start', 'income_end', 'fixed_expense', 'variable_expense')),
        colour TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        category_header_id TEXT NOT NULL REFERENCES category_headers(id) ON DELETE CASCADE,
        name TEXT NOT NULL COLLATE NOCASE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        date INTEGER NOT NULL,
        description TEXT NOT NULL COLLATE NOCASE,
        user_note TEXT,
        delta_value REAL NOT NULL,
        is_opening_balance INTEGER NOT NULL DEFAULT 0,
        is_flagged INTEGER NOT NULL DEFAULT 0,
        import_id TEXT,
        categorised_by_rule_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE imports (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE categorisation_rules (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        match_text TEXT NOT NULL COLLATE NOCASE,
        match_type TEXT NOT NULL CHECK(match_type IN ('contains', 'exact', 'starts_with', 'regex')),
        min_amount REAL,
        max_amount REAL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE budget_amounts (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(account_id, category_id, year, month)
      );

      CREATE UNIQUE INDEX idx_budget_amounts_uncategorised
        ON budget_amounts(account_id, year, month)
        WHERE category_id IS NULL;

      CREATE TABLE cashflow_comments (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE category_links (
        id TEXT PRIMARY KEY,
        source_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        source_category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        target_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        target_category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL COLLATE NOCASE,
        content TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Indexes
      CREATE INDEX idx_category_headers_account_id ON category_headers(account_id);
      CREATE INDEX idx_categories_header_id ON categories(category_header_id);
      CREATE INDEX idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX idx_transactions_date ON transactions(date);
      CREATE INDEX idx_transactions_category_id ON transactions(category_id);
      CREATE INDEX idx_transactions_account_date ON transactions(account_id, date);
      CREATE INDEX idx_transactions_import_id ON transactions(import_id);
      CREATE INDEX idx_categorisation_rules_account ON categorisation_rules(account_id);
      CREATE INDEX idx_budget_amounts_account_year ON budget_amounts(account_id, year);
      CREATE INDEX idx_cashflow_comments_lookup ON cashflow_comments(account_id, year, month);
      CREATE INDEX idx_category_links_source ON category_links(source_account_id, source_category_id);
      CREATE INDEX idx_category_links_target ON category_links(target_account_id, target_category_id);
    `);
  },
};

export default migration;
