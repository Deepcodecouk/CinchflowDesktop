import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { ACCOUNT_ICONS, ACCOUNT_TYPES } from '../../../shared/constants';
import { cn } from '../../lib/utils';
import type { AccountWithBalance } from '../../../shared/types';
import { useSettingsStore } from '../../stores/settings-store';

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    icon: string;
    type: 'current' | 'savings' | 'credit';
    openingBalance: number;
  }) => Promise<void>;
  account?: AccountWithBalance | null;
}

const TYPE_LABELS: Record<string, string> = {
  current: 'Current Account',
  savings: 'Savings Account',
  credit: 'Credit Card',
};

export function AccountFormDialog({ open, onClose, onSave, account }: AccountFormDialogProps) {
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0]);
  const [type, setType] = useState<'current' | 'savings' | 'credit'>('current');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setIcon(account.icon);
      setType(account.type);
      setOpeningBalance(account.opening_balance.toString());
    } else {
      setName('');
      setIcon(ACCOUNT_ICONS[0]);
      setType('current');
      setOpeningBalance('0');
    }
  }, [account, open]);

  const isValid = name.trim().length > 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        icon,
        type,
        openingBalance: parseFloat(openingBalance) || 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <DialogHeader title={account ? 'Edit Account' : 'Create Account'} />
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Current Account"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {ACCOUNT_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={cn(
                      'w-9 h-9 flex items-center justify-center rounded-md text-lg transition-all',
                      icon === emoji
                        ? 'bg-blue-600 ring-2 ring-blue-400 scale-110'
                        : 'bg-zinc-800 hover:bg-zinc-700',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Opening Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || saving}>
              {saving ? 'Saving...' : account ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
