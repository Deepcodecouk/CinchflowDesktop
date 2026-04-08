import { useEffect, useRef } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { BudgetGridCell } from './BudgetGridCell';
import { GridCell } from './GridCell';
import { MonthColumnWrapper } from './MonthColumnWrapper';
import {
  computeActualColor,
  computeHybridColor,
} from './cashflow-types';
import type { CellCoord, EditingCategoryName, MonthColumnConfig } from './cashflow-types';
import type { CashflowCalculations } from '../hooks/use-cashflow-calculations';
import type { CashflowActualTransactionsFilter } from '../../../../shared/types';

interface CashflowCategoryRowProps {
  categoryId: string;
  categoryName: string;
  months: MonthColumnConfig[];
  calc: CashflowCalculations;
  currencySymbol: string;
  selectedCell: CellCoord | null;
  editingCell: CellCoord | null;
  inputRef: React.RefObject<HTMLInputElement>;
  editValue: string;
  editableCategoryIds: string[];
  editingCategoryName: EditingCategoryName | null;
  showHistoricBudgets?: boolean;
  allowRename?: boolean;
  linkedCategoryTooltip?: string | null;
  onEditValueChange: (value: string) => void;
  onSaveEdit: (nextCell?: CellCoord | null) => void;
  onCancelEdit: () => void;
  onGetNextEditableMonth: (month: number) => number | null;
  onSelectCell: (categoryId: string, month: number) => void;
  onStartEdit: (categoryId: string, month: number, currentValue: number) => void;
  onOpenContextMenu: (categoryId: string, month: number, x: number, y: number) => void;
  onEditComment: (categoryId: string, month: number) => void;
  onDrilldown: (month: number, filter: CashflowActualTransactionsFilter) => void;
  onOpenLinkedCategories: () => void;
  onSetEditingCategoryName: (value: EditingCategoryName | null) => void;
  onRenameCategorySubmit: () => void;
  getComment: (categoryId: string, month: number) => string | null;
}

