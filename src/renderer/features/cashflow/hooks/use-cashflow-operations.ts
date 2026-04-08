import { useCallback, useMemo, useState } from 'react';
import { UNCATEGORISED_CATEGORY_ID } from '../../../../shared/constants';
import type { DbCashflowComment } from '../../../../shared/types';
import { callIpc, toErrorMessage } from '../../../lib/ipc-client';
import type { ContextMenuState, EditingCategoryName, MonthContextMenuState } from '../components/cashflow-types';
import type { CashflowCalculations } from './use-cashflow-calculations';

interface ConfirmFn {
  (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  }): void;
}

interface UseCashflowOperationsArgs {
  accountId: string;
  year: number;
  calc: CashflowCalculations | null;
  comments: DbCashflowComment[];
  loadData: () => Promise<void>;
  upsertCommentLocally: (comment: DbCashflowComment) => void;
  deleteCommentLocally: (commentId: string) => void;
  confirm: ConfirmFn;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  setMonthContextMenu: React.Dispatch<React.SetStateAction<MonthContextMenuState | null>>;
  onRefreshVisibleAccounts?: () => Promise<void> | void;
  onRefreshLinkedAccount?: (categoryId: string, month: number) => Promise<void> | void;
}

export interface CashflowOperations {
  editingCategoryName: EditingCategoryName | null;
  setEditingCategoryName: React.Dispatch<React.SetStateAction<EditingCategoryName | null>>;
  commentDialog: { categoryId: string; month: number; text: string } | null;
  setCommentDialog: React.Dispatch<React.SetStateAction<{ categoryId: string; month: number; text: string } | null>>;
  commentLookup: Map<string, DbCashflowComment>;
  getComment: (categoryId: string, month: number) => string | null;
  handleFillRight: (categoryId: string, month: number, mode: 'overwrite' | 'empty_only') => Promise<void>;
  handleCopyFromPreviousMonth: (month: number, mode: 'overwrite' | 'empty_only') => Promise<void>;
  handleRenameCategorySubmit: () => Promise<void>;
  handleClearBudgetMonth: (month: number) => void;
  handleOpenCommentDialog: (categoryId: string, month: number) => void;
  handleSaveComment: (text: string) => Promise<void>;
  handleDeleteComment: (categoryId: string, month: number) => Promise<void>;
}

