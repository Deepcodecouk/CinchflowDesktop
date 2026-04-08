import { useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { InlineAdd } from '../../ui/inline-add';
import { cn } from '../../../lib/utils';
import { HeaderRow } from './HeaderRow';
import { typeDropId, type ActiveDrag } from './dnd-utils';
import type { CategoryHierarchy, DbCategoryHeader, DbCategory, CategoryHeaderType } from '../../../../shared/types';

const TYPE_LABELS: Record<CategoryHeaderType, string> = {
  income_start: 'Income (Start of month)',
  income_end: 'Income (End of month)',
  fixed_expense: 'Fixed Expenses',
  variable_expense: 'Variable Expenses',
};

interface TypePanelProps {
  type: CategoryHeaderType;
  hierarchies: CategoryHierarchy[];
  activeDrag: ActiveDrag | null;
  expandTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  onCreateHeader: (name: string) => void;
  onUpdateHeader: (id: string, data: Partial<DbCategoryHeader>) => void;
  onDeleteHeader: (id: string) => void;
  onCreateCategory: (headerId: string, name: string) => void;
  onUpdateCategory: (id: string, data: Partial<DbCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

export function TypePanel({
  type,
  hierarchies,
  activeDrag,
  expandTimerRef,
  onCreateHeader,
  onUpdateHeader,
  onDeleteHeader,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: TypePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedHeaders, setCollapsedHeaders] = useState<Set<string>>(new Set());

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: typeDropId(type),
    disabled: activeDrag?.type !== 'header',
  });

  // Auto-expand when dragging a header over a collapsed type
  const wasOverRef = useRef(false);
  useEffect(() => {
    if (isOver && collapsed && activeDrag?.type === 'header') {
      if (!wasOverRef.current) {
        wasOverRef.current = true;
        expandTimerRef.current = setTimeout(() => setCollapsed(false), 500);
      }
    } else {
      wasOverRef.current = false;
    }
  }, [isOver, collapsed, activeDrag]);

  function toggleHeader(id: string) {
    setCollapsedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function expandHeader(id: string) {
    setCollapsedHeaders((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const allHeaderIds = hierarchies.map((h) => h.header.id);
  const anyExpanded = allHeaderIds.some((id) => !collapsedHeaders.has(id));

  function toggleAll() {
    setCollapsedHeaders(anyExpanded ? new Set(allHeaderIds) : new Set());
  }

  const showDropHighlight = isOver && activeDrag?.type === 'header';

  return (
    <div ref={setDropRef} className={cn(
      'border rounded-lg overflow-clip transition-colors',
      showDropHighlight ? 'border-blue-500/60 bg-blue-500/5' : 'border-zinc-700/50',
    )}>
      <div className="sticky top-0 z-[2] bg-zinc-800 border-b border-zinc-700/50 px-4 py-2.5 flex items-center gap-2">
        <button onClick={() => setCollapsed(!collapsed)} className="p-0.5 -ml-0.5">
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          }
        </button>
        <h3 className="text-sm font-semibold text-zinc-300 flex-1">{TYPE_LABELS[type]}</h3>
        {!collapsed && hierarchies.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {anyExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 py-3 space-y-3 bg-zinc-800/30">
          {hierarchies.map((hierarchy) => (
            <HeaderRow
              key={hierarchy.header.id}
              hierarchy={hierarchy}
              collapsed={collapsedHeaders.has(hierarchy.header.id)}
              activeDrag={activeDrag}
              expandTimerRef={expandTimerRef}
              onToggleCollapse={() => toggleHeader(hierarchy.header.id)}
              onExpandHeader={() => expandHeader(hierarchy.header.id)}
              onUpdateHeader={onUpdateHeader}
              onDeleteHeader={onDeleteHeader}
              onCreateCategory={onCreateCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
          <InlineAdd placeholder="Add header..." onAdd={onCreateHeader} />
        </div>
      )}
    </div>
  );
}
