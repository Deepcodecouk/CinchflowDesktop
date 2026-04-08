import { cn, formatCurrency } from '../../../lib/utils';
import { getAccountTypeBadgeClass } from '../../../lib/styles';
import type { AccountBalance } from '../../../../shared/types';

interface DashboardAccountBalanceCardProps {

  account: AccountBalance;
  currencySymbol: string;
  onOpenRegister: (accountId: string) => void;

}

export function DashboardAccountBalanceCard({
  account,
  currencySymbol,
  onOpenRegister,
}: DashboardAccountBalanceCardProps) {

  function handleClick() {

    onOpenRegister(account.id);

  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:bg-zinc-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      title={`Open register for ${account.name}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span>{account.icon}</span>
        <span className="truncate text-sm font-medium text-zinc-300">{account.name}</span>
        <span className={cn('ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', getAccountTypeBadgeClass(account.type))}>
          {account.type}
        </span>
      </div>
      <div className={cn('text-xl font-semibold', account.balance < 0 ? 'text-red-400' : 'text-zinc-100')}>
        {formatCurrency(account.balance, currencySymbol)}
      </div>
    </button>
  );

}
