import { useState, useRef } from 'react';
import { Plus, Save } from 'lucide-react';
import type { CategoryHierarchy } from '../../../../shared/types';
import { formatDateInput } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { CategoryPicker, findCategoryInfo } from '../../../components/ui/category-picker';
import { normalizeRegisterDraftAmounts } from '../lib/register-view-model';

interface NewTransactionRowProps {

  currencySymbol: string;
  categories: CategoryHierarchy[];
  onSave: (data: { date: number; description: string; category_id: string | null; delta_value: number; user_note: string | null }) => Promise<boolean> | boolean;
  defaultYear: number;
  defaultMonth: number;

}

export function NewTransactionRow({
  currencySymbol,
  categories,
  onSave,
  defaultYear,
  defaultMonth,
}: NewTransactionRowProps) {

  const defaultDate = new Date(Date.UTC(defaultYear, defaultMonth - 1, 15));
  const [date, setDate] = useState(formatDateInput(defaultDate));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [credit, setCredit] = useState('');
  const [debit, setDebit] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const creditRef = useRef<HTMLInputElement>(null);
  const debitRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    const { normalizedCredit, normalizedDebit, deltaValue } = normalizeRegisterDraftAmounts(credit, debit);

    if (!date || !description.trim() || deltaValue === 0) return;

    const saved = await onSave({
      date: new Date(date).getTime() / 1000,
      description: description.trim(),
      category_id: categoryId,
      delta_value: deltaValue,
      user_note: note.trim() || null,
    });

    if (!saved) {
      return;
    }

    // Reset immediately
    setDate(formatDateInput(defaultDate));
    setDescription('');
    setNote('');
    setCategoryId(null);
    setCredit('');
    setDebit('');

    // Wait for the new row to be inserted into state, then restore focus.
    requestAnimationFrame(() => {

      dateRef.current?.focus();
      dateRef.current?.closest('tr')?.scrollIntoView({ block: 'nearest' });

    });

  }

  function handleCreditBlur() {
    const normalized = normalizeRegisterDraftAmounts(credit, debit);
    setCredit(normalized.normalizedCredit);
    setDebit(normalized.normalizedDebit);
  }

  function handleDebitBlur() {
    const normalized = normalizeRegisterDraftAmounts(credit, debit);
    setCredit(normalized.normalizedCredit);
    setDebit(normalized.normalizedDebit);
  }

  function handleFieldKeyDown(e: React.KeyboardEvent) {

    if (e.key === 'Enter') {

      e.preventDefault();
      void handleSave();

    }

  }

  function handleDebitKeyDown(e: React.KeyboardEvent) {

    if (e.key === 'Enter') {

      e.preventDefault();
      void handleSave();
      return;

    }
    if (e.key === 'Tab' && !e.shiftKey) {

      e.preventDefault();
      void handleSave();

    }

  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {

    setDate(e.target.value);

  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {

    setDescription(e.target.value);

  }

  function handleNoteChange(e: React.ChangeEvent<HTMLInputElement>) {

    setNote(e.target.value);

  }

  function handleCategoryFocus() {

    setShowCategoryPicker(true);

  }

  function handleCategoryClick() {

    setShowCategoryPicker(true);

  }

  function handleCategorySelect(id: string | null) {

    setCategoryId(id);
    setShowCategoryPicker(false);
    requestAnimationFrame(() => creditRef.current?.focus());

  }

  function handleCategoryClose() {

    setShowCategoryPicker(false);

  }

  function handleCategoryTab(shiftKey: boolean) {

    setShowCategoryPicker(false);
    requestAnimationFrame(() => (shiftKey ? noteRef : creditRef).current?.focus());

  }

  function handleCreditChange(e: React.ChangeEvent<HTMLInputElement>) {

    setCredit(e.target.value);
    setDebit('');

  }

  function handleDebitChange(e: React.ChangeEvent<HTMLInputElement>) {

    setDebit(e.target.value);
    setCredit('');

  }

  const selectedCategoryName = categoryId
    ? findCategoryInfo(categories, categoryId).name ?? 'Unknown'
    : null;

  return (
    <tr className="border-t border-zinc-700 bg-zinc-800/30 align-top">
      <td className="px-2 py-2.5">
        <Plus className="w-3.5 h-3.5 text-zinc-500 mx-auto" />
      </td>
      <td className="px-3 py-2.5">
        <input
          ref={dateRef}
          type="date"
          value={date}
          onChange={handleDateChange}
          onKeyDown={handleFieldKeyDown}
          className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-3 py-2.5 space-y-1">
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          onKeyDown={handleFieldKeyDown}
          placeholder="Description"
          className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          ref={noteRef}
          type="text"
          value={note}
          onChange={handleNoteChange}
          onKeyDown={handleFieldKeyDown}
          placeholder="Add note..."
          className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-3 py-2.5">
        <button
          onFocus={handleCategoryFocus}
          onClick={handleCategoryClick}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          {selectedCategoryName ? (
            <span className="text-zinc-300">{selectedCategoryName}</span>
          ) : (
            'Category...'
          )}
        </button>
        {showCategoryPicker && (
          <CategoryPicker
            categories={categories}
            currentId={categoryId}
            onSelect={handleCategorySelect}
            onClose={handleCategoryClose}
            onTab={handleCategoryTab}
          />
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          ref={creditRef}
          type="number"
          step="0.01"
          value={credit}
          onChange={handleCreditChange}
          onBlur={handleCreditBlur}
          onKeyDown={handleFieldKeyDown}
          placeholder="0.00"
          className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-right text-green-400 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          ref={debitRef}
          type="number"
          step="0.01"
          value={debit}
          onChange={handleDebitChange}
          onBlur={handleDebitBlur}
          onKeyDown={handleDebitKeyDown}
          placeholder="0.00"
          className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-right text-red-400 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td></td>
      <td className="px-2 py-2.5">
        <Button variant="ghost" size="sm" onClick={handleSave} title="Save transaction">
          <Save className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );

}
