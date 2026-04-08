import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettingsStore } from '../../../stores/settings-store';
import { useRegisterData } from './use-register-data';
import { useRegisterFilters } from './use-register-filters';
import { useRegisterWorkflows } from './use-register-workflows';

export function useRegisterController() {
  const params = useParams();
  const navigate = useNavigate();
  const { currencySymbol } = useSettingsStore();

  const accountId = params.accountId ?? '';
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(params.year ? parseInt(params.year, 10) : currentYear);
  const [month, setMonth] = useState(params.month ? parseInt(params.month, 10) : currentMonth);

  const filters = useRegisterFilters();
  const data = useRegisterData({ accountId, year, month, filters: filters.filters });
  const workflows = useRegisterWorkflows({ accountId, reportError: data.reportError });

  useEffect(() => {
    if (accountId && !params.year) {
      navigate(`/accounts/${accountId}/${currentYear}/${currentMonth}`, { replace: true });
    }
  }, [accountId, currentMonth, currentYear, navigate, params.year]);

  useEffect(() => {
    if (params.year) {
      setYear(parseInt(params.year, 10));
    }

    if (params.month) {
      setMonth(parseInt(params.month, 10));
    }
  }, [params.month, params.year]);

  function navigateMonth(delta: number) {
    let nextMonth = month + delta;
    let nextYear = year;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    navigate(`/accounts/${accountId}/${nextYear}/${nextMonth}`);
  }

  function handleNavigateTo(nextYear: number, nextMonth: number) {
    navigate(`/accounts/${accountId}/${nextYear}/${nextMonth}`);
  }

  return {
    accountId,
    year,
    month,
    currencySymbol,
    viewData: data.viewData,
    registerViewModel: data.registerViewModel,
    loading: data.loading,
    error: data.error,
    dismissError: data.dismissError,
    filters,
    importOpen: workflows.importOpen,
    dragOver: workflows.dragOver,
    dragFileContent: workflows.dragFileContent,
    dragFileName: workflows.dragFileName,
    autoCategoriseOpen: workflows.autoCategoriseOpen,
    importHistoryOpen: workflows.importHistoryOpen,
    quickRuleOpen: workflows.quickRuleOpen,
    quickRuleDefaults: workflows.quickRuleDefaults,
    quickRuleEdit: workflows.quickRuleEdit,
    confirmProps: data.confirmProps,
    loadData: data.loadData,
    navigateMonth,
    handleNavigateTo,
    handleUpdateTransaction: data.handleUpdateTransaction,
    handleUpdateNote: data.handleUpdateNote,
    handleDeleteTransaction: data.handleDeleteTransaction,
    handleToggleFlag: data.handleToggleFlag,
    handleCreateTransaction: data.handleCreateTransaction,
    openRuleForEdit: workflows.openRuleForEdit,
    handleCreateRule: workflows.handleCreateRule,
    handleDragOver: workflows.handleDragOver,
    handleDragLeave: workflows.handleDragLeave,
    handleDrop: workflows.handleDrop,
    handleOpenAutoCategorise: workflows.handleOpenAutoCategorise,
    handleOpenImport: workflows.handleOpenImport,
    handleOpenImportHistory: workflows.handleOpenImportHistory,
    handleImportClose: workflows.handleImportClose,
    handleImportHistoryClose: workflows.handleImportHistoryClose,
    handleAutoCategoriseClose: workflows.handleAutoCategoriseClose,
    handleQuickRuleClose: workflows.handleQuickRuleClose,
    handleQuickRuleSave: workflows.handleQuickRuleSave,
  };
}
