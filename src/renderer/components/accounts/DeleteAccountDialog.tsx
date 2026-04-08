import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import type { AccountWithBalance } from '../../../shared/types';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  account: AccountWithBalance | null;
}

export function DeleteAccountDialog({ open, onClose, onConfirm, account }: DeleteAccountDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }}>
          <DialogHeader title="Delete Account" />
          <div className="p-6">
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete <strong>{account.icon} {account.name}</strong>?
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              This will permanently delete the account and all its transactions,
              categories, categorisation rules, budget amounts, and import history.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
