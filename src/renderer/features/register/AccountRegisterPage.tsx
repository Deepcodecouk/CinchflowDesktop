import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BalanceCards } from './components/BalanceCards';
import { RegisterDialogs } from './components/RegisterDialogs';
import { RegisterTable } from './components/RegisterTable';
import { RegisterToolbar } from './components/RegisterToolbar';
import { useRegisterController } from './hooks/use-register-controller';

export function AccountRegisterPage() {
  const controller = useRegisterController();

  if (!controller.accountId) {
    return (
      <div className="py-12 text-center text-zinc-400">
        Select an account from the navigation to view transactions.
      </div>
    );
  }

  if (!controller.viewData?.account && controller.loading) {
    return <div className="py-12 text-center text-zinc-400">Loading register data...</div>;
  }

  if (!controller.viewData?.account) {
    return (
      <div className="py-12 text-center text-zinc-400">
        {controller.error ?? 'Unable to load register data.'}
      </div>
    );
  }

  const viewData = controller.viewData;
  const viewModel = controller.registerViewModel;

  return (
    <div
      className={cn('relative flex h-full flex-col', controller.dragOver && 'ring-2 ring-blue-500 ring-inset')}
      onDragOver={controller.handleDragOver}
      onDragLeave={controller.handleDragLeave}
      onDrop={controller.handleDrop}
    >
      {controller.error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-700/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <span>{controller.error}</span>
          <button onClick={controller.dismissError} className="text-amber-200/80 hover:text-amber-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {controller.dragOver && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-blue-500/10">
          <div className="text-lg font-medium text-blue-400">Drop file to import</div>
        </div>
      )}

      <div className="flex-shrink-0 space-y-4 pb-4">
        <RegisterToolbar
          accountName={viewData.account.name}
          accountIcon={viewData.account.icon}
          year={controller.year}
          month={controller.month}
          hasFilters={controller.filters.hasFilters}
          onNavigateMonth={controller.navigateMonth}
          onNavigateTo={controller.handleNavigateTo}
          onClearFilters={controller.filters.clearFilters}
          onOpenAutoCategorise={controller.handleOpenAutoCategorise}
          onOpenImport={controller.handleOpenImport}
          onOpenImportHistory={controller.handleOpenImportHistory}
        />

        <BalanceCards
          openingBalance={viewModel?.summary.openingBalance ?? viewData.openingBalance}
          closingBalance={viewModel?.summary.closingBalance ?? viewData.openingBalance}
          currencySymbol={controller.currencySymbol}
        />
      </div>

      <RegisterTable
        loading={controller.loading}
        hasFilters={controller.filters.hasFilters}
        currencySymbol={controller.currencySymbol}
        categories={viewData.categories}
        year={controller.year}
        month={controller.month}
        viewModel={viewModel}
        filters={controller.filters}
        onUpdateTransaction={controller.handleUpdateTransaction}
        onDeleteTransaction={controller.handleDeleteTransaction}
        onToggleFlag={controller.handleToggleFlag}
        onCreateRule={controller.handleCreateRule}
        onOpenRuleForEdit={controller.openRuleForEdit}
        onUpdateNote={controller.handleUpdateNote}
        onCreateTransaction={controller.handleCreateTransaction}
      />

      <RegisterDialogs
        accountId={controller.accountId}
        year={controller.year}
        month={controller.month}
        categories={viewData.categories}
        loadData={controller.loadData}
        importOpen={controller.importOpen}
        dragFileContent={controller.dragFileContent}
        dragFileName={controller.dragFileName}
        autoCategoriseOpen={controller.autoCategoriseOpen}
        importHistoryOpen={controller.importHistoryOpen}
        quickRuleOpen={controller.quickRuleOpen}
        quickRuleDefaults={controller.quickRuleDefaults}
        quickRuleEdit={controller.quickRuleEdit}
        confirmProps={controller.confirmProps}
        filters={controller.filters}
        onImportClose={controller.handleImportClose}
        onImportHistoryClose={controller.handleImportHistoryClose}
        onAutoCategoriseClose={controller.handleAutoCategoriseClose}
        onQuickRuleClose={controller.handleQuickRuleClose}
        onQuickRuleSave={controller.handleQuickRuleSave}
      />
    </div>
  );
}
