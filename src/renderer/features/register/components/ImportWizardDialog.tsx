import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Upload, FileText, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { useSettingsStore } from '../../../stores/settings-store';
import type { ImportHandlerInfo, ImportTransformResult } from '../../../../shared/types';

type WizardStep = 'choose-file' | 'choose-format' | 'processing' | 'confirm' | 'importing' | 'complete';

interface ImportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  onComplete: () => void;
  initialFileContent?: string;
  initialFileName?: string;
}

export function ImportWizardDialog({ open, onClose, accountId, onComplete, initialFileContent, initialFileName }: ImportWizardDialogProps) {
  const { currencySymbol } = useSettingsStore();
  const [step, setStep] = useState<WizardStep>('choose-file');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [handlers, setHandlers] = useState<ImportHandlerInfo[]>([]);
  const [selectedHandler, setSelectedHandler] = useState('');
  const [transformResult, setTransformResult] = useState<ImportTransformResult | null>(null);
  const [importCount, setImportCount] = useState(0);
  const [error, setError] = useState('');
  const [autoCategorise, setAutoCategorise] = useState(true);

  function reset() {
    setStep('choose-file');
    setFileContent('');
    setFileName('');
    setHandlers([]);
    setSelectedHandler('');
    setTransformResult(null);
    setImportCount(0);
    setError('');
    setAutoCategorise(true);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // When opened with drag-and-drop file content, skip to choose-format
  useEffect(() => {
    if (open && initialFileContent && initialFileName) {
      setFileContent(initialFileContent);
      setFileName(initialFileName);
      window.api.import.getHandlers().then((res) => {
        if (res.success) {
          setHandlers(res.data ?? []);
        }
        setStep('choose-format');
      });
    }
  }, [open, initialFileContent, initialFileName]);

  async function handleChooseFile() {
    const result = await window.api.dialog.openFile([
      { name: 'Bank Statements', extensions: ['csv', 'ofx', 'qfx'] },
      { name: 'All Files', extensions: ['*'] },
    ]);
    if (result.success && result.data) {
      setFileContent(result.data.content);
      setFileName(result.data.filePath.split(/[/\\]/).pop() ?? 'file');

      const handlersRes = await window.api.import.getHandlers();
      if (handlersRes.success) {
        setHandlers(handlersRes.data ?? []);
      }
      setStep('choose-format');
    }
  }

  async function handleSelectFormat(handlerName: string) {
    setSelectedHandler(handlerName);
    setStep('processing');
    setError('');

    const result = await window.api.import.transform(accountId, handlerName, fileContent, autoCategorise);
    if (result.success && result.data) {
      const { toImport, skipped } = result.data;
      if (toImport.length === 0 && skipped.length === 0) {
        setError('No transactions could be parsed from this file with the selected format.');
        setStep('choose-format');
        return;
      }
      setTransformResult(result.data);
      setStep('confirm');
    } else {
      setError(result.error ?? 'No transactions could be parsed from this file with the selected format.');
      setStep('choose-format');
    }
  }

  async function handleImport() {
    if (!transformResult) return;
    setStep('importing');
    const result = await window.api.import.process(accountId, transformResult.toImport);
    if (result.success) {
      setImportCount(result.data.count);
      setStep('complete');
    } else {
      setError(result.error ?? 'Import failed');
      setStep('confirm');
    }
  }

  function handleDone() {
    handleClose();
    onComplete();
  }

  function handleOpenChange(v: boolean) {

    if (!v) handleClose();

  }

  function handleFormatClick(systemName: string) {

    return () => handleSelectFormat(systemName);

  }

  function handleAutoCategoriseChange(e: React.ChangeEvent<HTMLInputElement>) {

    setAutoCategorise(e.target.checked);

  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader title="Import Transactions" description={`Step: ${stepLabel(step)}`} />
        <div className="p-6 min-h-[200px]">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {step === 'choose-file' && (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">Choose a bank statement file to import</p>
              <Button onClick={handleChooseFile}>
                <FileText className="w-4 h-4" />
                Choose File
              </Button>
            </div>
          )}

          {step === 'choose-format' && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">File: <span className="text-zinc-200">{fileName}</span></p>
              <p className="text-sm text-zinc-300 mb-3">Choose the format of your file:</p>
              <div className="grid gap-2">
                {handlers.map((h) => (
                  <button
                    key={h.systemName}
                    onClick={handleFormatClick(h.systemName)}
                    className="text-left p-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="text-sm font-medium text-zinc-200">{h.title}</div>
                    <div className="text-xs text-zinc-500">{h.systemName}</div>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-4 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCategorise}
                  onChange={handleAutoCategoriseChange}
                  className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500"
                />
                Auto-categorise imported transactions using rules
              </label>
            </div>
          )}

          {(step === 'processing' || step === 'importing') && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-zinc-400">{step === 'processing' ? 'Parsing file...' : 'Importing transactions...'}</p>
            </div>
          )}

          {step === 'confirm' && transformResult && (
            <div>
              <p className="text-sm text-zinc-300 mb-3">
                <span className="font-semibold text-zinc-100">{transformResult.toImport.length}</span> transaction{transformResult.toImport.length !== 1 ? 's' : ''} to import
                {transformResult.skipped.length > 0 && (
                  <>, <span className="font-semibold text-amber-400">{transformResult.skipped.length}</span> duplicate{transformResult.skipped.length !== 1 ? 's' : ''} skipped</>
                )}
              </p>

              {transformResult.toImport.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-zinc-700 rounded-lg mb-3">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-800">
                      <tr className="border-b border-zinc-700">
                        <th className="text-left px-3 py-2 text-zinc-400">Date</th>
                        <th className="text-left px-3 py-2 text-zinc-400">Description</th>
                        <th className="text-left px-3 py-2 text-zinc-400">Category</th>
                        <th className="text-right px-3 py-2 text-zinc-400">Credit</th>
                        <th className="text-right px-3 py-2 text-zinc-400">Debit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformResult.toImport.map((tx, i) => (
                        <tr key={i} className="border-b border-zinc-800/50">
                          <td className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                            {new Date(tx.date * 1000).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-3 py-1.5 text-zinc-300 truncate max-w-[180px]">{tx.description}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">
                            {tx.category_name ? (
                              <span className="inline-flex items-center gap-1">
                                {tx.category_colour && (
                                  <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: tx.category_colour }} />
                                )}
                                <span className="text-zinc-300">{tx.category_name}</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500 italic">Uncategorised</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right text-green-400">
                            {tx.delta_value > 0 ? formatCurrency(tx.delta_value, currencySymbol) : '-'}
                          </td>
                          <td className="px-3 py-1.5 text-right text-red-400">
                            {tx.delta_value < 0 ? formatCurrency(Math.abs(tx.delta_value), currencySymbol) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {transformResult.skipped.length > 0 && (
                <>
                  <p className="text-sm text-amber-400/80 mb-2">Duplicates (will be skipped):</p>
                  <div className="max-h-32 overflow-y-auto border border-zinc-700/50 rounded-lg opacity-60">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-zinc-800">
                        <tr className="border-b border-zinc-700">
                          <th className="text-left px-3 py-2 text-zinc-400">Date</th>
                          <th className="text-left px-3 py-2 text-zinc-400">Description</th>
                          <th className="text-right px-3 py-2 text-zinc-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transformResult.skipped.map((tx, i) => (
                          <tr key={i} className="border-b border-zinc-800/50">
                            <td className="px-3 py-1.5 text-zinc-400 whitespace-nowrap">
                              {new Date(tx.date * 1000).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-3 py-1.5 text-zinc-400 truncate max-w-[200px]">{tx.description}</td>
                            <td className="px-3 py-1.5 text-right text-zinc-400">
                              {formatCurrency(Math.abs(tx.delta_value), currencySymbol)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-lg text-zinc-200 font-medium">Import Complete</p>
              <p className="text-zinc-400 mt-2">
                Successfully imported {importCount} transaction{importCount !== 1 ? 's' : ''}.
                {transformResult && transformResult.skipped.length > 0 && (
                  <> {transformResult.skipped.length} duplicate{transformResult.skipped.length !== 1 ? 's' : ''} skipped.</>
                )}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          {step === 'confirm' && transformResult && (
            <>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={transformResult.toImport.length === 0}>
                Import {transformResult.toImport.length} Transaction{transformResult.toImport.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleDone}>Close</Button>
          )}
          {(step === 'choose-file' || step === 'choose-format') && (
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function stepLabel(step: WizardStep): string {
  switch (step) {
    case 'choose-file': return 'Choose File';
    case 'choose-format': return 'Choose Format';
    case 'processing': return 'Processing';
    case 'confirm': return 'Confirm';
    case 'importing': return 'Importing';
    case 'complete': return 'Complete';
  }
}
