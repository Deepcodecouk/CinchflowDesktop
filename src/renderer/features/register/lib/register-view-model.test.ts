import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RegisterViewData, TransactionWithCategory } from '../../../../shared/types';
import {
  buildRegisterViewModel,
  normalizeRegisterDraftAmounts,
  sortRegisterTransactions,
} from './register-view-model';

function buildTransaction(overrides: Partial<TransactionWithCategory>): TransactionWithCategory {
  return {
    id: overrides.id ?? 'tx-default',
    account_id: 'account-1',
    category_id: overrides.category_id ?? null,
    date: overrides.date ?? Date.UTC(2026, 2, 15) / 1000,
    description: overrides.description ?? 'Default',
    user_note: overrides.user_note ?? null,
    delta_value: overrides.delta_value ?? 0,
    is_opening_balance: 0,
    is_flagged: overrides.is_flagged ?? 0,
    import_id: null,
    categorised_by_rule_id: overrides.categorised_by_rule_id ?? null,
    external_id: null,
    created_at: overrides.created_at ?? 0,
    updated_at: 0,
    category_name: overrides.category_name ?? null,
    category_type: overrides.category_type ?? null,
    category_colour: overrides.category_colour ?? null,
  };
}

function buildViewData(transactions: TransactionWithCategory[]): RegisterViewData {
  return {
    account: {
      id: 'account-1',
      name: 'Main',
      icon: 'bank',
      type: 'current',
      created_at: 0,
      updated_at: 0,
    },
    year: 2026,
    month: 3,
    openingBalance: 1000,
    transactions,
    categories: [],
  };
}

describe('sortRegisterTransactions', () => {
  it('keeps same-day transactions ordered by created_at descending', () => {
    const sorted = sortRegisterTransactions([
      buildTransaction({ id: 'older-created', date: 100, created_at: 10 }),
      buildTransaction({ id: 'newer-created', date: 100, created_at: 20 }),
      buildTransaction({ id: 'later-date', date: 200, created_at: 5 }),
    ]);

    assert.deepEqual(sorted.map((transaction) => transaction.id), [
      'later-date',
      'newer-created',
      'older-created',
    ]);
  });
});

describe('buildRegisterViewModel', () => {
  it('calculates running balances from the full ledger before filters are applied', () => {
    const transactions = [
      buildTransaction({ id: 'tx-3', date: 300, created_at: 30, description: 'Dinner', delta_value: -50 }),
      buildTransaction({ id: 'tx-2', date: 200, created_at: 20, description: 'Salary', delta_value: 200 }),
      buildTransaction({ id: 'tx-1', date: 100, created_at: 10, description: 'Groceries', delta_value: -100 }),
    ];

    const viewModel = buildRegisterViewModel(buildViewData(transactions), {
      description: 'salary',
      categoryId: null,
      flag: 'all',
    });

    assert.equal(viewModel.summary.openingBalance, 1000);
    assert.equal(viewModel.summary.closingBalance, 1050);
    assert.equal(viewModel.summary.transactionCount, 3);
    assert.equal(viewModel.summary.filteredCount, 1);
    assert.equal(viewModel.rows.length, 1);
    assert.equal(viewModel.rows[0]?.transaction.id, 'tx-2');
    assert.equal(viewModel.rows[0]?.runningBalance, 1100);
  });

  it('supports filtering to uncategorised transactions without corrupting balances', () => {
    const transactions = [
      buildTransaction({ id: 'cat', date: 200, created_at: 20, category_id: 'category-1', delta_value: -20 }),
      buildTransaction({ id: 'uncat', date: 100, created_at: 10, category_id: null, delta_value: -10 }),
    ];

    const viewModel = buildRegisterViewModel(buildViewData(transactions), {
      description: '',
      categoryId: 'uncategorised',
      flag: 'all',
    });

    assert.equal(viewModel.summary.closingBalance, 970);
    assert.equal(viewModel.rows.length, 1);
    assert.equal(viewModel.rows[0]?.transaction.id, 'uncat');
    assert.equal(viewModel.rows[0]?.runningBalance, 990);
  });
});

describe('normalizeRegisterDraftAmounts', () => {
  it('converts a negative credit into a debit and a negative debit into a credit', () => {
    assert.deepEqual(normalizeRegisterDraftAmounts('-12.5', ''), {
      normalizedCredit: '',
      normalizedDebit: '12.5',
      deltaValue: -12.5,
    });

    assert.deepEqual(normalizeRegisterDraftAmounts('', '-7'), {
      normalizedCredit: '7',
      normalizedDebit: '',
      deltaValue: 7,
    });
  });
});
