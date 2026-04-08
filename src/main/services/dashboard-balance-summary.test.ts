import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  CashflowTableData,
  CategoryHeaderType,
  DbCashflowComment,
  DbCategory,
  DbCategoryHeader,
} from '../../shared/types';
import { buildDashboardBalanceSummary } from './dashboard-balance-summary';

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

function buildTableData(): CashflowTableData {

  const incomeHeader = buildHeader('header-income-start', 'Income Start', 'income_start', '#22c55e');
  const fixedHeader = buildHeader('header-fixed', 'Fixed Expenses', 'fixed_expense', '#ef4444');
  const salary = buildCategory('cat-salary', incomeHeader.id, 'Salary');
  const rent = buildCategory('cat-rent', fixedHeader.id, 'Rent');

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
    ],
    budgetLookup: {
      'cat-salary': { 1: 3000, 2: 2800 },
      'cat-rent': { 1: -1000, 2: -900 },
    },
    actualsLookup: {
      'cat-salary': { 1: 3100, 2: 2500 },
      'cat-rent': { 1: -950, 2: -1000 },
    },
    openingBalance: 500,
    comments: [] as DbCashflowComment[],
    categoryLinks: [],
  };

}

describe('buildDashboardBalanceSummary', () => {

  it('uses the actual opening balance plus the selected month budget delta for historic budget closing balance', () => {

    withMockedDate('2026-03-15T12:00:00Z', () => {

      const summary = buildDashboardBalanceSummary(buildTableData(), 2026, 2);

      assert.equal(summary.monthType, 'past');
      assert.equal(summary.openingBalance, 2650);
      assert.equal(summary.closingActual, 4150);
      assert.equal(summary.closingBudget, 4550);
    
});
  
});

});
