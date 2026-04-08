import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccountsStore } from '../../../stores/accounts-store';
import { useSettingsStore } from '../../../stores/settings-store';
import type { CashflowAccountDisplayMode, CarryForwardMode } from '../components/cashflow-types';
import type { CashflowAccountSectionHandle } from './use-cashflow-account-controller';
import {
  filterSelectedAccountIds,
  getCollapseAllTarget,
  getInitialSelectedAccountIds,
  toggleSelectedAccountIds,
} from '../lib/cashflow-page-state';

const CASHFLOW_SELECTED_ACCOUNTS_STORAGE_KEY = 'cashflow-selected-account-ids';
const CASHFLOW_ACCOUNT_DISPLAY_MODE_STORAGE_KEY = 'cashflow-account-display-mode';

type AccountDisplayModeById = Record<string, CashflowAccountDisplayMode>;

function parseStoredSelectedAccountIds(): string[] | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CASHFLOW_SELECTED_ACCOUNTS_STORAGE_KEY) ?? 'null');

    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : null;
  } catch {
    return null;
  }
}

function parseStoredDisplayModes(): AccountDisplayModeById {
  try {
    const parsed = JSON.parse(localStorage.getItem(CASHFLOW_ACCOUNT_DISPLAY_MODE_STORAGE_KEY) ?? '{}');

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const nextState: AccountDisplayModeById = {};

    for (const [accountId, displayMode] of Object.entries(parsed)) {
      if (displayMode === 'full' || displayMode === 'summary_only') {
        nextState[accountId] = displayMode;
      }
    }

    return nextState;
  } catch {
    return {};
  }
}

