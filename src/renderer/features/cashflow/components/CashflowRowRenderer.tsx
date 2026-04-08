import { CashflowCategoryRow } from './CashflowCategoryRow';
import { CashflowCollapsedHeaderRow } from './CashflowCollapsedHeaderRow';
import { CashflowSectionBannerRow } from './CashflowSectionBannerRow';
import { CashflowSectionTotalRow } from './CashflowSectionTotalRow';
import { DerivedRow } from './DerivedRow';
import type { MonthColumnConfig, CellCoord, EditingCategoryName } from './cashflow-types';
import type { CashflowCalculations } from '../hooks/use-cashflow-calculations';
import type { CashflowSectionKey, CashflowTableRowModel } from '../lib/cashflow-table-model';
import type { CashflowActualTransactionsFilter } from '../../../../shared/types';

interface CashflowRowRendererProps {
  row: CashflowTableRowModel;
  months: MonthColumnConfig[];
  calc: CashflowCalculations;
  currencySymbol: string;
  selectedCell: CellCoord | null;
  editingCell: CellCoord | null;
  inputRef: React.RefObject<HTMLInputElement>;
  editValue: string;
  editableCategoryIds: string[];
  editingCategoryName: EditingCategoryName | null;
  onToggleCollapse: (headerId: string) => void;
  onToggleSectionCollapse: (sectionKey: CashflowSectionKey) => void;
  onEditValueChange: (value: string) => void;
  onSaveEdit: (nextCell?: CellCoord | null) => void;
  onCancelEdit: () => void;
  onGetNextEditableMonth: (month: number) => number | null;
  onSelectCell: (categoryId: string, month: number) => void;
  onStartEdit: (categoryId: string, month: number, currentValue: number) => void;
  onOpenContextMenu: (categoryId: string, month: number, x: number, y: number) => void;
  onDrilldown: (month: number, filter: CashflowActualTransactionsFilter) => void;
  onOpenLinkedCategories: () => void;
  onSetEditingCategoryName: (value: EditingCategoryName | null) => void;
  onRenameCategorySubmit: () => void;
  getComment: (categoryId: string, month: number) => string | null;
  onEditComment: (categoryId: string, month: number) => void;
}

export function CashflowRowRenderer(props: CashflowRowRendererProps) {

  const {
    row,
    months,
    calc,
    currencySymbol,
    selectedCell,
    editingCell,
    inputRef,
    editValue,
    editableCategoryIds,
    editingCategoryName,
    onToggleCollapse,
    onToggleSectionCollapse,
    onEditValueChange,
    onSaveEdit,
    onCancelEdit,
    onGetNextEditableMonth,
    onSelectCell,
    onStartEdit,
    onOpenContextMenu,
    onDrilldown,
    onOpenLinkedCategories,
    onSetEditingCategoryName,
    onRenameCategorySubmit,
    getComment,
    onEditComment,
  } = props;

  switch (row.kind) {

    case 'spacer':
      return <div className="h-6" />;
    case 'banner':
      {
        const sectionKey = row.sectionKey;
        const handleToggleSectionCollapse = sectionKey
          ? () => onToggleSectionCollapse(sectionKey)
          : undefined;

      return (
        <CashflowSectionBannerRow
          label={row.label}
          variant={row.variant}
          isCollapsed={row.isCollapsed}
          onToggleCollapse={handleToggleSectionCollapse}
        />
      );
      }
    case 'header':
      return (
        <CashflowCollapsedHeaderRow
          hierarchy={row.hierarchy}
          isCollapsed={row.isCollapsed}
          months={months}
          calc={calc}
          currencySymbol={currencySymbol}
          getComment={getComment}
          onToggleCollapse={onToggleCollapse}
          onDrilldown={onDrilldown}
        />
      );
    case 'category':
      return (
        <CashflowCategoryRow
          categoryId={row.categoryId}
          categoryName={row.categoryName}
          months={months}
          calc={calc}
          currencySymbol={currencySymbol}
          selectedCell={selectedCell}
          editingCell={editingCell}
          inputRef={inputRef}
          editValue={editValue}
          editableCategoryIds={editableCategoryIds}
          editingCategoryName={editingCategoryName}
          allowRename={row.allowRename}
          linkedCategoryTooltip={row.linkedCategoryTooltip}
          onEditValueChange={onEditValueChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onGetNextEditableMonth={onGetNextEditableMonth}
          onSelectCell={onSelectCell}
          onStartEdit={onStartEdit}
          onOpenContextMenu={onOpenContextMenu}
          onEditComment={onEditComment}
          onDrilldown={onDrilldown}
          onOpenLinkedCategories={onOpenLinkedCategories}
          onSetEditingCategoryName={onSetEditingCategoryName}
          onRenameCategorySubmit={onRenameCategorySubmit}
          getComment={getComment}
        />
      );
    case 'section-total':
      return (
        <CashflowSectionTotalRow
          label={row.label}
          months={months}
          currencySymbol={currencySymbol}
          invertActuals={row.invertActuals}
          getTotalValue={row.getTotalValue}
          getTotalBreakdown={row.getTotalBreakdown}
        />
      );
    case 'derived':
      return (
        <DerivedRow
          label={row.label}
          months={months}
          currencySymbol={currencySymbol}
          bold={row.bold}
          invertActuals={row.invertActuals}
          zeroIsGreen={row.zeroIsGreen}
          getValue={row.getValue}
          getCurrentMonthBreakdown={row.getCurrentMonthBreakdown}
        />
      );
    default:
      return null;
  
}

}
