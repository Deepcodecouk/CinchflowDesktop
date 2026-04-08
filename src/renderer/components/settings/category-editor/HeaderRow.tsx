import { useEffect, useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Button } from '../../ui/button';
import { InlineEdit } from '../../ui/inline-edit';
import { InlineAdd } from '../../ui/inline-add';
import { ColourPicker } from '../../ui/colour-picker';
import { cn } from '../../../lib/utils';
import { CategoryRow } from './CategoryRow';
import { headerDragId, headerDropId, type ActiveDrag } from './dnd-utils';
import type { CategoryHierarchy, DbCategoryHeader, DbCategory } from '../../../../shared/types';

interface HeaderRowProps {
  hierarchy: CategoryHierarchy;
  collapsed: boolean;
  activeDrag: ActiveDrag | null;
  expandTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  onToggleCollapse: () => void;
  onExpandHeader: () => void;
  onUpdateHeader: (id: string, data: Partial<DbCategoryHeader>) => void;
  onDeleteHeader: (id: string) => void;
  onCreateCategory: (headerId: string, name: string) => void;
  onUpdateCategory: (id: string, data: Partial<DbCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

export function HeaderRow({
  hierarchy,
  collapsed,
  activeDrag,
  expandTimerRef,
  onToggleCollapse,
  onExpandHeader,
  onUpdateHeader,
  onDeleteHeader,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: HeaderRowProps) {
  const { header, categories } = hierarchy;

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: headerDragId(header.id),
  });

  const { setNodeRef: setCatDropRef, isOver: isCatDropOver } = useDroppable({
    id: headerDropId(header.id),
    disabled: activeDrag?.type !== 'category',
  });

  // Merge draggable + droppable refs onto the same outer div
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setDragRef(rowRef.current);
    setCatDropRef(rowRef.current);
  });

  // Auto-expand when dragging a category over a collapsed header
  const wasOverRef = useRef(false);
  useEffect(() => {
    if (isCatDropOver && collapsed && activeDrag?.type === 'category') {
      if (!wasOverRef.current) {
        wasOverRef.current = true;
        expandTimerRef.current = setTimeout(() => onExpandHeader(), 500);
      }
    } else {
      wasOverRef.current = false;
    }
  }, [isCatDropOver, collapsed, activeDrag]);

  const showCatDropHighlight = isCatDropOver && activeDrag?.type === 'category';

  return (
    <div ref={rowRef} className={cn(
      'rounded transition-colors',
      isDragging && 'opacity-30',
      showCatDropHighlight && 'ring-1 ring-blue-500/50 bg-blue-500/5',
    )}>
      <div className="sticky top-[41px] z-[1] -mx-4 px-4 py-1 bg-zinc-800/95">
        <div className="flex items-center gap-2 group">
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 -ml-1 flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag to move"
          >
            <GripVertical className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <button onClick={onToggleCollapse} className="p-0.5 flex-shrink-0">
            {collapsed
              ? <ChevronRight className="w-3 h-3 text-zinc-500" />
              : <ChevronDown className="w-3 h-3 text-zinc-500" />
            }
          </button>

          <ColourPicker
            value={header.colour}
            onSelect={(colour) => onUpdateHeader(header.id, { colour })}
          />

          <InlineEdit
            value={header.name}
            onSave={(name) => onUpdateHeader(header.id, { name })}
            className="flex-1 font-medium text-zinc-200"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteHeader(header.id)}
            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
            title="Delete header"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="pl-9 space-y-0.5 pt-0.5">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              headerColour={header.colour}
              onUpdate={onUpdateCategory}
              onDelete={onDeleteCategory}
            />
          ))}
          <InlineAdd placeholder="Add category..." onAdd={(name) => onCreateCategory(header.id, name)} />
        </div>
      )}
    </div>
  );
}
