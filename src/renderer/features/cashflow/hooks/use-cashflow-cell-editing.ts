import { useCallback, useRef, useState } from 'react';
import type { CashflowAccountData } from '../../../../shared/types';
import type { CellCoord } from '../components/cashflow-types';
import { getMonthType } from '../components/cashflow-types';
import { getEditableCashflowCategoryIds } from '../lib/cashflow-table-model';
import type { CashflowSectionKey } from '../lib/cashflow-table-model';

export interface CellEditingState {
  selectedCell: CellCoord | null;
  editingCell: CellCoord | null;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  gridRef: React.RefObject<HTMLDivElement>;
  clearSelection: () => void;
  selectCell: (categoryId: string, month: number) => void;
  startEdit: (categoryId: string, month: number, currentValue: number) => void;
  startEditFromTyping: (categoryId: string, month: number, initialChar: string) => void;
  saveEdit: (nextCell?: CellCoord | null) => Promise<void>;
  cancelEdit: () => void;
  setEditValue: (value: string) => void;
  navigateCell: (categoryId: string, month: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  getNextEditableMonth: (month: number) => number | null;
  getEditableCategoryIds: () => string[];
  getEditableMonths: () => number[];
  isEditableMonth: (month: number) => boolean;
  clearBudget: (categoryId: string, month: number) => void;
}

export function useCashflowCellEditing(
  data: CashflowAccountData | null,
  year: number,
  collapsed: Record<string, boolean>,
  collapsedSections: Partial<Record<CashflowSectionKey, boolean>>,
  saveBudgetValue: (categoryId: string, month: number, amount: number) => Promise<void>,
  clearBudgetValue: (categoryId: string, month: number) => Promise<void>,
  showHistoricBudgets = false,
): CellEditingState {
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);

  const isEditableMonth = useCallback(
    (month: number): boolean => {
      if (showHistoricBudgets) {
        return true;
      }

      const monthType = getMonthType(year, month);
      return monthType === 'current' || monthType === 'future';
    },
    [showHistoricBudgets, year],
  );

  const getEditableMonths = useCallback(
    (): number[] => Array.from({ length: 12 }, (_, index) => index + 1).filter(isEditableMonth),
    [isEditableMonth],
  );

  const getEditableCategoryIds = useCallback((): string[] => {
    if (!data) {
      return [];
    }

    return getEditableCashflowCategoryIds(data.hierarchies, collapsed, collapsedSections);
  }, [collapsed, collapsedSections, data]);

  function selectCell(categoryId: string, month: number) {
    setSelectedCell({ categoryId, month });
    setEditingCell(null);
    setEditValue('');
  }

  function startEdit(categoryId: string, month: number, currentValue: number) {
    setSelectedCell({ categoryId, month });
    setEditingCell({ categoryId, month });
    setEditValue(currentValue !== 0 ? String(currentValue) : '');
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function startEditFromTyping(categoryId: string, month: number, initialChar: string) {
    setSelectedCell({ categoryId, month });
    setEditingCell({ categoryId, month });
    setEditValue(initialChar);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function clearSelection() {
    setSelectedCell(null);
    setEditingCell(null);
    setEditValue('');
  }

  async function saveEdit(nextCell?: CellCoord | null) {
    if (!editingCell || savingRef.current) {
      return;
    }

    savingRef.current = true;

    try {
      const amount = parseFloat(editValue) || 0;
      await saveBudgetValue(editingCell.categoryId, editingCell.month, amount);
      setEditingCell(null);
      setEditValue('');

      if (nextCell) {
        setSelectedCell(nextCell);
      }
    } finally {
      savingRef.current = false;
    }
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue('');
  }

  function navigateCell(categoryId: string, month: number, direction: 'up' | 'down' | 'left' | 'right') {
    const categoryIds = getEditableCategoryIds();
    const months = getEditableMonths();
    const rowIndex = categoryIds.indexOf(categoryId);
    const monthIndex = months.indexOf(month);

    let nextRowIndex = rowIndex;
    let nextMonthIndex = monthIndex;

    if (direction === 'up' && rowIndex > 0) {
      nextRowIndex = rowIndex - 1;
    } else if (direction === 'down' && rowIndex < categoryIds.length - 1) {
      nextRowIndex = rowIndex + 1;
    } else if (direction === 'left' && monthIndex > 0) {
      nextMonthIndex = monthIndex - 1;
    } else if (direction === 'right' && monthIndex < months.length - 1) {
      nextMonthIndex = monthIndex + 1;
    }

    if (nextRowIndex !== rowIndex || nextMonthIndex !== monthIndex) {
      selectCell(categoryIds[nextRowIndex], months[nextMonthIndex]);
    }
  }

  function getNextEditableMonth(month: number): number | null {
    const months = getEditableMonths();
    const monthIndex = months.indexOf(month);

    return monthIndex >= 0 && monthIndex < months.length - 1 ? months[monthIndex + 1] : null;
  }

  function clearBudget(categoryId: string, month: number) {
    clearBudgetValue(categoryId, month).catch(() => undefined);
  }

  return {
    selectedCell,
    editingCell,
    editValue,
    inputRef,
    gridRef,
    clearSelection,
    selectCell,
    startEdit,
    startEditFromTyping,
    saveEdit,
    cancelEdit,
    setEditValue,
    navigateCell,
    getNextEditableMonth,
    getEditableCategoryIds,
    getEditableMonths,
    isEditableMonth,
    clearBudget,
  };
}
