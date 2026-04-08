import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CashflowCoreData, CategoryHeaderType, DbCategory, DbCategoryHeader } from '../../../../shared/types';
import { buildCashflowCalculations } from './cashflow-calculations';

const REAL_DATE = Date;

function withMockedDate<T>(isoDate: string, run: () => T): T {
  class MockDate extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? isoDate);
    }

    static now() {
      return new REAL_DATE(isoDate).getTime();
    }
  }

  global.Date = MockDate as DateConstructor;

  try {
    return run();
  } finally {
    global.Date = REAL_DATE;
  }
}

function buildHeader(id: string, name: string, type: CategoryHeaderType, colour: string): DbCategoryHeader {
  return {
    id,
    account_id: 'account-1',
    name,
    type,
    colour,
    created_at: 0,
    updated_at: 0,
  };
}

function buildCategory(id: string, headerId: string, name: string): DbCategory {
  return {
    id,
    category_header_id: headerId,
    name,
    created_at: 0,
    updated_at: 0,
  };
}

function buildCashflowData(): CashflowCoreData {
  const incomeHeader = buildHeader('header-income-start', 'Income Start', 'income_start', '#22c55e');
  const fixedHeader = buildHeader('header-fixed', 'Fixed Expenses', 'fixed_expense', '#ef4444');
  const variableHeader = buildHeader('header-variable', 'Variable Expenses', 'variable_expense', '#f59e0b');
  const incomeEndHeader = buildHeader('header-income-end', 'Income End', 'income_end', '#3b82f6');

  const salary = buildCategory('cat-salary', incomeHeader.id, 'Salary');
  const rent = buildCategory('cat-rent', fixedHeader.id, 'Rent');
  const groceries = buildCategory('cat-groceries', variableHeader.id, 'Groceries');
  const bonus = buildCategory('cat-bonus', incomeEndHeader.id, 'Bonus');

  return {
    account: {
      id: 'account-1',
      name: 'Main',
      icon: 'bank',
      type: 'current',
      created_at: 0,
      updated_at: 0,
    },
    hierarchies: [
      { header: incomeHeader, categories: [salary] },
      { header: fixedHeader, categories: [rent] },
      { header: variableHeader, categories: [groceries] },
      { header: incomeEndHeader, categories: [bonus] },
    ],
    budgetLookup: {
      'cat-salary': { 3: 2000, 4: 2000 },
      'cat-rent': { 3: -800, 4: -800 },
      'cat-groceries': { 3: -100, 4: -90 },
      'cat-bonus': { 3: 150, 4: 200 },
      __uncategorised__: { 3: -40, 4: -20 },
    },
    actualsLookup: {
      'cat-salary': { 3: 2100 },
      'cat-rent': { 3: -820 },
      'cat-groceries': { 3: -120 },
      'cat-bonus': { 3: 0 },
      __uncategorised__: { 3: -60 },
    },
    openingBalance: 1000,
    projectedOpeningBalances: {
      hybrid: 1250,
      budget: 1300,
      actual: 1150,
    },
  };
}

describe('buildCashflowCalculations', () => {
  it('uses the carry-forward-specific projected opening balance for January', () => {
    const data = buildCashflowData();

    assert.equal(buildCashflowCalculations(data, 2027, 'account-1', [], 'hybrid').openingBalForMonth(1), 1250);
    assert.equal(buildCashflowCalculations(data, 2027, 'account-1', [], 'budget').openingBalForMonth(1), 1300);
    assert.equal(buildCashflowCalculations(data, 2027, 'account-1', [], 'actual').openingBalForMonth(1), 1150);
  });

  it('includes uncategorised spend and hybrid carry-forward values in current-month variable expenses', () => {
    withMockedDate('2026-03-15T12:00:00Z', () => {
      const calc = buildCashflowCalculations(buildCashflowData(), 2026, 'account-1', [], 'hybrid');

      assert.equal(calc.varExpTotal(3), 180);
      assert.deepEqual(calc.variableExpenseBreakdown(3), {
        budget: -140,
        actual: -180,
        hybrid: 180,
      });
    });
  });

  it('flips displayed actual values for expense categories only', () => {
    const calc = buildCashflowCalculations(buildCashflowData(), 2027, 'account-1', [], 'hybrid');

    assert.equal(calc.displayActual(-820, 'cat-rent'), 820);
    assert.equal(calc.displayActual(-60, '__uncategorised__'), 60);
    assert.equal(calc.displayActual(2100, 'cat-salary'), 2100);
  });
});
