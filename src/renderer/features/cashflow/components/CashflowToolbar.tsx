import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Link as LinkIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import type { AccountWithBalance } from '../../../../shared/types';
import type { CarryForwardMode } from './cashflow-types';

interface CashflowToolbarProps {
  year: number;
  selectedAccountIds: string[];
  accounts: AccountWithBalance[];
  carryForwardMode: CarryForwardMode;
  showHistoricBudgets: boolean;
  onNavigateYear: (delta: number) => void;
  onToggleAccount: (accountId: string) => void;
  onToggleCollapseAll: () => void;
  onOpenLinkedCategories: () => void;
  onChangeCarryForwardMode: (mode: CarryForwardMode) => void;
  onToggleHistoricBudgets: () => void;
}

const CARRY_FORWARD_CYCLE: CarryForwardMode[] = ['hybrid', 'budget', 'actual'];
const CARRY_FORWARD_LABELS: Record<CarryForwardMode, string> = {
  hybrid: 'Hybrid',
  budget: 'Budget',
  actual: 'Actual',
};

export function CashflowToolbar({
  year,
  selectedAccountIds,
  accounts,
  carryForwardMode,
  showHistoricBudgets,
  onNavigateYear,
  onToggleAccount,
  onToggleCollapseAll,
  onOpenLinkedCategories,
  onChangeCarryForwardMode,
  onToggleHistoricBudgets,
}: CashflowToolbarProps) {
  function handleCycleCarryForward() {
    const idx = CARRY_FORWARD_CYCLE.indexOf(carryForwardMode);
    const next = CARRY_FORWARD_CYCLE[(idx + 1) % CARRY_FORWARD_CYCLE.length];
    onChangeCarryForwardMode(next);
  }

  function handlePreviousYear() {
    onNavigateYear(-1);
  }

  function handleNextYear() {
    onNavigateYear(1);
  }

  function handleAccountItemSelect(event: Event) {
    event.preventDefault();

    const accountId = (event.currentTarget as HTMLElement).dataset.accountId;

    if (accountId) {
      onToggleAccount(accountId);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-16 text-center text-lg font-semibold">{year}</span>
          <Button variant="ghost" size="sm" onClick={handleNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Accounts ({selectedAccountIds.length})
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="z-50 min-w-[14rem] rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl"
            >
              {accounts.map((account) => (
                <DropdownMenu.CheckboxItem
                  key={account.id}
                  data-account-id={account.id}
                  checked={selectedAccountIds.includes(account.id)}
                  disabled={selectedAccountIds.length === 1 && selectedAccountIds.includes(account.id)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-200 outline-none hover:bg-zinc-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                  onSelect={handleAccountItemSelect}
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    <DropdownMenu.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-blue-400" />
                    </DropdownMenu.ItemIndicator>
                  </span>
                  <span className="truncate">
                    {account.icon} {account.name}
                  </span>
                </DropdownMenu.CheckboxItem>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleHistoricBudgets}
          className="flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-400"
        >
          <span>Historic budgets</span>
          <div
            className={cn(
              'relative h-[18px] w-8 rounded-full transition-colors',
              showHistoricBudgets ? 'bg-blue-600' : 'bg-zinc-600',
            )}
          >
            <div
              className={cn(
                'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-transform',
                showHistoricBudgets ? 'translate-x-[14px]' : 'translate-x-[2px]',
              )}
            />
          </div>
        </button>
        <button
          onClick={handleCycleCarryForward}
          className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-zinc-400"
          title="Click to cycle: Hybrid -> Budget -> Actual"
        >
          <span>Carry forward</span>
          <span className="min-w-[52px] rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center font-medium text-zinc-100">
            {CARRY_FORWARD_LABELS[carryForwardMode]}
          </span>
        </button>
        <Button variant="ghost" size="sm" onClick={onOpenLinkedCategories}>
          <LinkIcon className="h-4 w-4" />
          Links
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleCollapseAll}>
          <ChevronsUpDown className="h-4 w-4" />
          Toggle All
        </Button>
      </div>
    </div>
  );
}
