import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  CashflowCoreData,
  CategoryHeaderType,
  CategoryLinkWithNames,
  DbCategory,
  DbCategoryHeader,
} from '../../../../shared/types';
import { UNCATEGORISED_CATEGORY_ID } from '../../../../shared/constants';
import { buildCashflowCalculations } from './cashflow-calculations';
import { buildCashflowTableRows, getEditableCashflowCategoryIds } from './cashflow-table-model';

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
      { header: incomeHeader, categories: [buildCategory('cat-salary', incomeHeader.id, 'Salary')] },
      { header: fixedHeader, categories: [buildCategory('cat-rent', fixedHeader.id, 'Rent')] },
      { header: variableHeader, categories: [buildCategory('cat-groceries', variableHeader.id, 'Groceries')] },
      { header: incomeEndHeader, categories: [buildCategory('cat-bonus', incomeEndHeader.id, 'Bonus')] },
    ],
    budgetLookup: {
      'cat-salary': { 1: 2000 },
      'cat-rent': { 1: -800 },
      'cat-groceries': { 1: -120 },
      'cat-bonus': { 1: 100 },
      [UNCATEGORISED_CATEGORY_ID]: { 1: -25 },
    },
    actualsLookup: {},
    openingBalance: 1000,
  };
}

describe('getEditableCashflowCategoryIds', () => {
  it('omits collapsed categories and keeps uncategorised after variable expense rows', () => {
    const data = buildCashflowData();
    const ids = getEditableCashflowCategoryIds(data.hierarchies, { 'header-fixed': true });

    assert.deepEqual(ids, ['cat-salary', 'cat-groceries', UNCATEGORISED_CATEGORY_ID, 'cat-bonus']);
  });

  it('omits entire sections when a section is collapsed', () => {
    const data = buildCashflowData();
    const ids = getEditableCashflowCategoryIds(data.hierarchies, {}, { 'fixed-expenses': true, 'income-end': true });

    assert.deepEqual(ids, ['cat-salary', 'cat-groceries', UNCATEGORISED_CATEGORY_ID]);
  });
});

describe('buildCashflowTableRows', () => {
  it('keeps variable uncategorised rows before the section total and appends the summary rows last', () => {
    const categoryLinks: CategoryLinkWithNames[] = [
      {
        id: 'link-1',
        source_account_id: 'account-1',
        source_category_id: 'cat-groceries',
        target_account_id: 'account-2',
        target_category_id: 'cat-payback',
        source_account_name: 'Main',
        source_category_name: 'Groceries',
        target_account_name: 'Savings',
        target_category_name: 'Payback',
        created_at: 0,
        updated_at: 0,
      },
    ];
    const calc = buildCashflowCalculations(buildCashflowData(), 2027, 'account-1', categoryLinks, 'hybrid');
    const rows = buildCashflowTableRows(calc, {});

    assert.equal(rows[0]?.kind, 'derived');
    assert.equal(rows[0]?.key, 'opening-balance');

    const uncategorisedIndex = rows.findIndex((row) => row.kind === 'category' && row.categoryId === UNCATEGORISED_CATEGORY_ID);
    const variableTotalIndex = rows.findIndex((row) => row.kind === 'section-total' && row.key === 'variable-expenses-total');
    const summaryBannerIndex = rows.findIndex((row) => row.kind === 'banner' && row.key === 'summary-banner');
    const closingBalanceRow = rows[rows.length - 1];

    assert.notEqual(uncategorisedIndex, -1);
    assert.notEqual(variableTotalIndex, -1);
    assert.ok(uncategorisedIndex < variableTotalIndex);
    assert.notEqual(summaryBannerIndex, -1);
    assert.equal(closingBalanceRow?.kind, 'derived');
    assert.equal(closingBalanceRow?.key, 'summary-closing-balance');

    const linkedCategoryRow = rows.find(
      (row): row is Extract<(typeof rows)[number], { kind: 'category' }> =>
        row.kind === 'category' && row.categoryId === 'cat-groceries',
    );
    assert.equal(linkedCategoryRow?.linkedCategoryTooltip, 'Linked to Savings / Payback');
  });

  it('hides section headers and categories when a section is collapsed but keeps totals', () => {
    const calc = buildCashflowCalculations(buildCashflowData(), 2027, 'account-1', [], 'hybrid');
    const rows = buildCashflowTableRows(calc, {}, { 'fixed-expenses': true });

    const fixedBanner = rows.find((row) => row.kind === 'banner' && row.key === 'fixed-expenses-banner');
    const fixedHeader = rows.find((row) => row.kind === 'header' && row.key === 'header-fixed');
    const fixedCategory = rows.find((row) => row.kind === 'category' && row.key === 'cat-rent');
    const fixedTotal = rows.find((row) => row.kind === 'section-total' && row.key === 'fixed-expenses-total');
    const availableFunds = rows.find((row) => row.kind === 'derived' && row.key === 'fixed-expenses-available-funds');

    assert.equal(fixedBanner?.kind, 'banner');
    assert.equal((fixedBanner as Extract<typeof fixedBanner, { kind: 'banner' }> | undefined)?.isCollapsed, true);
    assert.equal(fixedHeader, undefined);
    assert.equal(fixedCategory, undefined);
    assert.notEqual(fixedTotal, undefined);
    assert.notEqual(availableFunds, undefined);
  });
});
