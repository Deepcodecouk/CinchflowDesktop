import { useDraggable } from '@dnd-kit/core';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '../../ui/button';
import { InlineEdit } from '../../ui/inline-edit';
import { cn } from '../../../lib/utils';
import { catDragId } from './dnd-utils';
import type { DbCategory } from '../../../../shared/types';

interface CategoryRowProps {
  category: DbCategory;
  headerColour: string;
  onUpdate: (id: string, data: Partial<DbCategory>) => void;
  onDelete: (id: string) => void;
}

export function CategoryRow({ category, headerColour, onUpdate, onDelete }: CategoryRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: catDragId(category.id),
  });

  return (
    <div ref={setNodeRef} className={cn('flex items-center gap-2 group', isDragging && 'opacity-30')}>
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 -ml-1 flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to move"
      >
        <GripVertical className="w-3 h-3 text-zinc-500" />
      </button>
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: headerColour }}
      />
      <InlineEdit
        value={category.name}
        onSave={(name) => onUpdate(category.id, { name })}
        className="flex-1 text-zinc-300"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(category.id)}
        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
        title="Delete category"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
