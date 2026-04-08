import { CashflowAccountSection } from './components/CashflowAccountSection';
import { CashflowToolbar } from './components/CashflowToolbar';
import { LinkedCategoriesDialog } from './components/LinkedCategoriesDialog';
import { useCashflowPageController } from './hooks/use-cashflow-page-controller';

export function CashflowPage() {
  const controller = useCashflowPageController();

  function handleLinkedCategoriesChanged() {
    void controller.refreshVisibleAccounts();
  }

  if (controller.accountsLoading || !controller.selectionReady) {
    return <div className="py-12 text-center text-zinc-400">Loading cashflow data...</div>;
  }

  if (controller.accounts.length === 0) {
    return <div className="py-12 text-center text-zinc-400">Create an account to start budgeting.</div>;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="px-6 pt-4">
        <CashflowToolbar
          year={controller.year}
          selectedAccountIds={controller.selectedAccountIds}
          accounts={controller.accounts}
          carryForwardMode={controller.carryForwardMode}
          showHistoricBudgets={controller.showHistoricBudgets}
          onNavigateYear={controller.changeYear}
          onToggleAccount={controller.toggleAccount}
          onToggleCollapseAll={controller.toggleCollapseAllVisible}
          onOpenLinkedCategories={controller.openLinkedCategories}
          onChangeCarryForwardMode={controller.handleCarryForwardModeChange}
          onToggleHistoricBudgets={controller.handleToggleHistoricBudgets}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-full flex-col gap-8 px-[5px]">
          {controller.selectedAccounts.map((account) => (
            <CashflowAccountSection
              key={account.id}
              account={account}
              year={controller.year}
              currencySymbol={controller.currencySymbol}
              carryForwardMode={controller.carryForwardMode}
              showHistoricBudgets={controller.showHistoricBudgets}
              displayMode={controller.accountDisplayModeById[account.id] ?? 'full'}
              isActive={controller.activeAccountId === account.id}
              onActivate={controller.setActiveAccountId}
              onToggleDisplayMode={controller.toggleAccountDisplayMode}
              onOpenLinkedCategories={controller.openLinkedCategories}
              onRegisterSection={controller.registerSection}
              onSyncLinkedBudget={controller.syncLinkedBudget}
              onRefreshLinkedAccount={controller.refreshLinkedAccount}
              onRefreshVisibleAccounts={controller.refreshVisibleAccounts}
            />
          ))}
        </div>
      </div>

      <LinkedCategoriesDialog
        open={controller.linkedCategoriesOpen}
        onClose={controller.closeLinkedCategories}
        onChanged={handleLinkedCategoriesChanged}
      />
    </div>
  );
}
