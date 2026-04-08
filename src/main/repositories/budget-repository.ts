import { getDb } from '../db/connection';
import { generateId } from '../db/utils';
import type { DbBudgetAmount } from '../../shared/types';

export const budgetRepository = {
  findByAccountAndYear(accountId: string, year: number): DbBudgetAmount[] {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM budget_amounts WHERE account_id = ? AND year = ? ORDER BY month, category_id',
    ).all(accountId, year) as DbBudgetAmount[];
  },

  upsert(accountId: string, categoryId: string | null, year: number, month: number, amount: number): DbBudgetAmount {
    const db = getDb();
    const now = Date.now();

    // Try to update existing
    const existing = db.prepare(
      'SELECT id FROM budget_amounts WHERE account_id = ? AND category_id IS ? AND year = ? AND month = ?',
    ).get(accountId, categoryId, year, month) as { id: string } | undefined;

    if (existing) {
      db.prepare('UPDATE budget_amounts SET amount = ?, updated_at = ? WHERE id = ?')
        .run(amount, now, existing.id);
      return db.prepare('SELECT * FROM budget_amounts WHERE id = ?').get(existing.id) as DbBudgetAmount;
    }

    const id = generateId();
    db.prepare(
      'INSERT INTO budget_amounts (id, account_id, category_id, year, month, amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, accountId, categoryId, year, month, amount, now, now);
    return db.prepare('SELECT * FROM budget_amounts WHERE id = ?').get(id) as DbBudgetAmount;
  },

  fillRight(accountId: string, categoryId: string | null, year: number, fromMonth: number, amount: number, mode: 'overwrite' | 'empty_only'): void {
    const db = getDb();
    for (let m = fromMonth; m <= 12; m++) {
      if (mode === 'empty_only') {
        const existing = db.prepare(
          'SELECT amount FROM budget_amounts WHERE account_id = ? AND category_id IS ? AND year = ? AND month = ?',
        ).get(accountId, categoryId, year, m) as { amount: number } | undefined;
        if (existing?.amount) continue;
      }
      this.upsert(accountId, categoryId, year, m, amount);
    }
  },

  copyFromPreviousMonth(accountId: string, year: number, month: number, mode: 'overwrite' | 'empty_only'): number {
    const db = getDb();
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }

    const prevBudgets = db.prepare(
      'SELECT category_id, amount FROM budget_amounts WHERE account_id = ? AND year = ? AND month = ?',
    ).all(accountId, prevYear, prevMonth) as Array<{ category_id: string | null; amount: number }>;

    let count = 0;
    for (const budget of prevBudgets) {
      if (mode === 'empty_only') {
        const existing = db.prepare(
          'SELECT amount FROM budget_amounts WHERE account_id = ? AND category_id IS ? AND year = ? AND month = ?',
        ).get(accountId, budget.category_id, year, month) as { amount: number } | undefined;
        if (existing?.amount) continue;
      }
      this.upsert(accountId, budget.category_id, year, month, budget.amount);
      count++;
    }
    return count;
  },

  copyFromPreviousYear(accountId: string, year: number, mode: 'overwrite' | 'empty_only'): number {
    const db = getDb();
    const prevBudgets = db.prepare(
      'SELECT category_id, month, amount FROM budget_amounts WHERE account_id = ? AND year = ?',
    ).all(accountId, year - 1) as Array<{ category_id: string | null; month: number; amount: number }>;

    let count = 0;
    for (const budget of prevBudgets) {
      if (mode === 'empty_only') {
        const existing = db.prepare(
          'SELECT amount FROM budget_amounts WHERE account_id = ? AND category_id IS ? AND year = ? AND month = ?',
        ).get(accountId, budget.category_id, year, budget.month) as { amount: number } | undefined;
        if (existing?.amount) continue;
      }
      this.upsert(accountId, budget.category_id, year, budget.month, budget.amount);
      count++;
    }
    return count;
  },

  clearMonth(accountId: string, year: number, month: number): number {

    const db = getDb();
    const result = db.prepare(
      'DELETE FROM budget_amounts WHERE account_id = ? AND year = ? AND month = ?',
    ).run(accountId, year, month);
    return result.changes;

  },

  getActualsForAccountAndYear(accountId: string, year: number): Array<{ category_id: string | null; month: number; total: number }> {
    const db = getDb();
    const startDate = Date.UTC(year, 0, 1) / 1000;
    const endDate = Date.UTC(year + 1, 0, 1) / 1000;

    return db.prepare(`
      SELECT category_id, CAST(strftime('%m', datetime(date, 'unixepoch')) AS INTEGER) as month,
             SUM(delta_value) as total
      FROM transactions
      WHERE account_id = ? AND date >= ? AND date < ? AND is_opening_balance = 0
      GROUP BY category_id, month
    `).all(accountId, startDate, endDate) as Array<{ category_id: string | null; month: number; total: number }>;
  },

  getOpeningBalanceForYear(accountId: string, year: number): number {
    const db = getDb();
    const startDate = Date.UTC(year, 0, 1) / 1000;
    const result = db.prepare(
      'SELECT SUM(delta_value) as total FROM transactions WHERE account_id = ? AND date < ?',
    ).get(accountId, startDate) as { total: number | null };
    return result.total ?? 0;
  },

  getProjectedOpeningBalances(
    accountId: string,
    targetYear: number,
  ): { budget: number; actual: number; hybrid: number } {

    const db = getDb();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 1. Actual opening balance for current month (sum all transactions before current month start)
    const currentMonthStart = Date.UTC(currentYear, currentMonth - 1, 1) / 1000;
    const obResult = db.prepare(
      'SELECT SUM(delta_value) as total FROM transactions WHERE account_id = ? AND date < ?',
    ).get(accountId, currentMonthStart) as { total: number | null };
    const actualOB = obResult.total ?? 0;

    // 2. Current month budgets per category with header type
    const currentMonthEnd = Date.UTC(currentYear, currentMonth, 1) / 1000;

    const budgetRows = db.prepare(`
      SELECT ba.category_id, ba.amount, ch.type as header_type
      FROM budget_amounts ba
      LEFT JOIN categories c ON c.id = ba.category_id
      LEFT JOIN category_headers ch ON ch.id = c.category_header_id
      WHERE ba.account_id = ? AND ba.year = ? AND ba.month = ?
    `).all(accountId, currentYear, currentMonth) as Array<{
      category_id: string | null;
      amount: number;
      header_type: string | null;
    }>;

    // 3. Current month actuals per category with header type
    const actualRows = db.prepare(`
      SELECT t.category_id, SUM(t.delta_value) as total, ch.type as header_type
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN category_headers ch ON ch.id = c.category_header_id
      WHERE t.account_id = ? AND t.date >= ? AND t.date < ? AND t.is_opening_balance = 0
      GROUP BY t.category_id
    `).all(accountId, currentMonthStart, currentMonthEnd) as Array<{
      category_id: string | null;
      total: number;
      header_type: string | null;
    }>;

    // Build per-category maps
    const budgetMap = new Map<string, { amount: number; type: string }>();

    for (const b of budgetRows) {

      const key = b.category_id ?? '__null__';
      budgetMap.set(key, { amount: b.amount, type: b.header_type ?? 'variable_expense' });

    }

    const actualMap = new Map<string, { total: number; type: string }>();

    for (const a of actualRows) {

      const key = a.category_id ?? '__null__';
      actualMap.set(key, { total: a.total, type: a.header_type ?? 'variable_expense' });

    }

    // Calculate current month delta for each carry forward mode
    const allCatIds = new Set([...budgetMap.keys(), ...actualMap.keys()]);
    let budgetDelta = 0;
    let actualDelta = 0;
    let hybridDelta = 0;

    for (const catId of allCatIds) {

      const bEntry = budgetMap.get(catId);
      const aEntry = actualMap.get(catId);
      const type = bEntry?.type ?? aEntry?.type ?? 'variable_expense';
      const isExpense = type === 'fixed_expense' || type === 'variable_expense';
      const budgetVal = bEntry?.amount ?? 0;
      const actualVal = aEntry?.total ?? 0;

      // Budget mode: income adds, expense subtracts (budgets stored as positive)
      budgetDelta += isExpense ? -budgetVal : budgetVal;

      // Actual mode: raw deltas sum naturally (income positive, expense negative)
      actualDelta += actualVal;

      // Hybrid: take the value with larger absolute impact per category
      const hybridVal = Math.abs(actualVal) > Math.abs(budgetVal) ? actualVal : budgetVal;

      if (isExpense) {

        hybridDelta -= Math.abs(hybridVal);

      } else {

        hybridDelta += hybridVal;

      }

    }

    // Current month closing balances per mode
    const budgetClosing = actualOB + budgetDelta;
    const actualClosing = actualOB + actualDelta;
    const hybridClosing = actualOB + hybridDelta;

    // 4. Sum budget net delta for remaining months (currentMonth+1 through Dec of targetYear-1)
    const remainingResult = db.prepare(`
      SELECT SUM(
        CASE
          WHEN ba.category_id IS NULL THEN -ba.amount
          WHEN ch.type IN ('income_start', 'income_end') THEN ba.amount
          WHEN ch.type IN ('fixed_expense', 'variable_expense') THEN -ba.amount
          ELSE 0
        END
      ) as net_delta
      FROM budget_amounts ba
      LEFT JOIN categories c ON c.id = ba.category_id
      LEFT JOIN category_headers ch ON ch.id = c.category_header_id
      WHERE ba.account_id = ?
        AND ((ba.year = ? AND ba.month > ?) OR (ba.year > ? AND ba.year < ?))
    `).get(accountId, currentYear, currentMonth, currentYear, targetYear) as { net_delta: number | null };

    const remainingDelta = remainingResult.net_delta ?? 0;

    return {
      budget: budgetClosing + remainingDelta,
      actual: actualClosing + remainingDelta,
      hybrid: hybridClosing + remainingDelta,
    };

  },
};
