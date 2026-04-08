import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { useSettingsStore } from '../../../stores/settings-store';
import { cn, formatCurrency } from '../../../lib/utils';
import { callIpc, toErrorMessage } from '../../../lib/ipc-client';
import { MONTH_NAMES_SHORT } from '../../../../shared/constants';
import type { CashflowActualTransactionsFilter, CashflowActualTransactionsRequest, TransactionWithCategory } from '../../../../shared/types';

interface DrilldownDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  year: number;
  month: number;
  filter: CashflowActualTransactionsFilter;
}

export function DrilldownDialog({ open, onClose, accountId, year, month, filter }: DrilldownDialogProps) {

  const { currencySymbol } = useSettingsStore();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const title = filter.kind === 'header' ? filter.headerName : filter.categoryName;
  const showCategoryColumn = filter.kind === 'header';

  useEffect(() => {

    if (!open) {

      return;
    
}

    let isActive = true;
    const request: CashflowActualTransactionsRequest = {
      accountId,
      year,
      month,
      filter,
    };

    async function loadTransactions() {

      setLoading(true);
      setError(null);

      try {

        const nextTransactions = await callIpc<TransactionWithCategory[]>(
          window.api.cashflow.getActualTransactions(request),
          'Failed to load cashflow transactions',
        );

        if (isActive) {

          setTransactions(nextTransactions);
        
}
      
} catch (loadError) {

        if (isActive) {

          setTransactions([]);
          setError(toErrorMessage(loadError));
        
}
      
} finally {

        if (isActive) {

          setLoading(false);
        
}
      
}
    
}

    loadTransactions();

    return () => {

      isActive = false;
    
};
  
}, [open, accountId, year, month, filter]);

  const total = transactions.reduce((sum, tx) => sum + tx.delta_value, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn('w-[min(96vw,72rem)]', showCategoryColumn ? 'max-w-5xl' : 'max-w-3xl')}>
        <DialogHeader
          title={`${title} - ${MONTH_NAMES_SHORT[month - 1]} ${year}`}
          description={`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
        />
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Loading...</div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">No transactions found.</div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto border border-zinc-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-800">
                  <tr className="border-b border-zinc-700">
                    <th className="text-left px-3 py-2 text-zinc-400">Date</th>
                    <th className="text-left px-3 py-2 text-zinc-400">Description</th>
                    {showCategoryColumn && (
                      <th className="text-left px-3 py-2 text-zinc-400">Category</th>
                    )}
                    <th className="text-right px-3 py-2 text-zinc-400">Credit</th>
                    <th className="text-right px-3 py-2 text-zinc-400">Debit</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-zinc-800/50">
                      <td className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                        {new Date(tx.date * 1000).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-3 py-1.5 text-zinc-300 truncate max-w-[250px]">{tx.description}</td>
                      {showCategoryColumn && (
                        <td className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                          {tx.category_name ?? 'Uncategorised'}
                        </td>
                      )}
                      <td className="px-3 py-1.5 text-right text-green-400">
                        {tx.delta_value > 0 ? formatCurrency(tx.delta_value, currencySymbol) : '-'}
                      </td>
                      <td className="px-3 py-1.5 text-right text-red-400">
                        {tx.delta_value < 0 ? formatCurrency(Math.abs(tx.delta_value), currencySymbol) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700 bg-zinc-800/50">
                    <td colSpan={showCategoryColumn ? 3 : 2} className="px-3 py-2 text-zinc-300 font-medium">Total</td>
                    <td className="px-3 py-2 text-right font-medium text-green-400">
                      {total > 0 ? formatCurrency(total, currencySymbol) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-red-400">
                      {total < 0 ? formatCurrency(Math.abs(total), currencySymbol) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

}
