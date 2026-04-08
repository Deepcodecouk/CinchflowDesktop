import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings-store';
import { cn, formatCurrency } from '../../../lib/utils';
import type { AutoCategorisePreview } from '../../../../shared/types';

type Step = 'loading' | 'preview' | 'applying' | 'complete';

interface AutoCategoriseDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  year: number;
  month: number;
  onComplete: () => void;
}

export function AutoCategoriseDialog({ open, onClose, accountId, year, month, onComplete }: AutoCategoriseDialogProps) {
  const { currencySymbol } = useSettingsStore();
  const [step, setStep] = useState<Step>('loading');
  const [mode, setMode] = useState<'uncategorised' | 'all'>('uncategorised');
  const [preview, setPreview] = useState<AutoCategorisePreview | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setStep('loading');
      setPreview(null);
      setAppliedCount(0);
      setError('');
      loadPreview('uncategorised');
    }
  }, [open]);

  async function loadPreview(m: 'uncategorised' | 'all') {
    setMode(m);
    setStep('loading');
    setError('');
    const res = await window.api.transactions.autoCategorisePreview(accountId, year, month, m);
    if (res.success && res.data) {
      setPreview(res.data);
      setStep('preview');
    } else {
      setError(res.error ?? 'Failed to generate preview');
      setStep('preview');
    }
  }

  async function handleApply() {
    if (!preview || preview.matched.length === 0) return;
    setStep('applying');
    const overwrite = mode === 'all';
    const res = await window.api.transactions.autoCategoriseApply(accountId, preview.matched, overwrite);
    if (res.success) {
      setAppliedCount(res.data ?? 0);
      setStep('complete');
    } else {
      setError(res.error ?? 'Failed to apply categorisation');
      setStep('preview');
    }
  }

  function handleDone() {
    onClose();
    onComplete();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader
          title="Auto-Categorise Transactions"
          description="Apply categorisation rules to transactions"
        />
        <div className="p-6 min-h-[200px]">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {(step === 'loading' || step === 'applying') && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-zinc-400">
                {step === 'loading' ? 'Evaluating rules...' : 'Applying categorisation...'}
              </p>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">Mode:</span>
                <button
                  onClick={() => loadPreview('uncategorised')}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    mode === 'uncategorised' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  Uncategorised only
                </button>
                <button
                  onClick={() => loadPreview('all')}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    mode === 'all' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  All transactions
                </button>
              </div>

              {/* Matched section */}
              {preview.matched.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-green-400 mb-2">
                    Matched ({preview.matched.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto border border-zinc-700 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-zinc-800">
                        <tr className="border-b border-zinc-700">
                          <th className="text-left px-3 py-2 text-zinc-400">Date</th>
                          <th className="text-left px-3 py-2 text-zinc-400">Description</th>
                          <th className="text-right px-3 py-2 text-zinc-400">Amount</th>
                          <th className="text-left px-3 py-2 text-zinc-400">Rule</th>
                          <th className="text-left px-3 py-2 text-zinc-400">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.matched.map((p) => (
                          <tr key={p.transaction_id} className="border-b border-zinc-800/50">
                            <td className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                              {new Date(p.transaction_date * 1000).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-3 py-1.5 text-zinc-300 truncate max-w-[180px]">{p.transaction_description}</td>
                            <td className={cn('px-3 py-1.5 text-right', p.transaction_amount > 0 ? 'text-green-400' : 'text-red-400')}>
                              {formatCurrency(Math.abs(p.transaction_amount), currencySymbol)}
                            </td>
                            <td className="px-3 py-1.5 text-zinc-500 font-mono truncate max-w-[120px]">{p.rule_match_text}</td>
                            <td className="px-3 py-1.5">
                              <span className="inline-flex items-center gap-1">
                                {p.category_colour && (
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.category_colour }} />
                                )}
                                <span className="text-zinc-300">{p.category_name}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Unmatched section */}
              {preview.unmatched.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">
                    Unmatched ({preview.unmatched.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto border border-zinc-700 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-zinc-800">
                        <tr className="border-b border-zinc-700">
                          <th className="text-left px-3 py-2 text-zinc-400">Date</th>
                          <th className="text-left px-3 py-2 text-zinc-400">Description</th>
                          <th className="text-right px-3 py-2 text-zinc-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.unmatched.map((tx) => (
                          <tr key={tx.id} className="border-b border-zinc-800/50">
                            <td className="px-3 py-1.5 text-zinc-400 whitespace-nowrap">
                              {new Date(tx.date * 1000).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-3 py-1.5 text-zinc-400 truncate max-w-[200px]">{tx.description}</td>
                            <td className={cn('px-3 py-1.5 text-right', tx.delta_value > 0 ? 'text-green-400' : 'text-red-400')}>
                              {formatCurrency(Math.abs(tx.delta_value), currencySymbol)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.matched.length === 0 && preview.unmatched.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  No transactions found for the selected mode.
                </div>
              )}

              {preview.matched.length === 0 && preview.unmatched.length > 0 && (
                <div className="text-center py-4 text-zinc-500 text-sm">
                  No rules matched any transactions. Create rules in Settings to auto-categorise.
                </div>
              )}
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-lg text-zinc-200 font-medium">Categorisation Complete</p>
              <p className="text-zinc-400 mt-2">
                Successfully categorised {appliedCount} transaction{appliedCount !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          {step === 'preview' && preview && preview.matched.length > 0 && (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleApply}>
                Apply to {preview.matched.length} Transaction{preview.matched.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'preview' && (!preview || preview.matched.length === 0) && (
            <Button variant="secondary" onClick={onClose}>Close</Button>
          )}
          {step === 'complete' && (
            <Button onClick={handleDone}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