export function CashflowCategoryRow({
  categoryId,
  categoryName,
  months,
  calc,
  currencySymbol,
  selectedCell,
  editingCell,
  inputRef,
  editValue,
  editableCategoryIds,
  editingCategoryName,
  allowRename = true,
  linkedCategoryTooltip,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onGetNextEditableMonth,
  onSelectCell,
  onStartEdit,
  onOpenContextMenu,
  onEditComment,
  onDrilldown,
  onOpenLinkedCategories,
  onSetEditingCategoryName,
  onRenameCategorySubmit,
  getComment,
}: CashflowCategoryRowProps) {
  const renameInputRef = useRef<HTMLInputElement>(null);
  const wasEditingThisCategoryRef = useRef(false);

  useEffect(() => {
    const isEditingThisCategory = editingCategoryName?.id === categoryId;

    if (isEditingThisCategory && !wasEditingThisCategoryRef.current) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }

    wasEditingThisCategoryRef.current = isEditingThisCategory;
  }, [categoryId, editingCategoryName]);

  function handleRenameChange(event: React.ChangeEvent<HTMLInputElement>) {

    if (!editingCategoryName) return;

    onSetEditingCategoryName({
      ...editingCategoryName,
      name: event.target.value,
    });
  
}

  function handleRenameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();

    if (event.key === 'Enter') onRenameCategorySubmit();
    if (event.key === 'Escape') onSetEditingCategoryName(null);
  
}

  function handleRenameMouseDown(event: React.MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
  }

  function handleRenameClick(event: React.MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
  }

  function handleStartRename() {

    if (!allowRename) return;

    onSetEditingCategoryName({ id: categoryId, name: categoryName });
  
}

  function handleOpenLinkedCategoryDialog() {

    onOpenLinkedCategories();
  
}

  function renderMonthCells(config: MonthColumnConfig) {

    const month = config.month;
    const isEditingThisCell = editingCell?.categoryId === categoryId && editingCell?.month === month;
    const isSelectedThisCell = selectedCell?.categoryId === categoryId && selectedCell?.month === month;

    function handleSelectCell() {

      onSelectCell(categoryId, month);
    
}

    function handleContextMenu(x: number, y: number) {

      onOpenContextMenu(categoryId, month, x, y);
    
}

    function handleEditComment() {

      onEditComment(categoryId, month);
    
}

    function handleDrilldown() {

      onDrilldown(month, {
        kind: 'category',
        categoryId,
        categoryName,
      });
    
}

    const budgetValue = calc.getBudget(categoryId, month);
    const actualValue = calc.getActual(categoryId, month);
    const hybridValue = calc.getHybrid(categoryId, month);
    const isExpense = calc.isExpenseCategory(categoryId);
    const actualColor = computeActualColor(actualValue, budgetValue, isExpense);
    const hybridColor = computeHybridColor(actualValue, budgetValue, hybridValue, isExpense);

    function handleStartEdit() {

      onStartEdit(categoryId, month, budgetValue);
    
}

    if (config.subCellCount === 3) {

      return (
        <>
          <BudgetGridCell
            value={budgetValue}
            currencySymbol={currencySymbol}
            categoryId={categoryId}
            month={month}
            editableCategoryIds={editableCategoryIds}
            editValue={editValue}
            inputRef={inputRef}
            isEditing={isEditingThisCell}
            isSelected={isSelectedThisCell}
            comment={getComment(categoryId, month)}
            onChangeValue={onEditValueChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onGetNextEditableMonth={onGetNextEditableMonth}
            onSelect={handleSelectCell}
            onStartEdit={handleStartEdit}
            onContextMenu={handleContextMenu}
            onEditComment={handleEditComment}
          />
          <GridCell
            purpose="actual"
            value={calc.displayActual(actualValue, categoryId)}
            currencySymbol={currencySymbol}
            colorOverride={actualColor}
            onDrilldown={handleDrilldown}
          />
          <GridCell
            purpose="hybrid"
            value={Math.abs(hybridValue)}
            currencySymbol={currencySymbol}
            colorOverride={hybridColor}
          />
        </>
      );
    
}

    if (config.subCellCount === 2) {

      return (
        <>
          <BudgetGridCell
            value={budgetValue}
            currencySymbol={currencySymbol}
            categoryId={categoryId}
            month={month}
            editableCategoryIds={editableCategoryIds}
            editValue={editValue}
            inputRef={inputRef}
            isEditing={isEditingThisCell}
            isSelected={isSelectedThisCell}
            colorOverride="text-zinc-500"
            comment={getComment(categoryId, month)}
            onChangeValue={onEditValueChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onGetNextEditableMonth={onGetNextEditableMonth}
            onSelect={handleSelectCell}
            onStartEdit={handleStartEdit}
            onContextMenu={handleContextMenu}
            onEditComment={handleEditComment}
          />
          <GridCell
            purpose="actual"
            value={calc.displayActual(actualValue, categoryId)}
            currencySymbol={currencySymbol}
            colorOverride={actualColor}
            onDrilldown={handleDrilldown}
          />
        </>
      );
    
}

    if (config.monthType === 'future') {

      const futureBudgetValue = calc.getCellValue(categoryId, month, config.monthType);
      const handleStartEditFuture = () => {

        onStartEdit(categoryId, month, futureBudgetValue);
      
};

      return (
        <BudgetGridCell
          value={futureBudgetValue}
          currencySymbol={currencySymbol}
          categoryId={categoryId}
          month={month}
          editableCategoryIds={editableCategoryIds}
          editValue={editValue}
          inputRef={inputRef}
          isEditing={isEditingThisCell}
          isSelected={isSelectedThisCell}
          comment={getComment(categoryId, month)}
          onChangeValue={onEditValueChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onGetNextEditableMonth={onGetNextEditableMonth}
          onSelect={handleSelectCell}
          onStartEdit={handleStartEditFuture}
          onContextMenu={handleContextMenu}
          onEditComment={handleEditComment}
        />
      );
    
}

    return (
      <GridCell
        purpose="actual"
        value={calc.displayActual(calc.getCellValue(categoryId, month, config.monthType), categoryId)}
        currencySymbol={currencySymbol}
        colorOverride="text-zinc-500"
        onDrilldown={handleDrilldown}
      />
    );
  
}

  const categoryLabelClassName = allowRename
    ? 'text-xs text-zinc-400 truncate cursor-pointer hover:text-zinc-200 hover:underline'
    : 'text-xs text-zinc-400 truncate';

  return (
    <div className="flex items-stretch border-b border-zinc-800/30 hover:bg-zinc-800/10">
      <div className="w-52 flex-shrink-0 pl-9 pr-3 py-1.5 sticky left-0 z-10 bg-zinc-900 border-r border-zinc-700">
        {allowRename && editingCategoryName?.id === categoryId ? (
          <input
            ref={renameInputRef}
            autoFocus
            type="text"
            value={editingCategoryName.name}
            onChange={handleRenameChange}
            onBlur={onRenameCategorySubmit}
            onKeyDown={handleRenameKeyDown}
            onMouseDown={handleRenameMouseDown}
            onClick={handleRenameClick}
            className="w-full bg-zinc-700 border border-zinc-600 rounded px-1 py-0.5 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span className="flex items-center gap-1">
            <span className={categoryLabelClassName} onClick={handleStartRename}>
              {categoryName}
            </span>
            {linkedCategoryTooltip && (
              <span
                title={linkedCategoryTooltip}
                className="cursor-pointer text-blue-400 hover:text-blue-300 flex-shrink-0"
                onClick={handleOpenLinkedCategoryDialog}
              >
                <LinkIcon className="w-3 h-3" />
              </span>
            )}
          </span>
        )}
      </div>
      {months.map((config) => (
        <MonthColumnWrapper key={config.month} config={config}>
          {renderMonthCells(config)}
        </MonthColumnWrapper>
      ))}
    </div>
  );

}

