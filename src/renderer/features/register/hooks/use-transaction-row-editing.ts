import { useRef, useState } from 'react';
import type { TransactionWithCategory } from '../../../../shared/types';
import { formatDateInput } from '../../../lib/utils';

export const REGISTER_EDIT_ORDER = ['date', 'description', 'note', 'category', 'credit', 'debit'] as const;

export type TransactionEditableField = (typeof REGISTER_EDIT_ORDER)[number];

interface UseTransactionRowEditingArgs {
  transaction: TransactionWithCategory;
  onUpdate: (data: {
    date: number;
    description: string;
    category_id: string | null;
    delta_value: number;
  }) => Promise<boolean> | boolean;
  onUpdateNote: (note: string | null) => Promise<boolean> | boolean;
}

export function useTransactionRowEditing({
  transaction,
  onUpdate,
  onUpdateNote,
}: UseTransactionRowEditingArgs) {
  const [editingField, setEditingField] = useState<TransactionEditableField | null>(null);
  const [editValue, setEditValue] = useState('');
  const tabbingRef = useRef(false);

  const dateObject = new Date(transaction.date * 1000);
  const dateInputValue = formatDateInput(dateObject);
  const isCredit = transaction.delta_value > 0;

  async function persistDate(value: string): Promise<boolean> {
    const nextDate = new Date(value).getTime() / 1000;

    if (Number.isNaN(nextDate) || nextDate === transaction.date) {
      return true;
    }

    return onUpdate({
      date: nextDate,
      description: transaction.description,
      category_id: transaction.category_id,
      delta_value: transaction.delta_value,
    });
  }

  async function persistDescription(value: string): Promise<boolean> {
    const trimmedValue = value.trim();

    if (!trimmedValue || trimmedValue === transaction.description) {
      return true;
    }

    return onUpdate({
      date: transaction.date,
      description: trimmedValue,
      category_id: transaction.category_id,
      delta_value: transaction.delta_value,
    });
  }

  async function persistNote(value: string): Promise<boolean> {
    return onUpdateNote(value.trim() || null);
  }

  async function persistAmount(value: string, forCredit: boolean): Promise<boolean> {
    const numericValue = parseFloat(value);

    if (Number.isNaN(numericValue) || numericValue === 0) {
      return true;
    }

    const nextDeltaValue = forCredit ? numericValue : -numericValue;

    if (nextDeltaValue === transaction.delta_value) {
      return true;
    }

    return onUpdate({
      date: transaction.date,
      description: transaction.description,
      category_id: transaction.category_id,
      delta_value: nextDeltaValue,
    });
  }

  function activateField(field: TransactionEditableField) {
    switch (field) {
      case 'date':
        setEditValue(dateInputValue);
        break;
      case 'description':
        setEditValue(transaction.description);
        break;
      case 'note':
        setEditValue(transaction.user_note ?? '');
        break;
      case 'credit':
        setEditValue(isCredit ? Math.abs(transaction.delta_value).toFixed(2) : '');
        break;
      case 'debit':
        setEditValue(!isCredit ? Math.abs(transaction.delta_value).toFixed(2) : '');
        break;
      case 'category':
        break;
    }

    setEditingField(field);
  }

  async function persistCurrentField(): Promise<boolean> {
    switch (editingField) {
      case 'date':
        return persistDate(editValue);
      case 'description':
        return persistDescription(editValue);
      case 'note':
        return persistNote(editValue);
      case 'credit':
        return persistAmount(editValue, true);
      case 'debit':
        return persistAmount(editValue, false);
      default:
        return true;
    }
  }

  function navigateField(fromField: TransactionEditableField, shiftKey: boolean) {
    const currentIndex = REGISTER_EDIT_ORDER.indexOf(fromField);
    const nextIndex = shiftKey ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex >= 0 && nextIndex < REGISTER_EDIT_ORDER.length) {
      activateField(REGISTER_EDIT_ORDER[nextIndex]);
      return;
    }

    setEditingField(null);
  }

  async function handleFieldKeyDown(event: React.KeyboardEvent, field: TransactionEditableField) {
    if (event.key === 'Escape') {
      setEditingField(null);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const saved = await persistCurrentField();

      if (saved) {
        setEditingField(null);
      }

      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      tabbingRef.current = true;
      const saved = await persistCurrentField();

      if (saved) {
        navigateField(field, event.shiftKey);
      }

      requestAnimationFrame(() => {
        tabbingRef.current = false;
      });
    }
  }

  async function handleBlur() {
    if (tabbingRef.current) {
      return;
    }

    const saved = await persistCurrentField();

    if (saved) {
      setEditingField(null);
    }
  }

  async function handleCategorySelect(categoryId: string | null) {
    const saved = await onUpdate({
      date: transaction.date,
      description: transaction.description,
      category_id: categoryId,
      delta_value: transaction.delta_value,
    });

    if (saved) {
      setEditingField(null);
    }
  }

  function handleCategoryTab(shiftKey: boolean) {
    navigateField('category', shiftKey);
  }

  function handleCategoryPickerClose() {
    setEditingField(null);
  }

  return {
    editingField,
    editValue,
    isCredit,
    dateObject,
    dateInputValue,
    setEditValue,
    activateField,
    handleFieldKeyDown,
    handleBlur,
    handleCategorySelect,
    handleCategoryTab,
    handleCategoryPickerClose,
  };
}
