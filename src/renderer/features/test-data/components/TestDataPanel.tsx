import { Database, Eraser } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useConfirm } from '../../../hooks/use-confirm';
import { useTestDataController } from '../hooks/use-test-data-controller';

export function TestDataPanel() {
  const { confirmProps, confirm } = useConfirm();
  const controller = useTestDataController();
  const hasTestData = controller.status?.hasTestData ?? false;
  const accountNames = controller.status?.accountNames ?? [];
  const isCreating = controller.action === 'create';
  const isRemoving = controller.action === 'remove';

  function handleCreateClick() {
    confirm({
      title: 'Create Test Account Data',
      message:
        'This will add three sample accounts, categorisation rules, recent transactions, and forecast budgets from three months ago to twelve months ahead. Continue?',
      confirmLabel: 'Create',
      onConfirm: controller.createTestData,
    });
  }

  function handleRemoveClick() {
    confirm({
      title: 'Remove Test Accounts',
      message:
        'This will permanently delete the sample accounts and all of their categories, rules, transactions, and forecast data.',
      confirmLabel: 'Remove',
      onConfirm: controller.removeTestData,
    });
  }

  return (
    <>
      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-200">Sample Data</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">Create a guided example workspace</p>
            <p className="text-xs text-zinc-400">
              Adds a current account, savings account, and credit account with realistic categories,
              auto-categorisation rules, recent transactions, and forecast budgets.
            </p>
          </div>

          {controller.statusMessage && (
            <div className="rounded-md border border-emerald-700/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              {controller.statusMessage}
            </div>
          )}

          {controller.errorMessage && (
            <div className="rounded-md border border-red-700/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {controller.errorMessage}
            </div>
          )}

          {hasTestData && accountNames.length > 0 && (
            <div className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-400">
              Sample accounts present: {accountNames.join(', ')}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!hasTestData && (
              <Button variant="secondary" onClick={handleCreateClick} disabled={isCreating || isRemoving}>
                <Database className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create test account data'}
              </Button>
            )}

            {hasTestData && (
              <Button variant="destructive" onClick={handleRemoveClick} disabled={isCreating || isRemoving}>
                <Eraser className="w-4 h-4" />
                {isRemoving ? 'Removing...' : 'Remove test accounts'}
              </Button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog {...confirmProps} />
    </>
  );
}
