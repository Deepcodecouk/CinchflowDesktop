import { useRef } from 'react';
import { Trash2, MessageSquare, MessageSquarePlus } from 'lucide-react';
import { useClampToViewport } from '../../../hooks/use-clamp-to-viewport';
import type { ContextMenuState, MonthContextMenuState } from './cashflow-types';

interface CashflowContextMenuProps {
  contextMenu: ContextMenuState | null;
  onCloseContextMenu: () => void;
  onFillRight: (categoryId: string, month: number, mode: 'overwrite' | 'empty_only') => void;
  hasComment: boolean;
  onAddComment: (categoryId: string, month: number) => void;
  onEditComment: (categoryId: string, month: number) => void;
  onDeleteComment: (categoryId: string, month: number) => void;
  monthContextMenu: MonthContextMenuState | null;
  onCloseMonthContextMenu: () => void;
  onCopyFromPreviousMonth: (month: number, mode: 'overwrite' | 'empty_only') => void;
  onClearBudgetMonth: (month: number) => void;
}

export function CashflowContextMenu({
  contextMenu,
  onCloseContextMenu,
  onFillRight,
  hasComment,
  onAddComment,
  onEditComment,
  onDeleteComment,
  monthContextMenu,
  onCloseMonthContextMenu,
  onCopyFromPreviousMonth,
  onClearBudgetMonth,
}: CashflowContextMenuProps) {

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const monthContextMenuRef = useRef<HTMLDivElement>(null);

  useClampToViewport(contextMenuRef, contextMenu);
  useClampToViewport(monthContextMenuRef, monthContextMenu);

  function handleFillRight() { onFillRight(contextMenu!.categoryId, contextMenu!.month, 'overwrite'); }

  function handleFillRightEmpty() { onFillRight(contextMenu!.categoryId, contextMenu!.month, 'empty_only'); }

  function handleEditComment() { onEditComment(contextMenu!.categoryId, contextMenu!.month); }

  function handleDeleteComment() { onDeleteComment(contextMenu!.categoryId, contextMenu!.month); }

  function handleAddComment() { onAddComment(contextMenu!.categoryId, contextMenu!.month); }

  function handleCopyFromPrev() { onCopyFromPreviousMonth(monthContextMenu!.month, 'overwrite'); }

  function handleCopyFromPrevEmpty() { onCopyFromPreviousMonth(monthContextMenu!.month, 'empty_only'); }

  function handleClearMonth() { onClearBudgetMonth(monthContextMenu!.month); }

  return (
    <>
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={onCloseContextMenu} />
          <div
            ref={contextMenuRef}
            className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer"
              onClick={handleFillRight}
            >
              Fill right
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer"
              onClick={handleFillRightEmpty}
            >
              Fill right (empty only)
            </button>
            <div className="border-t border-zinc-700 my-1" />
            {hasComment ? (
              <>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
                  onClick={handleEditComment}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Edit comment
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
                  onClick={handleDeleteComment}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete comment
                </button>
              </>
            ) : (
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
                onClick={handleAddComment}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Add comment
              </button>
            )}
          </div>
        </>
      )}

      {monthContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={onCloseMonthContextMenu} />
          <div
            ref={monthContextMenuRef}
            className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[220px]"
            style={{ left: monthContextMenu.x, top: monthContextMenu.y }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer"
              onClick={handleCopyFromPrev}
            >
              Copy from previous month
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer"
              onClick={handleCopyFromPrevEmpty}
            >
              Copy from previous month (empty only)
            </button>
            <div className="border-t border-zinc-700 my-1" />
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
              onClick={handleClearMonth}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear budget
            </button>
          </div>
        </>
      )}
    </>
  );

}
