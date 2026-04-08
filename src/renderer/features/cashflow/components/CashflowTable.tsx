import { useMemo } from 'react';
import { CashflowRowRenderer } from './CashflowRowRenderer';
import { MonthHeaderRow } from './MonthHeaderRow';
import { buildCashflowMonthConfigs } from './cashflow-types';
import type { CellEditingState } from '../hooks/use-cashflow-cell-editing';
import type { CashflowCalculations } from '../hooks/use-cashflow-calculations';
import type { CashflowOperations } from '../hooks/use-cashflow-operations';
import { buildCashflowTableRows } from '../lib/cashflow-table-model';
import { filterSummaryCashflowRows } from '../lib/cashflow-page-state';
import type { CashflowActualTransactionsFilter } from '../../../../shared/types';
import type { CashflowAccountDisplayMode } from './cashflow-types';
import type { CashflowSectionKey } from '../lib/cashflow-table-model';

interface CashflowTableProps {
  accountName: string;
  accountIcon: string;
  displayMode: CashflowAccountDisplayMode;
  year: number;
  calc: CashflowCalculations;
  currencySymbol: string;
  collapsed: Record<string, boolean>;
  collapsedSections: Partial<Record<CashflowSectionKey, boolean>>;
  editing: CellEditingState;
  operations: CashflowOperations;
  showHistoricBudgets?: boolean;
  onToggleCollapse: (headerId: string) => void;
  onToggleSectionCollapse: (sectionKey: CashflowSectionKey) => void;
  onOpenContextMenu: (categoryId: string, month: number, x: number, y: number) => void;
  onOpenMonthContextMenu: (month: number, x: number, y: number) => void;
  onDrilldown: (month: number, filter: CashflowActualTransactionsFilter) => void;
  onOpenLinkedCategories: () => void;
  onToggleSummaryOnly: () => void;
}

export function CashflowTable({
  accountName,
  accountIcon,
  displayMode,
  year,
  calc,
  currencySymbol,
  collapsed,
  collapsedSections,
  editing,
  operations,
  showHistoricBudgets = false,
  onToggleCollapse,
  onToggleSectionCollapse,
  onOpenContextMenu,
  onOpenMonthContextMenu,
  onDrilldown,
  onOpenLinkedCategories,
  onToggleSummaryOnly,
}: CashflowTableProps) {

  const months = useMemo(
    () => buildCashflowMonthConfigs(year, showHistoricBudgets),
    [year, showHistoricBudgets],
  );
  const rows = useMemo(() => {
    const allRows = buildCashflowTableRows(calc, collapsed, collapsedSections);

    return displayMode === 'summary_only' ? filterSummaryCashflowRows(allRows) : allRows;
  }, [calc, collapsed, collapsedSections, displayMode]);
  const editableCategoryIds = editing.getEditableCategoryIds();

  return (
    <div className="flex flex-col w-max min-w-full">
      <MonthHeaderRow
        leftLabel={accountName}
        leftIcon={accountIcon}
        isSummaryOnly={displayMode === 'summary_only'}
        months={months}
        onToggleSummaryOnly={onToggleSummaryOnly}
        onOpenMonthContextMenu={onOpenMonthContextMenu}
      />
      {rows.map((row) => (
        <CashflowRowRenderer
          key={row.key}
          row={row}
          months={months}
          calc={calc}
          currencySymbol={currencySymbol}
          selectedCell={editing.selectedCell}
          editingCell={editing.editingCell}
          inputRef={editing.inputRef}
          editValue={editing.editValue}
          editableCategoryIds={editableCategoryIds}
          editingCategoryName={operations.editingCategoryName}
          onToggleCollapse={onToggleCollapse}
          onToggleSectionCollapse={onToggleSectionCollapse}
          onEditValueChange={editing.setEditValue}
          onSaveEdit={editing.saveEdit}
          onCancelEdit={editing.cancelEdit}
          onGetNextEditableMonth={editing.getNextEditableMonth}
          onSelectCell={editing.selectCell}
          onStartEdit={editing.startEdit}
          onOpenContextMenu={onOpenContextMenu}
          onDrilldown={onDrilldown}
          onOpenLinkedCategories={onOpenLinkedCategories}
          onSetEditingCategoryName={operations.setEditingCategoryName}
          onRenameCategorySubmit={operations.handleRenameCategorySubmit}
          getComment={operations.getComment}
          onEditComment={operations.handleOpenCommentDialog}
        />
      ))}
    </div>
  );

}
