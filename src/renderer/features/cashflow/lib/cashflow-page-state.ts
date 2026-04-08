import type { CategoryLinkWithNames } from '../../../../shared/types';
import type { CashflowTableRowModel } from './cashflow-table-model';

export interface CashflowVisibleSectionState {
  isSummaryOnly: boolean;
  areAllHeadersCollapsed: boolean;
}

export interface LinkedBudgetTarget {
  accountId: string;
  categoryId: string;
}

export function getInitialSelectedAccountIds(
  availableAccountIds: string[],
  rememberedSelectedAccountIds: string[] | null,
): string[] {
  const rememberedSelection = filterSelectedAccountIds(rememberedSelectedAccountIds ?? [], availableAccountIds);

  if (rememberedSelection.length > 0) {
    return rememberedSelection;
  }

  return [...availableAccountIds];
}

export function filterSelectedAccountIds(
  selectedAccountIds: string[],
  availableAccountIds: string[],
): string[] {
  const availableIdSet = new Set(availableAccountIds);
  const filteredIds: string[] = [];

  for (const accountId of selectedAccountIds) {
    if (availableIdSet.has(accountId) && !filteredIds.includes(accountId)) {
      filteredIds.push(accountId);
    }
  }

  return filteredIds;
}

export function toggleSelectedAccountIds(
  selectedAccountIds: string[],
  accountId: string,
  availableAccountIds: string[],
): string[] {
  const filteredIds = filterSelectedAccountIds(selectedAccountIds, availableAccountIds);
  const isSelected = filteredIds.includes(accountId);

  if (isSelected) {
    return filteredIds.length > 1 ? filteredIds.filter((id) => id !== accountId) : filteredIds;
  }

  return filterSelectedAccountIds([...filteredIds, accountId], availableAccountIds);
}

export function filterSummaryCashflowRows(rows: CashflowTableRowModel[]): CashflowTableRowModel[] {
  return rows.filter((row) => {
    if (row.kind === 'banner') {
      return row.key === 'summary-banner';
    }

    if (row.kind === 'derived') {
      return row.key.startsWith('summary-');
    }

    return false;
  });
}

export function getCollapseAllTarget(sections: CashflowVisibleSectionState[]): boolean {
  const fullSections = sections.filter((section) => !section.isSummaryOnly);

  if (fullSections.length === 0) {
    return false;
  }

  const allHeadersCollapsed = fullSections.every((section) => section.areAllHeadersCollapsed);

  return !allHeadersCollapsed;
}

export function findLinkedBudgetTarget(
  accountId: string,
  categoryId: string,
  categoryLinks: CategoryLinkWithNames[],
): LinkedBudgetTarget | null {
  const linkedCategory = categoryLinks.find(
    (link) =>
      (link.source_account_id === accountId && link.source_category_id === categoryId)
      || (link.target_account_id === accountId && link.target_category_id === categoryId),
  );

  if (!linkedCategory) {
    return null;
  }

  if (linkedCategory.source_account_id === accountId && linkedCategory.source_category_id === categoryId) {
    return {
      accountId: linkedCategory.target_account_id,
      categoryId: linkedCategory.target_category_id,
    };
  }

  return {
    accountId: linkedCategory.source_account_id,
    categoryId: linkedCategory.source_category_id,
  };
}
