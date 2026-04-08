import { MoreVertical, MessageSquare } from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { BudgetEditInput } from './BudgetEditInput';
import type { CellCoord } from './cashflow-types';

interface BudgetGridCellProps {
  value: number;
  currencySymbol: string;
  categoryId: string;
  month: number;
  editableCategoryIds: string[];
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  isEditing?: boolean;
  isSelected?: boolean;
  colorOverride?: string;
  comment?: string | null;
  onChangeValue: (value: string) => void;
  onSaveEdit: (nextCell?: CellCoord | null) => void;
  onCancelEdit: () => void;
  onGetNextEditableMonth: (month: number) => number | null;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onContextMenu?: (x: number, y: number) => void;
  onEditComment?: () => void;
}

export function BudgetGridCell({
  value,
  currencySymbol,
  categoryId,
  month,
  editableCategoryIds,
  editValue,
  inputRef,
  isEditing = false,
  isSelected = false,
  colorOverride,
  comment,
  onChangeValue,
  onSaveEdit,
  onCancelEdit,
  onGetNextEditableMonth,
  onSelect,
  onStartEdit,
  onContextMenu,
  onEditComment,
}: BudgetGridCellProps) {

  const formattedValue = formatCurrency(value, currencySymbol);
  const hasComment = Boolean(comment);

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {

    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    onContextMenu?.(rect.right, rect.bottom);
  
}

  function handleCommentClick(event: React.MouseEvent<HTMLButtonElement>) {

    event.stopPropagation();
    onEditComment?.();
  
}

  return (
    <div
      className={cn(
        'flex items-center min-w-0 flex-1 rounded-sm',
        hasComment && '-mx-1 -my-1.5 bg-yellow-500/30 px-1 py-1.5',
      )}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <span className="relative block min-w-0">
            <span className="invisible block text-right text-[10px] px-0.5 truncate">{formattedValue}</span>
            <span className="absolute inset-0 overflow-hidden">
              <BudgetEditInput
                inputRef={inputRef}
                editValue={editValue}
                categoryId={categoryId}
                month={month}
                editableCategoryIds={editableCategoryIds}
                className="w-full px-0.5"
                onChangeValue={onChangeValue}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                getNextEditableMonth={onGetNextEditableMonth}
              />
            </span>
          </span>
        ) : (
            <span
              className={cn(
                'block text-right text-[10px] cursor-pointer hover:bg-zinc-700 px-0.5 rounded truncate',
                colorOverride,
                hasComment && 'hover:bg-yellow-400/25',
                isSelected && 'ring-2 ring-blue-500 ring-inset rounded',
              )}
              onClick={onSelect}
            onDoubleClick={onStartEdit}
          >
            {formattedValue}
          </span>
        )}
      </div>
      <div className="w-4 shrink-0 flex items-center justify-center">
        {onContextMenu && (
          <button className="p-0 text-zinc-600 hover:text-zinc-400 cursor-pointer" onClick={handleMenuClick}>
            <MoreVertical className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="w-4 shrink-0 flex items-center justify-center">
        {comment && onEditComment && (
          <button className="p-0 text-blue-400 hover:text-blue-300 cursor-pointer" title={comment} onClick={handleCommentClick}>
            <MessageSquare className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );

}
