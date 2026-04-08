import { ListFilter } from 'lucide-react';
import type { CategoryHierarchy } from '../../../../shared/types';
import { CategoryPicker } from '../../../components/ui/category-picker';
import { cn } from '../../../lib/utils';
import type { RegisterFilterActions, RegisterFilters } from '../hooks/use-register-filters';

interface RegisterTableHeaderProps {
  categories: CategoryHierarchy[];
  filters: RegisterFilters & RegisterFilterActions;
}

export function RegisterTableHeader({ categories, filters }: RegisterTableHeaderProps) {
  return (
    <thead className="sticky top-0 z-10 bg-zinc-900 shadow-[inset_0_-1px_0_0_var(--color-zinc-800)]">
      <tr>
        <th className="w-8 px-2 py-3">
          <button onClick={filters.handleFilterFlagClick} className="mx-auto block" title="Filter by flag">
            <ListFilter
              className={cn(
                'h-3.5 w-3.5',
                filters.flagFilter !== 'all' ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-400',
              )}
            />
          </button>
        </th>
        <th className="px-3 py-3 text-left font-medium text-zinc-400">Date</th>
        <th className="px-3 py-3 text-left font-medium text-zinc-400">
          <button
            onClick={filters.handleFilterDescriptionClick}
            className="flex items-center gap-1 hover:text-zinc-200"
          >
            Description
            <ListFilter
              className={cn('h-3.5 w-3.5', filters.descFilter ? 'text-blue-400' : 'text-zinc-600')}
            />
          </button>
        </th>
        <th className="px-3 py-3 text-left font-medium text-zinc-400">
          <button
            onClick={filters.handleToggleCatPicker}
            className="flex items-center gap-1 hover:text-zinc-200"
          >
            Category
            <ListFilter
              className={cn(
                'h-3.5 w-3.5',
                filters.catFilter !== null ? 'text-blue-400' : 'text-zinc-600',
              )}
            />
          </button>
          {filters.catPickerOpen && (
            <CategoryPicker
              categories={categories}
              currentId={
                filters.catFilter !== null && filters.catFilter !== 'uncategorised'
                  ? filters.catFilter
                  : filters.catFilter === 'uncategorised'
                    ? null
                    : ''
              }
              onSelect={filters.handleCatPickerSelect}
              onAll={filters.handleCatPickerAll}
              allSelected={filters.catFilter === null}
              onClose={filters.handleCatPickerClose}
            />
          )}
        </th>
        <th className="px-3 py-3 text-right font-medium text-zinc-400">Credit</th>
        <th className="px-3 py-3 text-right font-medium text-zinc-400">Debit</th>
        <th className="px-3 py-3 text-right font-medium text-zinc-400">Balance</th>
        <th className="w-16 px-2 py-3" />
      </tr>
    </thead>
  );
}
