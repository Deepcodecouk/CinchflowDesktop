import { useCallback, useState } from 'react';
import type { TransactionWithCategory } from '../../../../shared/types';
import type { RegisterFilterState } from '../lib/register-view-model';

export interface RegisterFilters {
  descFilter: string;
  catFilter: string | 'uncategorised' | null;
  catPickerOpen: boolean;
  flagFilter: 'all' | 'flagged' | 'unflagged';
  activeFilter: { type: 'description' | 'flag'; rect: DOMRect } | null;
  hasFilters: boolean;
}

export interface RegisterFilterActions {
  setDescFilter: (value: string) => void;
  setFlagFilter: (value: 'all' | 'flagged' | 'unflagged') => void;
  clearFilters: () => void;
  openFilter: (type: 'description' | 'flag', event: React.MouseEvent) => void;
  handleFilterFlagClick: (event: React.MouseEvent) => void;
  handleFilterDescriptionClick: (event: React.MouseEvent) => void;
  handleToggleCatPicker: () => void;
  handleCatPickerSelect: (id: string | null) => void;
  handleCatPickerAll: () => void;
  handleCatPickerClose: () => void;
  handleFilterDropdownClose: () => void;
  filterTransaction: (transaction: TransactionWithCategory) => boolean;
  filters: RegisterFilterState;
}

export function useRegisterFilters(): RegisterFilters & RegisterFilterActions {
  const [descFilter, setDescFilter] = useState('');
  const [catFilter, setCatFilter] = useState<string | 'uncategorised' | null>(null);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [flagFilter, setFlagFilter] = useState<'all' | 'flagged' | 'unflagged'>('all');
  const [activeFilter, setActiveFilter] = useState<{ type: 'description' | 'flag'; rect: DOMRect } | null>(null);
  const hasFilters = !!descFilter || catFilter !== null || flagFilter !== 'all';

  function clearFilters() {
    setDescFilter('');
    setCatFilter(null);
    setFlagFilter('all');
  }

  function openFilter(type: 'description' | 'flag', event: React.MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveFilter((previousValue) => (previousValue?.type === type ? null : { type, rect }));
  }

  function handleFilterFlagClick(event: React.MouseEvent) {
    openFilter('flag', event);
  }

  function handleFilterDescriptionClick(event: React.MouseEvent) {
    openFilter('description', event);
  }

  function handleToggleCatPicker() {
    setCatPickerOpen((previousValue) => !previousValue);
  }

  function handleCatPickerSelect(id: string | null) {
    setCatFilter(id === null ? 'uncategorised' : id);
    setCatPickerOpen(false);
  }

  function handleCatPickerAll() {
    setCatFilter(null);
    setCatPickerOpen(false);
  }

  function handleCatPickerClose() {
    setCatPickerOpen(false);
  }

  function handleFilterDropdownClose() {
    setActiveFilter(null);
  }

  const filterTransaction = useCallback(
    (transaction: TransactionWithCategory) => {
      if (descFilter) {
        const query = descFilter.toLowerCase();
        const descriptionMatches = transaction.description.toLowerCase().includes(query);
        const noteMatches = (transaction.user_note ?? '').toLowerCase().includes(query);

        if (!descriptionMatches && !noteMatches) {
          return false;
        }
      }

      if (catFilter === 'uncategorised' && transaction.category_id !== null) {
        return false;
      }

      if (catFilter && catFilter !== 'uncategorised' && transaction.category_id !== catFilter) {
        return false;
      }

      if (flagFilter === 'flagged' && !transaction.is_flagged) {
        return false;
      }

      if (flagFilter === 'unflagged' && transaction.is_flagged) {
        return false;
      }

      return true;
    },
    [catFilter, descFilter, flagFilter],
  );

  return {
    descFilter,
    catFilter,
    catPickerOpen,
    flagFilter,
    activeFilter,
    hasFilters,
    setDescFilter,
    setFlagFilter,
    clearFilters,
    openFilter,
    handleFilterFlagClick,
    handleFilterDescriptionClick,
    handleToggleCatPicker,
    handleCatPickerSelect,
    handleCatPickerAll,
    handleCatPickerClose,
    handleFilterDropdownClose,
    filterTransaction,
    filters: {
      description: descFilter,
      categoryId: catFilter,
      flag: flagFilter,
    },
  };
}