export function useCashflowPageController() {
  const params = useParams();
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading } = useAccountsStore();
  const { currencySymbol } = useSettingsStore();
  const sectionHandlesRef = useRef(new Map<string, CashflowAccountSectionHandle>());
  const rememberedSelectedAccountIdsRef = useRef<string[] | null>(parseStoredSelectedAccountIds());
  const [year, setYear] = useState(params.year ? parseInt(params.year, 10) : new Date().getFullYear());
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  const [showHistoricBudgets, setShowHistoricBudgets] = useState(false);
  const [carryForwardMode, setCarryForwardMode] = useState<CarryForwardMode>('hybrid');
  const [linkedCategoriesOpen, setLinkedCategoriesOpen] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState('');
  const [accountDisplayModeById, setAccountDisplayModeById] = useState<AccountDisplayModeById>(parseStoredDisplayModes);

  const availableAccountIds = useMemo(() => accounts.map((account) => account.id), [accounts]);

  const selectedAccounts = useMemo(() => {
    const selectedIdSet = new Set(selectedAccountIds);

    return accounts.filter((account) => selectedIdSet.has(account.id));
  }, [accounts, selectedAccountIds]);

  useEffect(() => {
    if (params.year) {
      setYear(parseInt(params.year, 10));
    }
  }, [params.year]);

  useEffect(() => {
    if (!selectionReady) {
      setSelectedAccountIds(getInitialSelectedAccountIds(availableAccountIds, rememberedSelectedAccountIdsRef.current));
      setSelectionReady(true);
      return;
    }

    setSelectedAccountIds((currentSelectedAccountIds) => {
      const filteredIds = filterSelectedAccountIds(currentSelectedAccountIds, availableAccountIds);

      return filteredIds.length > 0 || availableAccountIds.length === 0
        ? filteredIds
        : [...availableAccountIds];
    });
  }, [availableAccountIds, selectionReady]);

  useEffect(() => {
    if (!selectionReady) {
      return;
    }

    localStorage.setItem(CASHFLOW_SELECTED_ACCOUNTS_STORAGE_KEY, JSON.stringify(selectedAccountIds));
  }, [selectedAccountIds, selectionReady]);

  useEffect(() => {
    localStorage.setItem(CASHFLOW_ACCOUNT_DISPLAY_MODE_STORAGE_KEY, JSON.stringify(accountDisplayModeById));
  }, [accountDisplayModeById]);

  useEffect(() => {
    if (selectedAccountIds.length === 0) {
      setActiveAccountId('');
      return;
    }

    if (!selectedAccountIds.includes(activeAccountId)) {
      setActiveAccountId(selectedAccountIds[0]);
    }
  }, [activeAccountId, selectedAccountIds]);

  const registerSection = useCallback((accountId: string, handle: CashflowAccountSectionHandle) => {
    sectionHandlesRef.current.set(accountId, handle);

    return () => {
      sectionHandlesRef.current.delete(accountId);
    };
  }, []);

  const refreshVisibleAccounts = useCallback(async (originAccountId?: string) => {
    const refreshTasks: Promise<void>[] = [];

    for (const accountId of selectedAccountIds) {
      if (originAccountId && accountId === originAccountId) {
        continue;
      }

      const sectionHandle = sectionHandlesRef.current.get(accountId);

      if (sectionHandle) {
        refreshTasks.push(sectionHandle.refresh());
      }
    }

    await Promise.all(refreshTasks);
  }, [selectedAccountIds]);

  const syncLinkedBudget = useCallback((targetAccountId: string, targetCategoryId: string, month: number, amount: number) => {
    const targetSectionHandle = sectionHandlesRef.current.get(targetAccountId);

    if (!targetSectionHandle) {
      return;
    }

    targetSectionHandle.refreshLinkedBudget(targetCategoryId, month, amount);
  }, []);

  const refreshLinkedAccount = useCallback(async (targetAccountId: string) => {
    const targetSectionHandle = sectionHandlesRef.current.get(targetAccountId);

    if (targetSectionHandle) {
      await targetSectionHandle.refresh();
    }
  }, []);

  const changeYear = useCallback((delta: number) => {
    const nextYear = year + delta;

    setYear(nextYear);
    navigate(`/cashflow/${nextYear}`);
  }, [navigate, year]);

  const toggleAccount = useCallback((accountId: string) => {
    setSelectedAccountIds((currentSelectedAccountIds) => {
      const nextSelectedAccountIds = toggleSelectedAccountIds(currentSelectedAccountIds, accountId, availableAccountIds);

      if (!currentSelectedAccountIds.includes(accountId) && nextSelectedAccountIds.includes(accountId)) {
        setActiveAccountId(accountId);
      }

      return nextSelectedAccountIds;
    });
  }, [availableAccountIds]);

  const toggleAccountDisplayMode = useCallback((accountId: string) => {
    setAccountDisplayModeById((previousModes) => ({
      ...previousModes,
      [accountId]: previousModes[accountId] === 'summary_only' ? 'full' : 'summary_only',
    }));
  }, []);

  const openLinkedCategories = useCallback(() => {
    setLinkedCategoriesOpen(true);
  }, []);

  const closeLinkedCategories = useCallback(() => {
    setLinkedCategoriesOpen(false);
  }, []);

  const toggleCollapseAllVisible = useCallback(() => {
    const visibleSections = selectedAccountIds
      .map((accountId) => sectionHandlesRef.current.get(accountId))
      .filter((sectionHandle): sectionHandle is CashflowAccountSectionHandle => sectionHandle !== undefined);

    const targetCollapsedState = getCollapseAllTarget(visibleSections.map((sectionHandle) => ({
      isSummaryOnly: sectionHandle.isSummaryOnly(),
      areAllHeadersCollapsed: sectionHandle.areAllHeadersCollapsed(),
    })));

    for (const sectionHandle of visibleSections) {
      if (!sectionHandle.isSummaryOnly()) {
        sectionHandle.setAllHeadersCollapsed(targetCollapsedState);
      }
    }
  }, [selectedAccountIds]);

  function handleToggleHistoricBudgets() {
    setShowHistoricBudgets((previousValue) => !previousValue);
  }

  function handleCarryForwardModeChange(mode: CarryForwardMode) {
    setCarryForwardMode(mode);
  }

  return {
    accounts,
    accountsLoading,
    currencySymbol,
    year,
    selectedAccountIds,
    selectedAccounts,
    selectionReady,
    showHistoricBudgets,
    carryForwardMode,
    linkedCategoriesOpen,
    activeAccountId,
    accountDisplayModeById,
    changeYear,
    toggleAccount,
    toggleAccountDisplayMode,
    setActiveAccountId,
    openLinkedCategories,
    closeLinkedCategories,
    toggleCollapseAllVisible,
    handleToggleHistoricBudgets,
    handleCarryForwardModeChange,
    registerSection,
    refreshVisibleAccounts,
    refreshLinkedAccount,
    syncLinkedBudget,
  };
}
