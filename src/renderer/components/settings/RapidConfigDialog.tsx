import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { CollapsibleAccount } from './CollapsibleAccount';

export interface ConfigPlan {
  accounts: ConfigAccountPlan[];
}

export interface ConfigAccountPlan {
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
  openingBalance: number;
  categoryTypes: ConfigCategoryTypePlan[];
}

interface ConfigCategoryTypePlan {
  typeName: string;
  type: string;
  headers: ConfigHeaderPlan[];
}

interface ConfigHeaderPlan {
  name: string;
  colour: string;
  categories: ConfigCategoryPlan[];
}

interface ConfigCategoryPlan {
  name: string;
  rules: ConfigRulePlan[];
}

interface ConfigRulePlan {
  matchText: string;
  matchType: string;
  minAmount: number;
  maxAmount: number;
}

interface RapidConfigDialogProps {
  open: boolean;
  onClose: () => void;
  plan: ConfigPlan | null;
  onConfirm: () => void;
}

export function RapidConfigDialog({ open, onClose, plan, onConfirm }: RapidConfigDialogProps) {

  if (!plan) return null;

  function handleOpenChange(open: boolean) {

    if (!open) onClose();

  }

  function handleImport() {

    onConfirm();
    onClose();

  }

  const totalAccounts = plan.accounts.length;
  const totalHeaders = plan.accounts.reduce(
    (sum, a) => sum + a.categoryTypes.reduce((s, ct) => s + ct.headers.length, 0),
    0,
  );
  const totalCategories = plan.accounts.reduce(
    (sum, a) =>
      sum + a.categoryTypes.reduce((s, ct) => s + ct.headers.reduce((h, hh) => h + hh.categories.length, 0), 0),
    0,
  );
  const totalRules = plan.accounts.reduce(
    (sum, a) =>
      sum +
      a.categoryTypes.reduce(
        (s, ct) =>
          s + ct.headers.reduce((h, hh) => h + hh.categories.reduce((c, cc) => c + cc.rules.length, 0), 0),
        0,
      ),
    0,
  );

  return (
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/60 z-[60]" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <RadixDialog.Title className="text-sm font-semibold text-zinc-100">
              Import Configuration Preview
            </RadixDialog.Title>
            <RadixDialog.Close className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </RadixDialog.Close>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            <div className="text-xs text-zinc-400 bg-zinc-800 rounded px-3 py-2">
              This will create: <strong className="text-zinc-200">{totalAccounts}</strong> accounts,{' '}
              <strong className="text-zinc-200">{totalHeaders}</strong> category headers,{' '}
              <strong className="text-zinc-200">{totalCategories}</strong> categories, and{' '}
              <strong className="text-zinc-200">{totalRules}</strong> rules.
            </div>

            {plan.accounts.map((account, idx) => (
              <CollapsibleAccount key={idx} account={account} />
            ))}
          </div>

          <div className="flex items-center gap-2 justify-end px-4 py-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
            >
              Import
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
