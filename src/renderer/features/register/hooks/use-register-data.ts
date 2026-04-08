import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CategoryHeaderType,
  DbTransaction,
  RegisterViewData,
  TransactionWithCategory,
} from '../../../../shared/types';
import { callIpc, toErrorMessage } from '../../../lib/ipc-client';
import { useConfirm } from '../../../hooks/use-confirm';
import { findCategoryInfo } from '../../../components/ui/category-picker';
import { buildRegisterViewModel } from '../lib/register-view-model';
import type { RegisterFilterState } from '../lib/register-view-model';

interface UseRegisterDataArgs {
  accountId: string;
  year: number;
  month: number;
  filters: RegisterFilterState;
}

export function useRegisterData({ accountId, year, month, filters }: UseRegisterDataArgs) {
  const { confirmProps, confirm } = useConfirm();
  const [viewData, setViewData] = useState<RegisterViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const registerViewModel = useMemo(
    () => (viewData ? buildRegisterViewModel(viewData, filters) : null),
    [filters, viewData],
  );

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  const reportError = useCallback((nextError: unknown, fallbackMessage: string) => {
    setError(toErrorMessage(nextError, fallbackMessage));
  }, []);

  const loadData = useCallback(async () => {
    if (!accountId) {
      setViewData(null);
      setLoading(false);
      return;
    }

    if (!initialLoadDone.current) {
      setLoading(true);
    }

    try {
      const nextViewData = await callIpc<RegisterViewData>(
        window.api.register.getViewData(accountId, year, month),
        'Failed to load register data',
      );
      setViewData(nextViewData);
      setError(null);
    } catch (loadError) {
      console.error('Failed to load register data:', toErrorMessage(loadError));
      setError(toErrorMessage(loadError, 'Failed to load register data'));
      setViewData(null);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [accountId, month, year]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const buildCategoryFields = useCallback(
    (categoryId: string | null) => {
      const info = findCategoryInfo(viewData?.categories ?? [], categoryId);

      return {
        category_name: info.name,
        category_colour: info.colour,
        category_type: info.type as CategoryHeaderType | null,
      };
    },
    [viewData?.categories],
  );

  const patchTransaction = useCallback(
    (
      id: string,
      updater: (transaction: TransactionWithCategory) => TransactionWithCategory,
    ) => {
      setViewData((previousValue) => {
        if (!previousValue) {
          return previousValue;
        }

        return {
          ...previousValue,
          transactions: previousValue.transactions.map((transaction) =>
            transaction.id === id ? updater(transaction) : transaction),
        };
      });
    },
    [],
  );

  const removeTransaction = useCallback((id: string) => {
    setViewData((previousValue) => {
      if (!previousValue) {
        return previousValue;
      }

      return {
        ...previousValue,
        transactions: previousValue.transactions.filter((transaction) => transaction.id !== id),
      };
    });
  }, []);

  const appendTransaction = useCallback((transaction: TransactionWithCategory) => {
    setViewData((previousValue) => {
      if (!previousValue) {
        return previousValue;
      }

      return {
        ...previousValue,
        transactions: [...previousValue.transactions, transaction],
      };
    });
  }, []);

  const handleUpdateTransaction = useCallback(
    async (
      id: string,
      data: {
        date: number;
        description: string;
        category_id: string | null;
        delta_value: number;
      },
    ): Promise<boolean> => {
      try {
        const savedTransaction = await callIpc<DbTransaction>(
          window.api.transactions.update(id, data),
          'Failed to update transaction',
        );

        patchTransaction(id, (transaction) => ({
          ...transaction,
          ...savedTransaction,
          ...buildCategoryFields(savedTransaction.category_id),
        }));
        setError(null);
        return true;
      } catch (updateError) {
        reportError(updateError, 'Failed to update transaction');
        return false;
      }
    },
    [buildCategoryFields, patchTransaction, reportError],
  );

  const handleUpdateNote = useCallback(
    async (id: string, note: string | null): Promise<boolean> => {
      try {
        const savedTransaction = await callIpc<DbTransaction>(
          window.api.transactions.updateNote(id, note),
          'Failed to update note',
        );

        patchTransaction(id, (transaction) => ({
          ...transaction,
          ...savedTransaction,
          ...buildCategoryFields(savedTransaction.category_id),
        }));
        setError(null);
        return true;
      } catch (updateError) {
        reportError(updateError, 'Failed to update note');
        return false;
      }
    },
    [buildCategoryFields, patchTransaction, reportError],
  );

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      confirm({
        title: 'Delete Transaction',
        message: 'Are you sure you want to delete this transaction?',
        onConfirm: async () => {
          try {
            const deleted = await callIpc(
              window.api.transactions.delete(id),
              'Failed to delete transaction',
            );

            if (!deleted) {
              return;
            }

            removeTransaction(id);
            setError(null);
          } catch (deleteError) {
            reportError(deleteError, 'Failed to delete transaction');
          }
        },
      });
    },
    [confirm, removeTransaction, reportError],
  );

  const handleToggleFlag = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const savedTransaction = await callIpc<DbTransaction>(
          window.api.transactions.toggleFlag(id),
          'Failed to toggle transaction flag',
        );

        patchTransaction(id, (transaction) => ({
          ...transaction,
          ...savedTransaction,
          ...buildCategoryFields(savedTransaction.category_id),
        }));
        setError(null);
        return true;
      } catch (toggleError) {
        reportError(toggleError, 'Failed to toggle transaction flag');
        return false;
      }
    },
    [buildCategoryFields, patchTransaction, reportError],
  );

  const handleCreateTransaction = useCallback(
    async (data: {
      date: number;
      description: string;
      category_id: string | null;
      delta_value: number;
      user_note: string | null;
    }): Promise<boolean> => {
      if (!accountId) {
        return false;
      }

      try {
        const createdTransaction = await callIpc<DbTransaction>(
          window.api.transactions.create(accountId, {
            date: data.date,
            description: data.description,
            category_id: data.category_id,
            delta_value: data.delta_value,
          }),
          'Failed to create transaction',
        );

        let transactionWithNote = createdTransaction;

        if (data.user_note) {
          transactionWithNote = await callIpc<DbTransaction>(
            window.api.transactions.updateNote(createdTransaction.id, data.user_note),
            'Failed to save transaction note',
          );
        }

        appendTransaction({
          ...transactionWithNote,
          ...buildCategoryFields(transactionWithNote.category_id),
        });
        setError(null);
        return true;
      } catch (createError) {
        reportError(createError, 'Failed to create transaction');
        return false;
      }
    },
    [accountId, appendTransaction, buildCategoryFields, reportError],
  );

  return {
    viewData,
    registerViewModel,
    loading,
    error,
    confirmProps,
    dismissError,
    reportError,
    loadData,
    handleUpdateTransaction,
    handleUpdateNote,
    handleDeleteTransaction,
    handleToggleFlag,
    handleCreateTransaction,
  };
}
