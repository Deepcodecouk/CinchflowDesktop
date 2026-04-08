import type { RegisterViewData, TransactionWithCategory } from '../../../../shared/types';

export interface RegisterFilterState {
  description: string;
  categoryId: string | 'uncategorised' | null;
  flag: 'all' | 'flagged' | 'unflagged';
}

export interface RegisterTransactionRowModel {
  transaction: TransactionWithCategory;
  runningBalance: number;
  creditValue: number | null;
  debitValue: number | null;
}

export interface RegisterSummaryModel {
  openingBalance: number;
  closingBalance: number;
  netChange: number;
  transactionCount: number;
  filteredCount: number;
}

export interface RegisterViewModel {
  summary: RegisterSummaryModel;
  rows: RegisterTransactionRowModel[];
}

export interface NormalizedRegisterDraft {
  normalizedCredit: string;
  normalizedDebit: string;
  deltaValue: number;
}

const DEFAULT_FILTERS: RegisterFilterState = {
  description: '',
  categoryId: null,
  flag: 'all',
};

export function sortRegisterTransactions(transactions: TransactionWithCategory[]): TransactionWithCategory[] {
  return [...transactions].sort((left, right) => right.date - left.date || right.created_at - left.created_at);
}

export function calculateRunningBalances(
  sortedTransactions: TransactionWithCategory[],
  openingBalance: number,
): Map<string, number> {
  const balances = new Map<string, number>();
  let runningBalance = openingBalance;

  for (const transaction of [...sortedTransactions].reverse()) {
    runningBalance += transaction.delta_value;
    balances.set(transaction.id, runningBalance);
  }

  return balances;
}

export function matchesRegisterFilters(
  transaction: TransactionWithCategory,
  filters: RegisterFilterState,
): boolean {
  if (filters.description) {
    const query = filters.description.toLowerCase();
    const descriptionMatches = transaction.description.toLowerCase().includes(query);
    const noteMatches = (transaction.user_note ?? '').toLowerCase().includes(query);

    if (!descriptionMatches && !noteMatches) {
      return false;
    }
  }

  if (filters.categoryId === 'uncategorised' && transaction.category_id !== null) {
    return false;
  }

  if (filters.categoryId && filters.categoryId !== 'uncategorised' && transaction.category_id !== filters.categoryId) {
    return false;
  }

  if (filters.flag === 'flagged' && !transaction.is_flagged) {
    return false;
  }

  if (filters.flag === 'unflagged' && Boolean(transaction.is_flagged)) {
    return false;
  }

  return true;
}

export function buildRegisterViewModel(
  viewData: Pick<RegisterViewData, 'transactions' | 'openingBalance'>,
  filters: RegisterFilterState = DEFAULT_FILTERS,
): RegisterViewModel {
  const sortedTransactions = sortRegisterTransactions(viewData.transactions);
  const balances = calculateRunningBalances(sortedTransactions, viewData.openingBalance);
  const allRows = sortedTransactions.map((transaction) => ({
    transaction,
    runningBalance: balances.get(transaction.id) ?? viewData.openingBalance,
    creditValue: transaction.delta_value > 0 ? transaction.delta_value : null,
    debitValue: transaction.delta_value < 0 ? Math.abs(transaction.delta_value) : null,
  }));
  const rows = allRows.filter((row) => matchesRegisterFilters(row.transaction, filters));
  const closingBalance =
    sortedTransactions.length > 0
      ? balances.get(sortedTransactions[0].id) ?? viewData.openingBalance
      : viewData.openingBalance;

  return {
    summary: {
      openingBalance: viewData.openingBalance,
      closingBalance,
      netChange: closingBalance - viewData.openingBalance,
      transactionCount: sortedTransactions.length,
      filteredCount: rows.length,
    },
    rows,
  };
}

export function normalizeRegisterDraftAmounts(credit: string, debit: string): NormalizedRegisterDraft {
  let normalizedCredit = credit;
  let normalizedDebit = debit;
  const creditNumber = parseFloat(credit);
  const debitNumber = parseFloat(debit);

  if (!Number.isNaN(creditNumber) && creditNumber < 0) {
    normalizedCredit = '';
    normalizedDebit = Math.abs(creditNumber).toString();
  }

  if (!Number.isNaN(debitNumber) && debitNumber < 0) {
    normalizedDebit = '';
    normalizedCredit = Math.abs(debitNumber).toString();
  }

  const creditValue = parseFloat(normalizedCredit) || 0;
  const debitValue = parseFloat(normalizedDebit) || 0;

  return {
    normalizedCredit,
    normalizedDebit,
    deltaValue: creditValue > 0 ? creditValue : -debitValue,
  };
}
