import type { CategoryHierarchy } from '../../../../shared/types';
import type { RegisterFilterActions, RegisterFilters } from '../hooks/use-register-filters';
import type { RegisterViewModel } from '../lib/register-view-model';
import { NewTransactionRow } from './NewTransactionRow';
import { RegisterTableHeader } from './RegisterTableHeader';
import { TransactionRow } from './TransactionRow';

interface RegisterTableProps {
  loading: boolean;
  hasFilters: boolean;
  currencySymbol: string;
  categories: CategoryHierarchy[];
  year: number;
  month: number;
  viewModel: RegisterViewModel | null;
  filters: RegisterFilters & RegisterFilterActions;
  onUpdateTransaction: (
    id: string,
    data: { date: number; description: string; category_id: string | null; delta_value: number },
  ) => Promise<boolean> | boolean;
  onDeleteTransaction: (id: string) => void;
  onToggleFlag: (id: string) => Promise<boolean> | boolean;
  onCreateRule: (transaction: RegisterViewModel['rows'][number]['transaction']) => void;
  onOpenRuleForEdit: (ruleId: string) => void;
  onUpdateNote: (id: string, note: string | null) => Promise<boolean> | boolean;
  onCreateTransaction: (data: {
    date: number;
    description: string;
    category_id: string | null;
    delta_value: number;
    user_note: string | null;
  }) => Promise<boolean> | boolean;
}

export function RegisterTable({
  loading,
  hasFilters,
  currencySymbol,
  categories,
  year,
  month,
  viewModel,
  filters,
  onUpdateTransaction,
  onDeleteTransaction,
  onToggleFlag,
  onCreateRule,
  onOpenRuleForEdit,
  onUpdateNote,
  onCreateTransaction,
}: RegisterTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900">
      <table className="w-full text-sm">
        <RegisterTableHeader categories={categories} filters={filters} />
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-zinc-500">
                Loading...
              </td>
            </tr>
          ) : (viewModel?.rows.length ?? 0) === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-zinc-500">
                {hasFilters ? 'No transactions match the current filters' : 'No transactions this month'}
              </td>
            </tr>
          ) : (
            viewModel?.rows.map((row) => (
              <TransactionRow
                key={row.transaction.id}
                transaction={row.transaction}
                balance={row.runningBalance}
                currencySymbol={currencySymbol}
                categories={categories}
                onUpdate={(data) => onUpdateTransaction(row.transaction.id, data)}
                onDelete={() => onDeleteTransaction(row.transaction.id)}
                onToggleFlag={() => onToggleFlag(row.transaction.id)}
                onCreateRule={() => onCreateRule(row.transaction)}
                onEditRule={
                  row.transaction.categorised_by_rule_id
                    ? () => onOpenRuleForEdit(row.transaction.categorised_by_rule_id!)
                    : undefined
                }
                onUpdateNote={(note) => onUpdateNote(row.transaction.id, note)}
              />
            ))
          )}
          <NewTransactionRow
            currencySymbol={currencySymbol}
            categories={categories}
            onSave={onCreateTransaction}
            defaultYear={year}
            defaultMonth={month}
          />
        </tbody>
      </table>
    </div>
  );
}
