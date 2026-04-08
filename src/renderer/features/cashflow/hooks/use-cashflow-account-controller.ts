import { useState, useEffect, useCallback } from 'react';
import { useConfirm } from '../../../hooks/use-confirm';
import { useCashflowCalculations } from './use-cashflow-calculations';
import { useCashflowCellEditing } from './use-cashflow-cell-editing';
import { useCashflowOperations } from './use-cashflow-operations';
import { callIpc, toErrorMessage } from '../../../lib/ipc-client';
import { UNCATEGORISED_CATEGORY_ID } from '../../../../shared/constants';
import type {
  CashflowActualTransactionsFilter,
  CashflowTableData,
  DbBudgetAmount,
  DbCashflowComment,
} from '../../../../shared/types';
import type {
  CarryForwardMode,
  CashflowAccountDisplayMode,
  ContextMenuState,
  MonthContextMenuState,
} from '../components/cashflow-types';
import { findLinkedBudgetTarget } from '../lib/cashflow-page-state';
import type { CashflowSectionKey } from '../lib/cashflow-table-model';

const CASHFLOW_COLLAPSED_STORAGE_KEY = 'cashflow-collapsed';
const CASHFLOW_COLLAPSED_SECTIONS_STORAGE_KEY = 'cashflow-collapsed-sections';

type DrilldownState = {
  month: number;
  filter: CashflowActualTransactionsFilter;
};

type CollapsedStateByAccount = Record<string, Record<string, boolean>>;
type CollapsedSectionsByAccount = Record<string, Partial<Record<CashflowSectionKey, boolean>>>;

function parseCollapsedState(): CollapsedStateByAccount {
  try {
    const parsed = JSON.parse(localStorage.getItem(CASHFLOW_COLLAPSED_STORAGE_KEY) ?? '{}');

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const nextState: CollapsedStateByAccount = {};

    for (const [accountKey, accountValue] of Object.entries(parsed)) {
      if (!accountValue || typeof accountValue !== 'object' || Array.isArray(accountValue)) {
        continue;
      }

      const headerState: Record<string, boolean> = {};

      for (const [headerId, isCollapsed] of Object.entries(accountValue)) {
        if (typeof isCollapsed === 'boolean') {
          headerState[headerId] = isCollapsed;
        }
      }

      nextState[accountKey] = headerState;
    }

    return nextState;
  } catch {
    return {};
  }
}

function parseCollapsedSectionsState(): CollapsedSectionsByAccount {
  try {
    const parsed = JSON.parse(localStorage.getItem(CASHFLOW_COLLAPSED_SECTIONS_STORAGE_KEY) ?? '{}');

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const nextState: CollapsedSectionsByAccount = {};

    for (const [accountKey, accountValue] of Object.entries(parsed)) {
      if (!accountValue || typeof accountValue !== 'object' || Array.isArray(accountValue)) {
        continue;
      }

      const sectionState: Partial<Record<CashflowSectionKey, boolean>> = {};

      for (const [sectionKey, isCollapsed] of Object.entries(accountValue)) {
        if (
          (sectionKey === 'income-start'
            || sectionKey === 'fixed-expenses'
            || sectionKey === 'variable-expenses'
            || sectionKey === 'income-end')
          && typeof isCollapsed === 'boolean'
        ) {
          sectionState[sectionKey] = isCollapsed;
        }
      }

      nextState[accountKey] = sectionState;
    }

    return nextState;
  } catch {
    return {};
  }
}

interface LoadCashflowOptions {
  preserveView?: boolean;
}

function getSectionKeyForHierarchyType(type: string): CashflowSectionKey | null {
  if (type === 'income_start') return 'income-start';
  if (type === 'fixed_expense') return 'fixed-expenses';
  if (type === 'variable_expense') return 'variable-expenses';
  if (type === 'income_end') return 'income-end';

  return null;
}

interface UseCashflowAccountControllerArgs {
  accountId: string;
  year: number;
  carryForwardMode: CarryForwardMode;
  showHistoricBudgets: boolean;
  displayMode: CashflowAccountDisplayMode;
  isActive: boolean;
  onSyncLinkedBudget: (targetAccountId: string, targetCategoryId: string, month: number, amount: number) => void;
  onRefreshLinkedAccount: (targetAccountId: string) => Promise<void>;
  onRefreshVisibleAccounts: (originAccountId: string) => Promise<void>;
}

