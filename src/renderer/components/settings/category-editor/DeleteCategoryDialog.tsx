import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';

export interface DeleteConfirmState {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  reassignTo: string | null;
}

interface DeleteCategoryDialogProps {
  state: DeleteConfirmState | null;
  reassignmentOptions: Array<{ id: string; name: string; headerName: string }>;
  onStateChange: (state: DeleteConfirmState | null) => void;
  onConfirm: () => void;
}

export function DeleteCategoryDialog({ state, reassignmentOptions, onStateChange, onConfirm }: DeleteCategoryDialogProps) {
  return (
    <RadixDialog.Root open={!!state} onOpenChange={(o) => !o && onStateChange(null)}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/60 z-[60]" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-[60]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <RadixDialog.Title className="text-sm font-semibold text-zinc-100">
              Delete Category
            </RadixDialog.Title>
            <RadixDialog.Close className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </RadixDialog.Close>
          </div>
          {state && (
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-300">
                <span className="font-medium">{state.categoryName}</span> has{' '}
                <span className="font-medium text-amber-400">{state.transactionCount}</span>{' '}
                transaction{state.transactionCount !== 1 ? 's' : ''}.
                What would you like to do with them?
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reassign"
                    checked={state.reassignTo === null}
                    onChange={() => onStateChange({ ...state, reassignTo: null })}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Set to uncategorised</span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reassign"
                    checked={state.reassignTo !== null}
                    onChange={() => onStateChange({ ...state, reassignTo: reassignmentOptions[0]?.id ?? null })}
                    className="accent-blue-500 mt-1"
                  />
                  <div className="space-y-1">
                    <span className="text-sm text-zinc-300">Move to another category</span>
                    {state.reassignTo !== null && (
                      <select
                        value={state.reassignTo}
                        onChange={(e) => onStateChange({ ...state, reassignTo: e.target.value })}
                        className="block w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {reassignmentOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.headerName} / {opt.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <Button variant="ghost" size="sm" onClick={() => onStateChange(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete & Reassign
                </Button>
              </div>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
