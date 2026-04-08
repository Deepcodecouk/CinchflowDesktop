import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterSelectedAccountIds,
  filterSummaryCashflowRows,
  findLinkedBudgetTarget,
  getCollapseAllTarget,
  getInitialSelectedAccountIds,
  toggleSelectedAccountIds,
} from './cashflow-page-state';
import type { CashflowTableRowModel } from './cashflow-table-model';
import type { CategoryLinkWithNames } from '../../../../shared/types';

describe('cashflow page state', () => {
  it('defaults selection to all available accounts when there is no remembered selection', () => {
    const selectedAccountIds = getInitialSelectedAccountIds(['account-1', 'account-2'], null);

    assert.deepEqual(selectedAccountIds, ['account-1', 'account-2']);
  });

  it('filters remembered selections to accounts that still exist', () => {
    const selectedAccountIds = getInitialSelectedAccountIds(
      ['account-1', 'account-2'],
      ['account-2', 'account-9', 'account-2'],
    );

    assert.deepEqual(selectedAccountIds, ['account-2']);
  });

  it('does not allow the last selected account to be unchecked', () => {
    const selectedAccountIds = toggleSelectedAccountIds(['account-2'], 'account-2', ['account-1', 'account-2']);

    assert.deepEqual(selectedAccountIds, ['account-2']);
  });

  it('keeps only summary rows when filtering for summary-only display', () => {
    const rows: CashflowTableRowModel[] = [
      { kind: 'derived', key: 'opening-balance', label: 'Opening Balance', bold: true, invertActuals: false, getValue: () => 0 },
      { kind: 'spacer', key: 'summary-spacer' },
      { kind: 'banner', key: 'summary-banner', label: 'Summary', variant: 'summary' },
      { kind: 'derived', key: 'summary-opening-balance', label: 'Opening Balance', bold: false, invertActuals: false, getValue: () => 0 },
      { kind: 'derived', key: 'summary-closing-balance', label: 'Closing Balance', bold: true, invertActuals: false, getValue: () => 0 },
    ];

    const summaryRows = filterSummaryCashflowRows(rows);

    assert.deepEqual(summaryRows.map((row) => row.key), [
      'summary-banner',
      'summary-opening-balance',
      'summary-closing-balance',
    ]);
  });

  it('ignores summary-only sections when deciding the global collapse-all target', () => {
    const collapseAllTarget = getCollapseAllTarget([
      { isSummaryOnly: true, areAllHeadersCollapsed: false },
      { isSummaryOnly: false, areAllHeadersCollapsed: true },
      { isSummaryOnly: false, areAllHeadersCollapsed: false },
    ]);

    assert.equal(collapseAllTarget, true);
  });

  it('resolves the visible linked budget target for a linked category', () => {
    const categoryLinks: CategoryLinkWithNames[] = [
      {
        id: 'link-1',
        source_account_id: 'account-1',
        source_category_id: 'category-1',
        target_account_id: 'account-2',
        target_category_id: 'category-2',
        source_account_name: 'Main',
        source_category_name: 'Rent',
        target_account_name: 'Savings',
        target_category_name: 'Transfer',
        created_at: 0,
        updated_at: 0,
      },
    ];

    assert.deepEqual(findLinkedBudgetTarget('account-1', 'category-1', categoryLinks), {
      accountId: 'account-2',
      categoryId: 'category-2',
    });
    assert.deepEqual(findLinkedBudgetTarget('account-2', 'category-2', categoryLinks), {
      accountId: 'account-1',
      categoryId: 'category-1',
    });
  });

  it('filters duplicate and removed selected account ids while preserving account order', () => {
    const selectedAccountIds = filterSelectedAccountIds(
      ['account-2', 'account-1', 'account-2', 'account-9'],
      ['account-1', 'account-2', 'account-3'],
    );

    assert.deepEqual(selectedAccountIds, ['account-2', 'account-1']);
  });
});