export function useCashflowOperations({
  accountId,
  year,
  calc,
  comments,
  loadData,
  upsertCommentLocally,
  deleteCommentLocally,
  confirm,
  setContextMenu,
  setMonthContextMenu,
  onRefreshVisibleAccounts,
  onRefreshLinkedAccount,
}: UseCashflowOperationsArgs): CashflowOperations {
  const [editingCategoryName, setEditingCategoryName] = useState<EditingCategoryName | null>(null);
  const [commentDialog, setCommentDialog] = useState<{ categoryId: string; month: number; text: string } | null>(null);

  const commentLookup = useMemo(() => {
    const map = new Map<string, DbCashflowComment>();

    for (const comment of comments) {
      const categoryKey = comment.category_id ?? UNCATEGORISED_CATEGORY_ID;
      map.set(`${categoryKey}|${comment.month}`, comment);
    }

    return map;
  }, [comments]);

  const getComment = useCallback(
    (categoryId: string, month: number): string | null => commentLookup.get(`${categoryId}|${month}`)?.comment ?? null,
    [commentLookup],
  );

  const handleFillRight = useCallback(
    async (categoryId: string, month: number, mode: 'overwrite' | 'empty_only') => {
      if (!calc) {
        return;
      }

      const amount = calc.getBudget(categoryId, month);
      const persistedCategoryId = categoryId === UNCATEGORISED_CATEGORY_ID ? null : categoryId;

      try {
        await callIpc(
          window.api.budget.fillRight(accountId, persistedCategoryId, year, month, amount, mode),
          'Failed to fill budget values to the right',
        );
        setContextMenu(null);
        await loadData();
        await onRefreshLinkedAccount?.(categoryId, month);
      } catch (error) {
        console.error('Failed to fill cashflow budget values:', toErrorMessage(error));
      }
    },
    [accountId, calc, loadData, onRefreshLinkedAccount, setContextMenu, year],
  );

  const handleCopyFromPreviousMonth = useCallback(
    async (month: number, mode: 'overwrite' | 'empty_only') => {
      try {
        await callIpc(
          window.api.budget.copyFromPreviousMonth(accountId, year, month, mode),
          'Failed to copy budgets from the previous month',
        );
        setContextMenu(null);
        setMonthContextMenu(null);
        await loadData();
        await onRefreshVisibleAccounts?.();
      } catch (error) {
        console.error('Failed to copy cashflow budgets from previous month:', toErrorMessage(error));
      }
    },
    [accountId, loadData, onRefreshVisibleAccounts, setContextMenu, setMonthContextMenu, year],
  );

  const handleRenameCategorySubmit = useCallback(async () => {
    if (!editingCategoryName) {
      return;
    }

    const newName = editingCategoryName.name.trim();

    try {
      if (newName) {
        await callIpc(
          window.api.categories.update(editingCategoryName.id, { name: newName }),
          'Failed to rename category',
        );
        await loadData();
        await onRefreshVisibleAccounts?.();
      }
    } catch (error) {
      console.error('Failed to rename cashflow category:', toErrorMessage(error));
    } finally {
      setEditingCategoryName(null);
    }
  }, [editingCategoryName, loadData, onRefreshVisibleAccounts]);

  const handleClearBudgetMonth = useCallback(
    (month: number) => {
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

      setMonthContextMenu(null);
      confirm({
        title: 'Clear Budget',
        message: `Are you sure you want to clear all budget values for ${monthName} ${year}? This cannot be undone.`,
        confirmLabel: 'Clear',
        onConfirm: async () => {
          try {
            await callIpc(
              window.api.budget.clearMonth(accountId, year, month),
              'Failed to clear budget month',
            );
            await loadData();
            await onRefreshVisibleAccounts?.();
          } catch (error) {
            console.error('Failed to clear cashflow budget month:', toErrorMessage(error));
          }
        },
      });
    },
    [accountId, confirm, loadData, onRefreshVisibleAccounts, setMonthContextMenu, year],
  );

  const handleOpenCommentDialog = useCallback(
    (categoryId: string, month: number) => {
      const existingComment = getComment(categoryId, month);

      setCommentDialog({ categoryId, month, text: existingComment ?? '' });
      setContextMenu(null);
    },
    [getComment, setContextMenu],
  );

  const handleSaveComment = useCallback(
    async (text: string) => {
      if (!commentDialog) {
        return;
      }

      const persistedCategoryId =
        commentDialog.categoryId === UNCATEGORISED_CATEGORY_ID ? null : commentDialog.categoryId;

      try {
        const savedComment = await callIpc<DbCashflowComment>(
          window.api.cashflowComments.upsert(accountId, persistedCategoryId, year, commentDialog.month, text),
          'Failed to save cashflow comment',
        );
        upsertCommentLocally(savedComment);
        setCommentDialog(null);
      } catch (error) {
        console.error('Failed to save cashflow comment:', toErrorMessage(error));
      }
    },
    [accountId, commentDialog, upsertCommentLocally, year],
  );

  const handleDeleteComment = useCallback(
    async (categoryId: string, month: number) => {
      const entry = commentLookup.get(`${categoryId}|${month}`);

      if (!entry) {
        return;
      }

      try {
        await callIpc(
          window.api.cashflowComments.delete(entry.id),
          'Failed to delete cashflow comment',
        );
        deleteCommentLocally(entry.id);
        setContextMenu(null);
      } catch (error) {
        console.error('Failed to delete cashflow comment:', toErrorMessage(error));
      }
    },
    [commentLookup, deleteCommentLocally, setContextMenu],
  );

  return {
    editingCategoryName,
    setEditingCategoryName,
    commentDialog,
    setCommentDialog,
    commentLookup,
    getComment,
    handleFillRight,
    handleCopyFromPreviousMonth,
    handleRenameCategorySubmit,
    handleClearBudgetMonth,
    handleOpenCommentDialog,
    handleSaveComment,
    handleDeleteComment,
  };
}
