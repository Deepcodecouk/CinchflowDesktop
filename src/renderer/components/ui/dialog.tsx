import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  children,
  className,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const firstInput = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
            'input:not([type="hidden"]), textarea, select',
          );
          firstInput?.focus();
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between p-6 pb-0">
      <div>
        <DialogPrimitive.Title className="text-lg font-semibold text-zinc-100">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="text-sm text-zinc-400 mt-1">
            {description}
          </DialogPrimitive.Description>
        )}
      </div>
      <DialogPrimitive.Close className="text-zinc-400 hover:text-zinc-200 rounded-md p-1 hover:bg-zinc-800 transition-colors">
        <X className="w-4 h-4" />
      </DialogPrimitive.Close>
    </div>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 p-6 pt-4">
      {children}
    </div>
  );
}
