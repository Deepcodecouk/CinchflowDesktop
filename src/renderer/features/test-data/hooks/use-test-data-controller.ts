import { useCallback, useEffect, useState } from 'react';
import { useAccountsStore } from '../../../stores/accounts-store';
import { callIpc, toErrorMessage } from '../../../lib/ipc-client';
import type {
  CreateTestDataResult,
  RemoveTestDataResult,
  TestDataStatus,
} from '../../../../shared/types';

type TestDataAction = 'create' | 'remove' | null;

interface TestDataController {
  action: TestDataAction;
  errorMessage: string | null;
  loadStatus: () => Promise<void>;
  removeTestData: () => Promise<void>;
  createTestData: () => Promise<void>;
  status: TestDataStatus | null;
  statusMessage: string | null;
}

function buildCreateMessage(result: CreateTestDataResult): string {
  return [
    `Created ${result.accountsCreated} sample accounts`,
    `${result.categoriesCreated} categories`,
    `${result.rulesCreated} rules`,
    `${result.transactionsCreated} transactions`,
    `${result.budgetsCreated} forecast entries`,
  ].join(', ') + '.';
}

function buildRemoveMessage(result: RemoveTestDataResult): string {
  return `Removed ${result.accountsRemoved} sample account${result.accountsRemoved === 1 ? '' : 's'} and all related data.`;
}

export function useTestDataController(): TestDataController {
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);
  const [status, setStatus] = useState<TestDataStatus | null>(null);
  const [action, setAction] = useState<TestDataAction>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const nextStatus = await callIpc<TestDataStatus>(
        window.api.testData.getStatus(),
        'Failed to load sample test data status',
      );
      setStatus(nextStatus);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to load sample test data status'));
    }
  }, []);

  useEffect(() => {
    loadStatus().catch(() => undefined);
  }, [loadStatus]);

  const createTestData = useCallback(async () => {
    setAction('create');
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const result = await callIpc<CreateTestDataResult>(
        window.api.testData.create(),
        'Failed to create sample test data',
      );
      await fetchAccounts();
      await loadStatus();
      setStatusMessage(buildCreateMessage(result));
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to create sample test data'));
    } finally {
      setAction(null);
    }
  }, [fetchAccounts, loadStatus]);

  const removeTestData = useCallback(async () => {
    setAction('remove');
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const result = await callIpc<RemoveTestDataResult>(
        window.api.testData.remove(),
        'Failed to remove sample test data',
      );
      await fetchAccounts();
      await loadStatus();
      setStatusMessage(buildRemoveMessage(result));
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to remove sample test data'));
    } finally {
      setAction(null);
    }
  }, [fetchAccounts, loadStatus]);

  return {
    action,
    errorMessage,
    loadStatus,
    removeTestData,
    createTestData,
    status,
    statusMessage,
  };
}
