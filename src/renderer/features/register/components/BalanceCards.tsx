import { cn, formatCurrency } from '../../../lib/utils';

interface BalanceCardsProps {

  openingBalance: number;
  closingBalance: number;
  currencySymbol: string;

}

export function BalanceCards({ openingBalance, closingBalance, currencySymbol }: BalanceCardsProps) {

  const netChange = closingBalance - openingBalance;

  return (
    <div className="flex gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Opening Balance</div>
        <div className={cn('text-lg font-semibold mt-0.5', openingBalance < 0 ? 'text-red-400' : 'text-zinc-100')}>
          {formatCurrency(openingBalance, currencySymbol)}
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Net Change</div>
        <div className={cn(
          'text-lg font-semibold mt-0.5',
          netChange > 0 ? 'text-green-400' : netChange < 0 ? 'text-red-400' : 'text-zinc-100',
        )}>
          {netChange > 0 ? '+' : ''}{formatCurrency(netChange, currencySymbol)}
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Closing Balance</div>
        <div className={cn('text-lg font-semibold mt-0.5', closingBalance < 0 ? 'text-red-400' : 'text-zinc-100')}>
          {formatCurrency(closingBalance, currencySymbol)}
        </div>
      </div>
    </div>
  );

}
