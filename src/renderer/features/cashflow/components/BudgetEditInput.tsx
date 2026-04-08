import { cn } from '../../../lib/utils';
import type { CellCoord } from './cashflow-types';

interface BudgetEditInputProps {

  inputRef: React.RefObject<HTMLInputElement>;
  editValue: string;
  categoryId: string;
  month: number;
  editableCategoryIds: string[];
  className?: string;
  onChangeValue: (value: string) => void;
  onSaveEdit: (nextCell?: CellCoord | null) => void;
  onCancelEdit: () => void;
  getNextEditableMonth: (month: number) => number | null;

}

export function BudgetEditInput({
  inputRef,
  editValue,
  categoryId,
  month,
  editableCategoryIds,
  className,
  onChangeValue,
  onSaveEdit,
  onCancelEdit,
  getNextEditableMonth,
}: BudgetEditInputProps) {

  const rowIdx = editableCategoryIds.indexOf(categoryId);

  function handleKeyDown(e: React.KeyboardEvent) {

    if (e.key === 'Enter' || e.key === 'ArrowDown') {

      e.preventDefault();
      const nextId = rowIdx < editableCategoryIds.length - 1 ? editableCategoryIds[rowIdx + 1] : null;

      onSaveEdit(nextId ? { categoryId: nextId, month } : { categoryId, month });

    } else if (e.key === 'Escape') {

      onCancelEdit();

    } else if (e.key === 'Tab') {

      e.preventDefault();
      const nextMonth = getNextEditableMonth(month);

      onSaveEdit(nextMonth ? { categoryId, month: nextMonth } : { categoryId, month });

    } else if (e.key === 'ArrowUp') {

      e.preventDefault();
      const prevId = rowIdx > 0 ? editableCategoryIds[rowIdx - 1] : null;

      onSaveEdit(prevId ? { categoryId: prevId, month } : { categoryId, month });

    }

  }

  return (
    <input
      ref={inputRef}
      type="number"
      step="0.01"
      value={editValue}
      onChange={(e) => onChangeValue(e.target.value)}
      onBlur={() => onSaveEdit({ categoryId, month })}
      onKeyDown={handleKeyDown}
      className={cn('h-full bg-transparent border-none p-0 text-right text-zinc-100 outline-none ring-2 ring-blue-500 ring-inset rounded', 
        className ?? 'w-full')}
      autoFocus
    />
  );

}
