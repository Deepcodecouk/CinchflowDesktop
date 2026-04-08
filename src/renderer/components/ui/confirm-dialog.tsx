import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/60 z-[60]" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-[60]">
          <form onSubmit={(e) => { e.preventDefault(); onConfirm(); onClose(); }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <RadixDialog.Title className="text-sm font-semibold text-zinc-100">
                {title}
              </RadixDialog.Title>
              <RadixDialog.Close className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </RadixDialog.Close>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-300">{message}</p>
              <div className="flex items-center gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={destructive ? 'destructive' : 'primary'}
                  size="sm"
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </form>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
