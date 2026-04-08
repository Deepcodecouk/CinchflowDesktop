import { Flag, Trash2, Wand2 } from 'lucide-react';
import type { TransactionWithCategory, CategoryHierarchy } from '../../../../shared/types';
import { cn, formatCurrency } from '../../../lib/utils';
import { CategoryPicker } from '../../../components/ui/category-picker';
import { useTransactionRowEditing } from '../hooks/use-transaction-row-editing';

export interface TransactionRowProps {

  transaction: TransactionWithCategory;
  balance: number;
  currencySymbol: string;
  categories: CategoryHierarchy[];
  onUpdate: (data: { date: number; description: string; category_id: string | null; delta_value: number }) => Promise<boolean> | boolean;
  onDelete: () => void;
  onToggleFlag: () => void;
  onCreateRule: () => void;
  onEditRule?: () => void;
  onUpdateNote: (note: string | null) => Promise<boolean> | boolean;

}

export function TransactionRow({
  transaction: tx,
  balance,
  currencySymbol,
  categories,
  onUpdate,
  onDelete,
  onToggleFlag,
  onCreateRule,
  onEditRule,
  onUpdateNote,
}: TransactionRowProps) {
  const editing = useTransactionRowEditing({
    transaction: tx,
    onUpdate,
    onUpdateNote,
  });

  const dateString = editing.dateObject.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  function handleEditValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    editing.setEditValue(e.target.value);
  }

  function handleEditRuleClick(e: React.MouseEvent) {

    e.stopPropagation();
    onEditRule?.();

  }

  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 group">
      {/* Flag */}
      <td className="px-2 py-2.5 text-center">
        <button onClick={onToggleFlag} className="p-0.5">
          <Flag className={cn('w-3.5 h-3.5', tx.is_flagged ? 'text-amber-400 fill-amber-400' : 'text-zinc-600')} />
        </button>
      </td>

      {/* Date */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        {editing.editingField === 'date' ? (
          <input
            autoFocus
            type="date"
            value={editing.editValue}
            onChange={handleEditValueChange}
            onBlur={editing.handleBlur}
            onKeyDown={(event) => editing.handleFieldKeyDown(event, 'date')}
            className="bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span
            onClick={() => editing.activateField('date')}
            className="cursor-pointer text-zinc-300 hover:text-zinc-100"
          >
            {dateString}
          </span>
        )}
      </td>

      {/* Description + Note */}
      <td className="px-3 py-2.5">
        {editing.editingField === 'description' ? (
          <input
            autoFocus
            type="text"
            value={editing.editValue}
            onChange={handleEditValueChange}
            onBlur={editing.handleBlur}
            onKeyDown={(event) => editing.handleFieldKeyDown(event, 'description')}
            className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <div>
            <div
              onClick={() => editing.activateField('description')}
              className="cursor-pointer text-zinc-200 hover:text-zinc-100"
            >
              {tx.description}
            </div>
            {editing.editingField === 'note' ? (
              <input
                autoFocus
                type="text"
                value={editing.editValue}
                onChange={handleEditValueChange}
                onBlur={editing.handleBlur}
                onKeyDown={(event) => editing.handleFieldKeyDown(event, 'note')}
                placeholder="Add a note..."
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 mt-0.5"
              />
            ) : (
              <div
                onClick={() => editing.activateField('note')}
                className="cursor-pointer text-xs text-zinc-500 mt-0.5 hover:text-zinc-400"
              >
                {tx.user_note || <span className="italic text-zinc-600">Add note...</span>}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Category */}
      <td className="px-3 py-2.5">
        <span
          onClick={() => editing.activateField('category')}
          className="cursor-pointer inline-flex items-center gap-1.5"
        >
          {tx.category_colour && (
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tx.category_colour }} />
          )}
          <span className={tx.category_name ? 'text-zinc-300' : 'text-zinc-500 italic'}>
            {tx.category_name ?? 'Uncategorised'}
          </span>
          {tx.categorised_by_rule_id && (
            <button
              type="button"
              title="Edit categorisation rule"
              className="inline-block ml-1"
              onClick={handleEditRuleClick}
            >
              <Wand2 className="w-3 h-3 text-zinc-500 hover:text-blue-400" />
            </button>
          )}
        </span>
        {editing.editingField === 'category' && (
          <CategoryPicker
            categories={categories}
            currentId={tx.category_id}
            onSelect={editing.handleCategorySelect}
            onClose={editing.handleCategoryPickerClose}
            onTab={editing.handleCategoryTab}
          />
        )}
      </td>

      {/* Credit */}
      <td className="px-3 py-2.5 text-right">
        {editing.editingField === 'credit' ? (
          <input
            autoFocus
            type="number"
            step="0.01"
            value={editing.editValue}
            onChange={handleEditValueChange}
            onBlur={editing.handleBlur}
            onKeyDown={(event) => editing.handleFieldKeyDown(event, 'credit')}
            className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-sm text-right text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span
            onClick={() => editing.activateField('credit')}
            className={cn(editing.isCredit ? 'text-green-400 cursor-pointer' : 'text-zinc-600 cursor-pointer')}
          >
            {editing.isCredit ? formatCurrency(Math.abs(tx.delta_value), currencySymbol) : '-'}
          </span>
        )}
      </td>

      {/* Debit */}
      <td className="px-3 py-2.5 text-right">
        {editing.editingField === 'debit' ? (
          <input
            autoFocus
            type="number"
            step="0.01"
            value={editing.editValue}
            onChange={handleEditValueChange}
            onBlur={editing.handleBlur}
            onKeyDown={(event) => editing.handleFieldKeyDown(event, 'debit')}
            className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-sm text-right text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span
            onClick={() => editing.activateField('debit')}
            className={cn(!editing.isCredit ? 'text-red-400 cursor-pointer' : 'text-zinc-600 cursor-pointer')}
          >
            {!editing.isCredit ? formatCurrency(Math.abs(tx.delta_value), currencySymbol) : '-'}
          </span>
        )}
      </td>

      {/* Balance */}
      <td className={cn('px-3 py-2.5 text-right font-medium', balance < 0 ? 'text-red-400' : 'text-zinc-200')}>
        {formatCurrency(balance, currencySymbol)}
      </td>

      {/* Actions */}
      <td className="px-2 py-2.5">
        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onCreateRule} className="p-1 text-zinc-500 hover:text-blue-400" title="Create rule from this transaction">
            <Wand2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 text-zinc-500 hover:text-red-400" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );

}
