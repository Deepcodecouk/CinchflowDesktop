import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useConfirm } from '../../../hooks/use-confirm';
import { Trash2, Loader2 } from 'lucide-react';
import type { DbImport } from '../../../../shared/types';

interface ImportWithCount extends DbImport {
  transaction_count: number;
}

interface ImportHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  onComplete: () => void;
}

export function ImportHistoryDialog({ open, onClose, accountId, onComplete }: ImportHistoryDialogProps) {
  const [imports, setImports] = useState<ImportWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState<string | null>(null);
  const { confirmProps, confirm } = useConfirm();

  useEffect(() => {
    if (open) {
      setLoading(true);
      window.api.import.getHistory(accountId).then((res) => {
        if (res.success) setImports(res.data ?? []);
        setLoading(false);
      });
    }
  }, [open, accountId]);

  function handleRollback(importId: string) {
    confirm({
      title: 'Rollback Import',
      message: 'This will permanently delete all transactions from this import. Continue?',
      confirmLabel: 'Rollback',
      onConfirm: async () => {
        setRolling(importId);
        const res = await window.api.import.rollback(importId);
        if (res.success) {
          setImports((prev) => prev.filter((i) => i.id !== importId));
          onComplete();
        }
        setRolling(null);
      },
    });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader
          title="Import History"
          description="View and rollback previous imports"
        />
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Loading...</div>
          ) : imports.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">No imports found for this account.</div>
          ) : (
            <div className="space-y-2">
              {imports.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 border border-zinc-700 rounded-lg"
                >
                  <div>
                    <div className="text-sm text-zinc-200">
                      {new Date(imp.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {imp.transaction_count} transaction{imp.transaction_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleRollback(imp.id)}
                    disabled={rolling === imp.id}
                  >
                    {rolling === imp.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Rollback
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog {...confirmProps} />
    </>
  );
}
