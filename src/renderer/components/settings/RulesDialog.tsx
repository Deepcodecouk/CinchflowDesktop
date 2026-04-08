import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { useConfirm } from '../../hooks/use-confirm';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { RuleFormDialog } from './RuleFormDialog';
import { useSettingsStore } from '../../stores/settings-store';
import { formatCurrency } from '../../lib/utils';
import type { DbCategorisationRule, CategoryHierarchy } from '../../../shared/types';

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

type SortField = 'match_text' | 'category_name';
type SortDir = 'asc' | 'desc';

export function RulesDialog({ open, onClose, accountId, accountName }: RulesDialogProps) {
  const { currencySymbol } = useSettingsStore();
  const [rules, setRules] = useState<DbCategorisationRule[]>([]);
  const [categories, setCategories] = useState<CategoryHierarchy[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DbCategorisationRule | null>(null);
  const [sortField, setSortField] = useState<SortField>('match_text');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const { confirmProps, confirm } = useConfirm();

  // Build a category name lookup
  const categoryNameLookup = new Map<string, string>();
  for (const h of categories) {
    for (const c of h.categories) {
      categoryNameLookup.set(c.id, c.name);
    }
  }

  const loadData = useCallback(async () => {
    if (!accountId) return;
    const [rulesRes, catRes] = await Promise.all([
      window.api.rules.findByAccount(accountId),
      window.api.categoryHeaders.findHierarchical(accountId),
    ]);
    if (rulesRes.success) setRules(rulesRes.data ?? []);
    if (catRes.success) setCategories(catRes.data ?? []);
  }, [accountId]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  // Sort rules in memory
  const sortedRules = [...rules].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'match_text') {
      comparison = a.match_text.localeCompare(b.match_text, undefined, { sensitivity: 'base' });
    } else {
      const nameA = a.category_id ? (categoryNameLookup.get(a.category_id) ?? '') : '';
      const nameB = b.category_id ? (categoryNameLookup.get(b.category_id) ?? '') : '';
      comparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  async function handleCreateRule(data: {
    category_id: string;
    match_text: string;
    match_type: 'contains' | 'exact' | 'starts_with' | 'regex';
    min_amount: number | null;
    max_amount: number | null;
  }) {
    await window.api.rules.create(accountId, data);
    await loadData();
  }

  async function handleUpdateRule(data: {
    category_id: string;
    match_text: string;
    match_type: 'contains' | 'exact' | 'starts_with' | 'regex';
    min_amount: number | null;
    max_amount: number | null;
  }) {
    if (!editingRule) return;
    await window.api.rules.update(editingRule.id, data);
    await loadData();
  }

  function handleDeleteRule(id: string) {
    confirm({
      title: 'Delete Rule',
      message: 'Are you sure you want to delete this rule?',
      onConfirm: async () => {
        await window.api.rules.delete(id);
        await loadData();
      },
    });
  }

  const matchTypeLabels: Record<string, string> = {
    contains: 'Contains',
    exact: 'Exact',
    starts_with: 'Starts With',
    regex: 'Regex',
  };

  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 inline-block ml-1" />
      : <ArrowDown className="w-3 h-3 inline-block ml-1" />;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader
            title="Categorisation Rules"
            description={`Rules for ${accountName}`}
          />
          <div className="p-6 overflow-y-auto min-h-0">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => { setEditingRule(null); setFormOpen(true); }}>
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </div>

            {sortedRules.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                No categorisation rules yet. Create one to get started.
              </div>
            ) : (
              <div className="border border-zinc-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-800">
                      <th
                        className="text-left px-3 py-2.5 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 select-none"
                        onClick={() => toggleSort('match_text')}
                      >
                        Match Text <SortIndicator field="match_text" />
                      </th>
                      <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">Type</th>
                      <th
                        className="text-left px-3 py-2.5 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 select-none"
                        onClick={() => toggleSort('category_name')}
                      >
                        Category <SortIndicator field="category_name" />
                      </th>
                      <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Min</th>
                      <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Max</th>
                      <th className="w-20 px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="px-3 py-2 text-zinc-200 font-mono text-xs">{rule.match_text}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                            {matchTypeLabels[rule.match_type]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-300">
                          {rule.category_id ? (categoryNameLookup.get(rule.category_id) ?? 'Unknown') : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-400">
                          {rule.min_amount !== null ? formatCurrency(rule.min_amount, currencySymbol) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-400">
                          {rule.max_amount !== null ? formatCurrency(rule.max_amount, currencySymbol) : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingRule(rule); setFormOpen(true); }}
                              title="Edit rule"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              title="Delete rule"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RuleFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingRule(null); }}
        onSave={editingRule ? handleUpdateRule : handleCreateRule}
        rule={editingRule}
        categories={categories}
      />
      <ConfirmDialog {...confirmProps} />
    </>
  );
}
