import { UNCATEGORISED_CATEGORY_ID } from '../../shared/constants';
import type {
  CashflowActualTransactionsRequest,
  CashflowTableData,
  TransactionWithCategory,
} from '../../shared/types';
import { getDb } from '../db/connection';
import { NotFoundError } from '../errors';
import { accountRepository } from '../repositories/account-repository';
import { budgetRepository } from '../repositories/budget-repository';
import { cashflowCommentRepository } from '../repositories/cashflow-comment-repository';
import { categoryHeaderRepository } from '../repositories/category-header-repository';
import { categoryLinkRepository } from '../repositories/category-link-repository';

type LookupRow = {
  category_id: string | null;
  month: number;
  amount?: number;
  total?: number;
};

function buildLookup(
  rows: LookupRow[],
  valueKey: 'amount' | 'total',
): Record<string, Record<number, number>> {

  const lookup: Record<string, Record<number, number>> = {};

  for (const row of rows) {

    const key = row.category_id ?? UNCATEGORISED_CATEGORY_ID;

    if (!lookup[key]) {

      lookup[key] = {};
    
}

    lookup[key][row.month] = row[valueKey] ?? 0;
  
}

  return lookup;

}

export const cashflowQueryService = {
  getTableData(accountId: string, year: number): CashflowTableData {

    const account = accountRepository.findById(accountId);

    if (!account) {

      throw new NotFoundError(`Account not found: ${accountId}`);
    
}

    const budgets = budgetRepository.findByAccountAndYear(accountId, year);
    const actuals = budgetRepository.getActualsForAccountAndYear(accountId, year);
    const currentYear = new Date().getFullYear();

    return {
      account,
      hierarchies: categoryHeaderRepository.findHierarchical(accountId),
      budgetLookup: buildLookup(budgets, 'amount'),
      actualsLookup: buildLookup(actuals, 'total'),
      openingBalance: budgetRepository.getOpeningBalanceForYear(accountId, year),
      projectedOpeningBalances:
        year > currentYear ? budgetRepository.getProjectedOpeningBalances(accountId, year) : undefined,
      comments: cashflowCommentRepository.findByAccountAndYear(accountId, year),
      categoryLinks: categoryLinkRepository.findByAccountId(accountId),
    };
  
},

  getActualTransactions(
    request: CashflowActualTransactionsRequest,
  ): TransactionWithCategory[] {

    const { accountId, year, month, filter } = request;
    const db = getDb();
    const startDate = Date.UTC(year, month - 1, 1) / 1000;
    const endDate = Date.UTC(year, month, 1) / 1000;

    if (filter.kind === 'header') {

      return db.prepare(`
        SELECT t.*, c.name as category_name, ch.type as category_type, ch.colour as category_colour
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_headers ch ON ch.id = c.category_header_id
        WHERE t.account_id = ? AND t.date >= ? AND t.date < ? AND t.is_opening_balance = 0
          AND ch.id = ?
        ORDER BY t.date DESC
      `).all(accountId, startDate, endDate, filter.headerId) as TransactionWithCategory[];
    
}

    if (filter.categoryId === null || filter.categoryId === UNCATEGORISED_CATEGORY_ID) {

      return db.prepare(`
        SELECT t.*, c.name as category_name, ch.type as category_type, ch.colour as category_colour
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_headers ch ON ch.id = c.category_header_id
        WHERE t.account_id = ? AND t.date >= ? AND t.date < ? AND t.is_opening_balance = 0
          AND t.category_id IS NULL
        ORDER BY t.date DESC
      `).all(accountId, startDate, endDate) as TransactionWithCategory[];
    
}

    return db.prepare(`
      SELECT t.*, c.name as category_name, ch.type as category_type, ch.colour as category_colour
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN category_headers ch ON ch.id = c.category_header_id
      WHERE t.account_id = ? AND t.date >= ? AND t.date < ? AND t.is_opening_balance = 0
        AND t.category_id = ?
      ORDER BY t.date DESC
    `).all(accountId, startDate, endDate, filter.categoryId) as TransactionWithCategory[];
  
},
};
