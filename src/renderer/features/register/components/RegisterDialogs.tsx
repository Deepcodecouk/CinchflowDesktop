import type { CategoryHierarchy, DbCategorisationRule } from '../../../../shared/types';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { RuleFormDialog } from '../../../components/settings/RuleFormDialog';
import type { RegisterFilterActions, RegisterFilters } from '../hooks/use-register-filters';
import { AutoCategoriseDialog } from './AutoCategoriseDialog';
import { FilterDropdown } from './FilterDropdown';
import { ImportHistoryDialog } from './ImportHistoryDialog';
import { ImportWizardDialog } from './ImportWizardDialog';

interface RegisterDialogsProps {
  accountId: string;
  year: number;
  month: number;
  categories: CategoryHierarchy[];
  loadData: () => Promise<void>;
  importOpen: boolean;
  dragFileContent?: string;
  dragFileName?: string;
  autoCategoriseOpen: boolean;
  importHistoryOpen: boolean;
  quickRuleOpen: boolean;
  quickRuleDefaults?: {
    match_text: string;
    match_type: 'starts_with';
    min_amount: number | null;
    max_amount: number | null;
    category_id?: string;
  };
  quickRuleEdit: DbCategorisationRule | null;
  confirmProps: React.ComponentProps<typeof ConfirmDialog>;
  filters: RegisterFilters & RegisterFilterActions;
  onImportClose: () => void;
  onImportHistoryClose: () => void;
  onAutoCategoriseClose: () => void;
  onQuickRuleClose: () => void;
  onQuickRuleSave: (data: Parameters<typeof window.api.rules.create>[1]) => Promise<void>;
}

export function RegisterDialogs({
  accountId,
  year,
  month,
  categories,
  loadData,
  importOpen,
  dragFileContent,
  dragFileName,
  autoCategoriseOpen,
  importHistoryOpen,
  quickRuleOpen,
  quickRuleDefaults,
  quickRuleEdit,
  confirmProps,
  filters,
  onImportClose,
  onImportHistoryClose,
  onAutoCategoriseClose,
  onQuickRuleClose,
  onQuickRuleSave,
}: RegisterDialogsProps) {
  return (
    <>
      <ImportWizardDialog
        open={importOpen}
        onClose={onImportClose}
        accountId={accountId}
        onComplete={loadData}
        initialFileContent={dragFileContent}
        initialFileName={dragFileName}
      />
      <ImportHistoryDialog
        open={importHistoryOpen}
        onClose={onImportHistoryClose}
        accountId={accountId}
        onComplete={loadData}
      />
      <AutoCategoriseDialog
        open={autoCategoriseOpen}
        onClose={onAutoCategoriseClose}
        accountId={accountId}
        year={year}
        month={month}
        onComplete={loadData}
      />
      <RuleFormDialog
        open={quickRuleOpen}
        onClose={onQuickRuleClose}
        onSave={onQuickRuleSave}
        rule={quickRuleEdit}
        categories={categories}
        defaults={quickRuleDefaults}
      />
      <ConfirmDialog {...confirmProps} />
      <FilterDropdown
        activeFilter={filters.activeFilter}
        descFilter={filters.descFilter}
        flagFilter={filters.flagFilter}
        onDescFilterChange={filters.setDescFilter}
        onFlagFilterChange={filters.setFlagFilter}
        onClose={filters.handleFilterDropdownClose}
      />
    </>
  );
}
