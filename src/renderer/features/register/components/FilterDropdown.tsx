import { cn } from '../../../lib/utils';

interface FilterDropdownProps {

  activeFilter: { type: 'description' | 'flag'; rect: DOMRect } | null;
  descFilter: string;
  flagFilter: 'all' | 'flagged' | 'unflagged';
  onDescFilterChange: (value: string) => void;
  onFlagFilterChange: (value: 'all' | 'flagged' | 'unflagged') => void;
  onClose: () => void;

}

export function FilterDropdown({
  activeFilter,
  descFilter,
  flagFilter,
  onDescFilterChange,
  onFlagFilterChange,
  onClose,
}: FilterDropdownProps) {

  if (!activeFilter) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl"
        style={{ top: activeFilter.rect.bottom + 4, left: activeFilter.rect.left }}
      >
        {activeFilter.type === 'description' && (
          <div className="p-2 w-56">
            <input
              autoFocus
              type="text"
              value={descFilter}
              onChange={(e) => onDescFilterChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
              placeholder="Filter by description or note..."
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-500"
            />
          </div>
        )}
        {activeFilter.type === 'flag' && (
          <div className="py-1 w-36">
            {([['all', 'All'], ['flagged', 'Flagged'], ['unflagged', 'Unflagged']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => { onFlagFilterChange(value); onClose(); }}
                className={cn('w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-800', flagFilter === value && 'bg-zinc-800 text-zinc-100')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

}
