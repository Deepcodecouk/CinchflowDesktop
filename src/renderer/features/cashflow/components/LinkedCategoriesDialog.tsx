import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAccountsStore } from '../../../stores/accounts-store';
import type { CategoryLinkWithNames, CategoryHierarchy } from '../../../../shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function LinkedCategoriesDialog({ open, onClose, onChanged }: Props) {
  const { accounts } = useAccountsStore();
  const [links, setLinks] = useState<CategoryLinkWithNames[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating a new link
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [sourceCategoryId, setSourceCategoryId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [sourceHierarchies, setSourceHierarchies] = useState<CategoryHierarchy[]>([]);
  const [targetHierarchies, setTargetHierarchies] = useState<CategoryHierarchy[]>([]);

  useEffect(() => {
    if (open) loadLinks();
  }, [open]);

  async function loadLinks() {
    const res = await window.api.categoryLinks.findAll();
    if (res.success && res.data) setLinks(res.data);
  }

  useEffect(() => {
    if (sourceAccountId) {
      window.api.categoryHeaders.findHierarchical(sourceAccountId).then((res: { success: boolean; data?: CategoryHierarchy[] }) => {
        if (res.success && res.data) setSourceHierarchies(res.data);
      });
    } else {
      setSourceHierarchies([]);
    }
    setSourceCategoryId('');
  }, [sourceAccountId]);

  useEffect(() => {
    if (targetAccountId) {
      window.api.categoryHeaders.findHierarchical(targetAccountId).then((res: { success: boolean; data?: CategoryHierarchy[] }) => {
        if (res.success && res.data) setTargetHierarchies(res.data);
      });
    } else {
      setTargetHierarchies([]);
    }
    setTargetCategoryId('');
  }, [targetAccountId]);

  async function handleCreate() {
    setError(null);
    if (!sourceAccountId || !sourceCategoryId || !targetAccountId || !targetCategoryId) {
      setError('All fields are required');
      return;
    }
    const res = await window.api.categoryLinks.create({
      source_account_id: sourceAccountId,
      source_category_id: sourceCategoryId,
      target_account_id: targetAccountId,
      target_category_id: targetCategoryId,
    });
    if (res.success) {
      setCreating(false);
      setSourceAccountId('');
      setSourceCategoryId('');
      setTargetAccountId('');
      setTargetCategoryId('');
      setError(null);
      await loadLinks();
      onChanged();
    } else {
      setError(res.error ?? 'Failed to create link');
    }
  }

  async function handleDelete(id: string) {
    await window.api.categoryLinks.delete(id);
    await loadLinks();
    onChanged();
  }

  function renderCategorySelect(
    hierarchies: CategoryHierarchy[],
    value: string,
    onChange: (val: string) => void,
  ) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select category...</option>
        {hierarchies.map((h) => (
          <optgroup key={h.header.id} label={h.header.name}>
            {h.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <Dialog.Title className="text-sm font-semibold text-zinc-100">
              Linked Categories
            </Dialog.Title>
            <Dialog.Close className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-xs text-zinc-400">
              Link an expense category in one account to an income category in another.
              When a budget value is edited for either, the other updates automatically.
            </p>

            {/* Existing links */}
            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-300">{link.source_account_name}</span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-zinc-100 font-medium">{link.source_category_name}</span>
                      <LinkIcon className="w-3 h-3 text-blue-400" />
                      <span className="text-zinc-300">{link.target_account_name}</span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-zinc-100 font-medium">{link.target_category_name}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {links.length === 0 && !creating && (
              <div className="text-center py-4 text-zinc-500 text-xs">No linked categories yet.</div>
            )}

            {/* Create form */}
            {creating ? (
              <div className="bg-zinc-800/50 rounded-lg p-3 space-y-3">
                <div className="text-xs font-medium text-zinc-300">Create Link</div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded px-2 py-1">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Source Account</label>
                    <select
                      value={sourceAccountId}
                      onChange={(e) => setSourceAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select account...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Source Category</label>
                    {renderCategorySelect(sourceHierarchies, sourceCategoryId, setSourceCategoryId)}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Target Account</label>
                    <select
                      value={targetAccountId}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select account...</option>
                      {accounts.filter((a) => a.id !== sourceAccountId).map((a) => (
                        <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Target Category</label>
                    {renderCategorySelect(targetHierarchies, targetCategoryId, setTargetCategoryId)}
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setCreating(false); setError(null); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreate}>
                    Create Link
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
                <LinkIcon className="w-3.5 h-3.5 mr-1" />
                Add Link
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
