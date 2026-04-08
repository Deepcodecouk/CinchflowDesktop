import { useCallback, useState } from 'react';
import type { DbCategorisationRule, TransactionWithCategory } from '../../../../shared/types';
import { callIpc } from '../../../lib/ipc-client';

interface RegisterQuickRuleDefaults {
  match_text: string;
  match_type: 'starts_with';
  min_amount: number | null;
  max_amount: number | null;
  category_id?: string;
}

interface UseRegisterWorkflowsArgs {
  accountId: string;
  reportError: (error: unknown, fallbackMessage: string) => void;
}

export function useRegisterWorkflows({ accountId, reportError }: UseRegisterWorkflowsArgs) {
  const [importOpen, setImportOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragFileContent, setDragFileContent] = useState<string | undefined>();
  const [dragFileName, setDragFileName] = useState<string | undefined>();
  const [autoCategoriseOpen, setAutoCategoriseOpen] = useState(false);
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  const [quickRuleOpen, setQuickRuleOpen] = useState(false);
  const [quickRuleDefaults, setQuickRuleDefaults] = useState<RegisterQuickRuleDefaults | undefined>();
  const [quickRuleEdit, setQuickRuleEdit] = useState<DbCategorisationRule | null>(null);

  const openRuleForEdit = useCallback(
    async (ruleId: string) => {
      try {
        const rule = await callIpc<DbCategorisationRule>(
          window.api.rules.findById(ruleId),
          'Failed to load categorisation rule',
        );

        setQuickRuleEdit(rule);
        setQuickRuleDefaults(undefined);
        setQuickRuleOpen(true);
      } catch (loadError) {
        reportError(loadError, 'Failed to load categorisation rule');
      }
    },
    [reportError],
  );

  const handleCreateRule = useCallback(
    (transaction: TransactionWithCategory) => {
      if (transaction.categorised_by_rule_id) {
        void openRuleForEdit(transaction.categorised_by_rule_id);
        return;
      }

      const absAmount = Math.abs(transaction.delta_value);
      setQuickRuleEdit(null);
      setQuickRuleDefaults({
        match_text: transaction.description,
        match_type: 'starts_with',
        min_amount: Math.floor(absAmount * 0.75),
        max_amount: Math.ceil(absAmount * 1.25),
        category_id: transaction.category_id ?? undefined,
      });
      setQuickRuleOpen(true);
    },
    [openRuleForEdit],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (event.dataTransfer.types.includes('Files')) {
      setDragOver(true);
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;

    if (files.length === 0) {
      return;
    }

    const file = files[0];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!['.csv', '.ofx', '.qfx'].includes(extension)) {
      return;
    }

    const content = await file.text();
    setDragFileContent(content);
    setDragFileName(file.name);
    setImportOpen(true);
  }, []);

  const handleOpenAutoCategorise = useCallback(() => {
    setAutoCategoriseOpen(true);
  }, []);

  const handleOpenImport = useCallback(() => {
    setImportOpen(true);
  }, []);

  const handleOpenImportHistory = useCallback(() => {
    setImportHistoryOpen(true);
  }, []);

  const handleImportClose = useCallback(() => {
    setImportOpen(false);
    setDragFileContent(undefined);
    setDragFileName(undefined);
  }, []);

  const handleImportHistoryClose = useCallback(() => {
    setImportHistoryOpen(false);
  }, []);

  const handleAutoCategoriseClose = useCallback(() => {
    setAutoCategoriseOpen(false);
  }, []);

  const handleQuickRuleClose = useCallback(() => {
    setQuickRuleOpen(false);
    setQuickRuleDefaults(undefined);
    setQuickRuleEdit(null);
  }, []);

  const handleQuickRuleSave = useCallback(
    async (data: Parameters<typeof window.api.rules.create>[1]) => {
      try {
        if (quickRuleEdit) {
          await callIpc(
            window.api.rules.update(quickRuleEdit.id, data),
            'Failed to update categorisation rule',
          );
          return;
        }

        await callIpc(
          window.api.rules.create(accountId, data),
          'Failed to create categorisation rule',
        );
      } catch (saveError) {
        reportError(saveError, 'Failed to save categorisation rule');
        throw saveError;
      }
    },
    [accountId, quickRuleEdit, reportError],
  );

  return {
    importOpen,
    dragOver,
    dragFileContent,
    dragFileName,
    autoCategoriseOpen,
    importHistoryOpen,
    quickRuleOpen,
    quickRuleDefaults,
    quickRuleEdit,
    openRuleForEdit,
    handleCreateRule,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleOpenAutoCategorise,
    handleOpenImport,
    handleOpenImportHistory,
    handleImportClose,
    handleImportHistoryClose,
    handleAutoCategoriseClose,
    handleQuickRuleClose,
    handleQuickRuleSave,
  };
}