export interface CashflowAccountSectionHandle {
  refresh: () => Promise<void>;
  refreshLinkedBudget: (categoryId: string, month: number, amount: number) => void;
  isSummaryOnly: () => boolean;
  areAllHeadersCollapsed: () => boolean;
  setAllHeadersCollapsed: (next: boolean) => void;
}

export function useCashflowAccountController({
  accountId,
  year,
  carryForwardMode,
  showHistoricBudgets,
  displayMode,
  isActive,
  onSyncLinkedBudget,
  onRefreshLinkedAccount,
  onRefreshVisibleAccounts,
}: UseCashflowAccountControllerArgs) {
  const { confirmProps, confirm } = useConfirm();

  const [data, setData] = useState<CashflowTableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedByAccount, setCollapsedByAccount] = useState<CollapsedStateByAccount>(parseCollapsedState);
  const [collapsedSectionsByAccount, setCollapsedSectionsByAccount] = useState<CollapsedSectionsByAccount>(parseCollapsedSectionsState);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [monthContextMenu, setMonthContextMenu] = useState<MonthContextMenuState | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  const collapsed = accountId ? (collapsedByAccount[accountId] ?? {}) : {};
  const collapsedSections = accountId ? (collapsedSectionsByAccount[accountId] ?? {}) : {};

  const calc = useCashflowCalculations(data, year, accountId, data?.categoryLinks ?? [], carryForwardMode);

  const patchBudgetValue = useCallback((categoryId: string | null, month: number, amount: number) => {
    setData((previousData) => {
      if (!previousData) {
        return previousData;
      }

      const lookupKey = categoryId ?? UNCATEGORISED_CATEGORY_ID;

      return {
        ...previousData,
        budgetLookup: {
          ...previousData.budgetLookup,
          [lookupKey]: {
            ...(previousData.budgetLookup[lookupKey] ?? {}),
            [month]: amount,
          },
        },
      };
    });
  }, []);

  const upsertCommentLocally = useCallback((comment: DbCashflowComment) => {
    setData((previousData) => {
      if (!previousData) {
        return previousData;
      }

      const nextComments = previousData.comments.filter((entry) => entry.id !== comment.id);

      nextComments.push(comment);

      return {
        ...previousData,
        comments: nextComments,
      };
    });
  }, []);

  const deleteCommentLocally = useCallback((commentId: string) => {
    setData((previousData) => {
      if (!previousData) {
        return previousData;
      }

      return {
        ...previousData,
        comments: previousData.comments.filter((entry) => entry.id !== commentId),
      };
    });
  }, []);

  const loadData = useCallback(async (options?: LoadCashflowOptions) => {
    if (!accountId) {
      setData(null);
      setLoading(false);
      return;
    }

    const preserveView = options?.preserveView === true;

    if (!preserveView) {
      setLoading(true);
    }

    try {
      const nextData = await callIpc<CashflowTableData>(
        window.api.cashflow.getTableData(accountId, year),
        'Failed to load cashflow data',
      );

      setData(nextData);
    } catch (error) {
      console.error('Failed to load cashflow data:', toErrorMessage(error));

      if (!preserveView) {
        setData(null);
      }
    } finally {
      if (!preserveView) {
        setLoading(false);
      }
    }
  }, [accountId, year]);

  const refreshData = useCallback(async () => {
    await loadData({ preserveView: true });
  }, [loadData]);

  const handleRefreshVisibleAccounts = useCallback(async () => {
    await onRefreshVisibleAccounts(accountId);
  }, [accountId, onRefreshVisibleAccounts]);

  const handleRefreshLinkedAccount = useCallback(async (categoryId: string) => {
    if (!data || categoryId === UNCATEGORISED_CATEGORY_ID) {
      return;
    }

    const linkedTarget = findLinkedBudgetTarget(accountId, categoryId, data.categoryLinks);

    if (!linkedTarget) {
      return;
    }

    await onRefreshLinkedAccount(linkedTarget.accountId);
  }, [accountId, data, onRefreshLinkedAccount]);

  const saveBudgetValue = useCallback(async (categoryId: string, month: number, amount: number) => {
    if (!accountId) {
      return;
    }

    const persistedCategoryId = categoryId === UNCATEGORISED_CATEGORY_ID ? null : categoryId;

    try {
      const savedBudget = await callIpc<DbBudgetAmount>(
        window.api.budget.upsert(accountId, persistedCategoryId, year, month, amount),
        'Failed to save budget value',
      );

      patchBudgetValue(savedBudget.category_id, savedBudget.month, savedBudget.amount);

      if (savedBudget.category_id) {
        const linkedTarget = findLinkedBudgetTarget(accountId, savedBudget.category_id, data?.categoryLinks ?? []);

        if (linkedTarget) {
          onSyncLinkedBudget(linkedTarget.accountId, linkedTarget.categoryId, savedBudget.month, savedBudget.amount);
        }
      }
    } catch (error) {
      console.error('Failed to save cashflow budget:', toErrorMessage(error));
      throw error;
    }
  }, [accountId, data?.categoryLinks, onSyncLinkedBudget, patchBudgetValue, year]);

  const clearBudgetValue = useCallback(async (categoryId: string, month: number) => {
    await saveBudgetValue(categoryId, month, 0);
  }, [saveBudgetValue]);

  const editing = useCashflowCellEditing(
    data,
    year,
    collapsed,
    collapsedSections,
    saveBudgetValue,
    clearBudgetValue,
    showHistoricBudgets,
  );

  const operations = useCashflowOperations({
    accountId,
    year,
    calc,
    comments: data?.comments ?? [],
    loadData: refreshData,
    upsertCommentLocally,
    deleteCommentLocally,
    confirm,
    setContextMenu,
    setMonthContextMenu,
    onRefreshVisibleAccounts: handleRefreshVisibleAccounts,
    onRefreshLinkedAccount: handleRefreshLinkedAccount,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem(CASHFLOW_COLLAPSED_STORAGE_KEY, JSON.stringify(collapsedByAccount));
  }, [collapsedByAccount]);

  useEffect(() => {
    localStorage.setItem(CASHFLOW_COLLAPSED_SECTIONS_STORAGE_KEY, JSON.stringify(collapsedSectionsByAccount));
  }, [collapsedSectionsByAccount]);

  useEffect(() => {
    if (!data || loading || displayMode === 'summary_only' || !isActive) {
      return;
    }

    const editableCategoryIds = editing.getEditableCategoryIds();
    const editableMonths = editing.getEditableMonths();

    if (editableCategoryIds.length === 0 || editableMonths.length === 0) {
      editing.clearSelection();
      return;
    }

    if (
      !editing.selectedCell
      || !editableCategoryIds.includes(editing.selectedCell.categoryId)
      || !editableMonths.includes(editing.selectedCell.month)
    ) {
      editing.selectCell(editableCategoryIds[0], editableMonths[0]);
    }
  }, [data, displayMode, editing, isActive, loading]);

  useEffect(() => {
    if (displayMode !== 'summary_only') {
      return;
    }

    editing.clearSelection();
    setContextMenu(null);
    setMonthContextMenu(null);
  }, [displayMode, editing]);

  useEffect(() => {
    if (!isActive) {
      editing.clearSelection();
      operations.setCommentDialog(null);
      operations.setEditingCategoryName(null);
      setContextMenu(null);
      setMonthContextMenu(null);
      setDrilldown(null);
      return;
    }

    if (!operations.editingCategoryName && editing.selectedCell && !editing.editingCell) {
      editing.gridRef.current?.focus({ preventScroll: true });
    }
  }, [
    editing,
    isActive,
    operations,
    operations.editingCategoryName,
  ]);

  useEffect(() => {
    if (!isActive || displayMode === 'summary_only') {
      return;
    }

    return window.api.onFillRightShortcut((shift) => {
      if (editing.editingCell || !editing.selectedCell) {
        return;
      }

      const { categoryId, month } = editing.selectedCell;

      if (editing.isEditableMonth(month)) {
        void operations.handleFillRight(categoryId, month, shift ? 'overwrite' : 'empty_only');
      }
    });
  }, [displayMode, editing, isActive, operations]);

  function updateCollapsedState(
    updater: (currentAccountState: Record<string, boolean>) => Record<string, boolean>,
  ) {
    if (!accountId) {
      return;
    }

    setCollapsedByAccount((previousState) => ({
      ...previousState,
      [accountId]: updater(previousState[accountId] ?? {}),
    }));
  }

  function toggleCollapse(headerId: string) {
    updateCollapsedState((previousState) => ({
      ...previousState,
      [headerId]: !previousState[headerId],
    }));
  }

  function updateCollapsedSectionState(
    updater: (currentAccountState: Partial<Record<CashflowSectionKey, boolean>>) => Partial<Record<CashflowSectionKey, boolean>>,
  ) {
    if (!accountId) {
      return;
    }

    setCollapsedSectionsByAccount((previousState) => ({
      ...previousState,
      [accountId]: updater(previousState[accountId] ?? {}),
    }));
  }

  function toggleSectionCollapse(sectionKey: CashflowSectionKey) {
    updateCollapsedSectionState((previousState) => ({
      ...previousState,
      [sectionKey]: !previousState[sectionKey],
    }));
  }

  function areAllHeadersCollapsed(): boolean {
    if (!data || displayMode === 'summary_only') {
      return false;
    }

    const visibleHeaderIds = data.hierarchies
      .filter((hierarchy) => {
        const sectionKey = getSectionKeyForHierarchyType(hierarchy.header.type);

        return sectionKey ? !collapsedSections[sectionKey] : true;
      })
      .map((hierarchy) => hierarchy.header.id);

    return visibleHeaderIds.length > 0 && visibleHeaderIds.every((headerId) => collapsed[headerId]);
  }

  function setAllHeadersCollapsed(next: boolean) {
    if (!data) {
      return;
    }

    const visibleHeaderIds = data.hierarchies
      .filter((hierarchy) => {
        const sectionKey = getSectionKeyForHierarchyType(hierarchy.header.type);

        return sectionKey ? !collapsedSections[sectionKey] : true;
      })
      .map((hierarchy) => hierarchy.header.id);

    updateCollapsedState((previousState) => {
      const nextCollapsedState = { ...previousState };

      for (const headerId of visibleHeaderIds) {
        nextCollapsedState[headerId] = next;
      }

      return nextCollapsedState;
    });
  }

  function handleOpenContextMenu(categoryId: string, month: number, x: number, y: number) {
    setContextMenu({ categoryId, month, x, y });
  }

  function handleDrilldown(month: number, filter: CashflowActualTransactionsFilter) {
    setDrilldown({ month, filter });
  }

  function handleOpenMonthContextMenu(month: number, x: number, y: number) {
    setMonthContextMenu({ month, x, y });
  }

  function handleCloseDrilldown() {
    setDrilldown(null);
  }

  function handleCloseCommentDialog() {
    operations.setCommentDialog(null);
  }

  function handleCloseContextMenu() {
    setContextMenu(null);
  }

  function handleCloseMonthContextMenu() {
    setMonthContextMenu(null);
  }

  function handleGridKeyDown(event: React.KeyboardEvent) {
    if (!isActive || displayMode === 'summary_only' || editing.editingCell || !editing.selectedCell) {
      return;
    }

    const { categoryId, month } = editing.selectedCell;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();

      const direction = event.key === 'ArrowUp'
        ? 'up'
        : event.key === 'ArrowDown'
          ? 'down'
          : event.key === 'ArrowLeft'
            ? 'left'
            : 'right';

      editing.navigateCell(categoryId, month, direction);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (calc) {
        editing.startEdit(categoryId, month, calc.getBudget(categoryId, month));
      }

      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      editing.navigateCell(categoryId, month, event.shiftKey ? 'left' : 'right');
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();

      if (editing.isEditableMonth(month)) {
        editing.clearBudget(categoryId, month);
      }

      return;
    }

    if (/^[\d.-]$/.test(event.key)) {
      event.preventDefault();
      editing.startEditFromTyping(categoryId, month, event.key);
    }
  }

  function refreshLinkedBudget(categoryId: string, month: number, amount: number) {
    patchBudgetValue(categoryId, month, amount);
    void refreshData();
  }

  return {
    accountId,
    calc,
    loading,
    collapsed,
    collapsedSections,
    contextMenu,
    monthContextMenu,
    drilldown,
    confirmProps,
    editing,
    operations,
    refreshData,
    refreshLinkedBudget,
    areAllHeadersCollapsed,
    setAllHeadersCollapsed,
    toggleCollapse,
    toggleSectionCollapse,
    handleOpenContextMenu,
    handleDrilldown,
    handleOpenMonthContextMenu,
    handleCloseDrilldown,
    handleCloseCommentDialog,
    handleCloseContextMenu,
    handleCloseMonthContextMenu,
    handleGridKeyDown,
  };
}
