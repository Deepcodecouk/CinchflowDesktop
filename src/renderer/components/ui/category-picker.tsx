import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import type { CategoryHierarchy } from '../../../shared/types';

interface CategoryPickerProps {
  categories: CategoryHierarchy[];
  currentId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  onTab?: (shiftKey: boolean) => void;
  /** When provided, an "All Categories" option is shown as the first item. */
  onAll?: () => void;
  /** Whether the "All" option is currently active (for highlighting). */
  allSelected?: boolean;
}

export function CategoryPicker({ categories, currentId, onSelect, onClose, onTab, onAll, allSelected }: CategoryPickerProps) {
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; dropUp: boolean; offsetX: number; offsetY: number }>({ top: 0, left: 0, dropUp: false, offsetX: 0, offsetY: 0 });

  const filtered = categories.map((h) => ({
    ...h,
    categories: h.categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((h) => h.categories.length > 0 || h.header.name.toLowerCase().includes(search.toLowerCase()));

  const ALL_SENTINEL = '__all__';

  // Flat list of selectable IDs for keyboard navigation
  const selectableIds = useMemo(() => {
    const ids: (string | null)[] = [];
    if (onAll) ids.push(ALL_SENTINEL);
    ids.push(null);
    for (const h of filtered) {
      for (const c of h.categories) {
        ids.push(c.id);
      }
    }
    return ids;
  }, [filtered, onAll]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${highlightedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Position the dropdown relative to the anchor, compensating for any CSS
  // transform/translate ancestor that shifts the origin for fixed positioning.
  // Instead of enumerating CSS properties, we probe the actual offset by
  // inserting a zero-size fixed element and measuring where it lands.
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();

    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;';
    anchorRef.current.appendChild(probe);
    const probeRect = probe.getBoundingClientRect();
    anchorRef.current.removeChild(probe);
    const offsetX = probeRect.left;
    const offsetY = probeRect.top;

    const spaceBelow = window.innerHeight - rect.bottom;
    const dropUp = spaceBelow < 220;
    setPos({
      top: dropUp ? (rect.top - 4 - offsetY) : (rect.bottom + 4 - offsetY),
      left: rect.left - offsetX,
      dropUp,
      offsetX,
      offsetY,
    });
  }, []);

  // Focus the input on mount
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Close on click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      onClose();
      onTab?.(e.shiftKey);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, selectableIds.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < selectableIds.length) {
        const selected = selectableIds[highlightedIndex];
        if (selected === ALL_SENTINEL) {
          onAll?.();
        } else {
          onSelect(selected);
        }
      }
      return;
    }
  }

  return (
    <div ref={anchorRef}>
      {/* Backdrop — extends beyond transform ancestor to cover full viewport */}
      <div
        className="fixed z-[60]"
        style={{ top: -pos.offsetY, left: -pos.offsetX, width: '100vw', height: '100vh' }}
        onClick={handleBackdropClick}
      />
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={cn(
          'fixed z-[70] w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl',
          pos.dropUp && '-translate-y-full',
        )}
        style={{ top: pos.top, left: pos.left }}
      >
            <div className="p-1.5">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search categories..."
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div ref={listRef} className="max-h-48 overflow-y-auto">
              {onAll && (() => {
                const idx = selectableIds.indexOf(ALL_SENTINEL);
                return (
                  <button
                    data-idx={idx}
                    onClick={() => onAll()}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-800',
                      allSelected && highlightedIndex !== idx && 'bg-zinc-800 text-zinc-100',
                      highlightedIndex === idx && 'bg-zinc-700 text-zinc-100',
                    )}
                  >
                    All Categories
                  </button>
                );
              })()}
              {(() => {
                const idx = selectableIds.indexOf(null);
                return (
                  <button
                    data-idx={idx}
                    onClick={() => onSelect(null)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-800',
                      !currentId && !allSelected && highlightedIndex !== idx && 'bg-zinc-800',
                      highlightedIndex === idx && 'bg-zinc-700 text-zinc-100',
                    )}
                  >
                    <span className="text-zinc-500 italic">Uncategorised</span>
                  </button>
                );
              })()}
              {filtered.map((h) => (
                <div key={h.header.id}>
                  <div className="px-3 py-1 text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.header.colour }} />
                    {h.header.name}
                  </div>
                  {h.categories.map((c) => {
                    const idx = selectableIds.indexOf(c.id);
                    return (
                      <button
                        key={c.id}
                        data-idx={idx}
                        onClick={() => onSelect(c.id)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 pl-6 text-sm text-zinc-300 hover:bg-zinc-800',
                          c.id === currentId && highlightedIndex !== idx && 'bg-zinc-800 text-zinc-100',
                          highlightedIndex === idx && 'bg-zinc-700 text-zinc-100',
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
      </div>
    </div>
  );
}

/** Look up a category's display info from the hierarchical list */
export function findCategoryInfo(categories: CategoryHierarchy[], categoryId: string | null) {
  if (!categoryId) return { name: null, colour: null, type: null };
  for (const h of categories) {
    const cat = h.categories.find((c) => c.id === categoryId);
    if (cat) return { name: cat.name, colour: h.header.colour, type: h.header.type };
  }
  return { name: null, colour: null, type: null };
}
