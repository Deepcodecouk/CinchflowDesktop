import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { CategoryPicker } from '../ui/category-picker';
import { MATCH_TYPES } from '../../../shared/constants';
import type { DbCategorisationRule, CategoryHierarchy } from '../../../shared/types';

interface RuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    category_id: string;
    match_text: string;
    match_type: 'contains' | 'exact' | 'starts_with' | 'regex';
    min_amount: number | null;
    max_amount: number | null;
  }) => Promise<void> | void;
  rule: DbCategorisationRule | null;
  categories: CategoryHierarchy[];
  defaults?: {
    match_text?: string;
    match_type?: 'contains' | 'exact' | 'starts_with' | 'regex';
    min_amount?: number | null;
    max_amount?: number | null;
    category_id?: string;
  };
}

export function RuleFormDialog({ open, onClose, onSave, rule, categories, defaults }: RuleFormDialogProps) {
  const [matchText, setMatchText] = useState('');
  const [matchType, setMatchType] = useState<'contains' | 'exact' | 'starts_with' | 'regex'>('starts_with');
  const [categoryId, setCategoryId] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (rule) {
        setMatchText(rule.match_text);
        setMatchType(rule.match_type);
        setCategoryId(rule.category_id ?? '');
        setMinAmount(rule.min_amount !== null ? String(rule.min_amount) : '0');
        setMaxAmount(rule.max_amount !== null ? String(rule.max_amount) : '0');
      } else if (defaults) {
        setMatchText(defaults.match_text ?? '');
        setMatchType(defaults.match_type ?? 'starts_with');
        setCategoryId(defaults.category_id ?? '');
        setMinAmount(defaults.min_amount !== null && defaults.min_amount !== undefined ? String(defaults.min_amount) : '0');
        setMaxAmount(defaults.max_amount !== null && defaults.max_amount !== undefined ? String(defaults.max_amount) : '0');
      } else {
        setMatchText('');
        setMatchType('starts_with');
        setCategoryId('');
        setMinAmount('0');
        setMaxAmount('0');
      }
      setError('');
      setSaving(false);
    }
  }, [open, rule, defaults]);

  async function handleSubmit() {
    if (!matchText.trim()) {
      setError('Match text is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (matchType === 'regex') {
      try {
        new RegExp(matchText);
      } catch {
        setError('Invalid regular expression');
        return;
      }
    }
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    if (isNaN(min) || isNaN(max)) {
      setError('Min and max amounts are required');
      return;
    }
    if (min > max) {
      setError('Minimum amount must be less than or equal to maximum amount');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        category_id: categoryId,
        match_text: matchText.trim(),
        match_type: matchType,
        min_amount: min,
        max_amount: max,
      });
      onClose();
    } catch {
      setError('Failed to save rule. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const matchTypeLabels: Record<string, string> = {
    contains: 'Contains',
    exact: 'Exact Match',
    starts_with: 'Starts With',
    regex: 'Regex',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader
            title={rule ? 'Edit Rule' : 'Create Rule'}
            description="Define how transactions are automatically categorised"
          />
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Match Type</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as typeof matchType)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MATCH_TYPES.map((type) => (
                  <option key={type} value={type}>{matchTypeLabels[type]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Match Text</label>
              <input
                type="text"
                value={matchText}
                onChange={(e) => setMatchText(e.target.value)}
                placeholder="Enter text to match against description"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
              <button
                type="button"
                onClick={() => setCategoryPickerOpen(true)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryId ? (
                  <span className="text-zinc-100">
                    {categories.flatMap((h) => h.categories).find((c) => c.id === categoryId)?.name ?? 'Unknown'}
                  </span>
                ) : (
                  <span className="text-zinc-500">Select a category...</span>
                )}
              </button>
              {categoryPickerOpen && (
                <CategoryPicker
                  categories={categories}
                  currentId={categoryId || null}
                  onSelect={(id) => { setCategoryId(id ?? ''); setCategoryPickerOpen(false); }}
                  onClose={() => setCategoryPickerOpen(false)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Min Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Max Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : `${rule ? 'Update' : 'Create'} Rule`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
