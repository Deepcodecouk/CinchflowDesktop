import { useEffect } from 'react';
import { CommentDialog } from './CommentDialog';
import { CashflowContextMenu } from './CashflowContextMenu';
import { CashflowTable } from './CashflowTable';
import { DrilldownDialog } from './DrilldownDialog';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useCashflowAccountController } from '../hooks/use-cashflow-account-controller';
import type { AccountWithBalance } from '../../../../shared/types';
import type { CashflowAccountDisplayMode, CarryForwardMode } from './cashflow-types';
import type { CashflowAccountSectionHandle } from '../hooks/use-cashflow-account-controller';
import type { CashflowSectionKey } from '../lib/cashflow-table-model';

interface CashflowAccountSectionProps {
  account: AccountWithBalance;
  year: number;
  currencySymbol: string;
  carryForwardMode: CarryForwardMode;
  showHistoricBudgets: boolean;
  displayMode: CashflowAccountDisplayMode;
  isActive: boolean;
  onActivate: (accountId: string) => void;
  onToggleDisplayMode: (accountId: string) => void;
  onOpenLinkedCategories: () => void;
  onRegisterSection: (accountId: string, handle: CashflowAccountSectionHandle) => () => void;
  onSyncLinkedBudget: (targetAccountId: string, targetCategoryId: string, month: number, amount: number) => void;
  onRefreshLinkedAccount: (targetAccountId: string) => Promise<void>;
  onRefreshVisibleAccounts: (originAccountId: string) => Promise<void>;
}

export function CashflowAccountSection({
  account,
  year,
  currencySymbol,
  carryForwardMode,
  showHistoricBudgets,
  displayMode,
  isActive,
  onActivate,
  onToggleDisplayMode,
  onOpenLinkedCategories,
  onRegisterSection,
  onSyncLinkedBudget,
  onRefreshLinkedAccount,
  onRefreshVisibleAccounts,
}: CashflowAccountSectionProps) {
  const controller = useCashflowAccountController({
    accountId: account.id,
    year,
    carryForwardMode,
    showHistoricBudgets,
    displayMode,
    isActive,
    onSyncLinkedBudget,
    onRefreshLinkedAccount,
    onRefreshVisibleAccounts,
  });

  useEffect(() => onRegisterSection(account.id, {
    refresh: controller.refreshData,
    refreshLinkedBudget: controller.refreshLinkedBudget,
    isSummaryOnly: () => displayMode === 'summary_only',
    areAllHeadersCollapsed: controller.areAllHeadersCollapsed,
    setAllHeadersCollapsed: controller.setAllHeadersCollapsed,
  }), [
    account.id,
    controller.areAllHeadersCollapsed,
    controller.refreshData,
    controller.refreshLinkedBudget,
    controller.setAllHeadersCollapsed,
    displayMode,
    onRegisterSection,
  ]);

  function handleActivate() {
    onActivate(account.id);
  }

  function handleToggleDisplayMode() {
    onToggleDisplayMode(account.id);
  }

  function handleToggleSectionCollapse(sectionKey: CashflowSectionKey) {
    controller.toggleSectionCollapse(sectionKey);
  }

  if (controller.loading || !controller.calc) {
    return (
      <div className="min-h-[12rem] rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-6 text-center text-zinc-400">
        Loading cashflow data for {account.icon} {account.name}...
      </div>
    );
  }

  return (
    <>
      <div
        ref={controller.editing.gridRef}
        tabIndex={0}
        className="min-h-0 rounded-b-lg border-b border-x border-zinc-800 bg-zinc-900 outline-none overflow-visible"
        onFocusCapture={handleActivate}
        onMouseDownCapture={handleActivate}
        onKeyDown={controller.handleGridKeyDown}
      >
        <CashflowTable
          accountName={account.name}
          accountIcon={account.icon}
          displayMode={displayMode}
          year={year}
          calc={controller.calc}
          currencySymbol={currencySymbol}
          collapsed={controller.collapsed}
          collapsedSections={controller.collapsedSections}
          editing={controller.editing}
          operations={controller.operations}
          showHistoricBudgets={showHistoricBudgets}
          onToggleCollapse={controller.toggleCollapse}
          onToggleSectionCollapse={handleToggleSectionCollapse}
          onOpenContextMenu={controller.handleOpenContextMenu}
          onOpenMonthContextMenu={controller.handleOpenMonthContextMenu}
          onDrilldown={controller.handleDrilldown}
          onOpenLinkedCategories={onOpenLinkedCategories}
          onToggleSummaryOnly={handleToggleDisplayMode}
        />
      </div>

      {controller.drilldown && (
        <DrilldownDialog
          open={!!controller.drilldown}
          onClose={controller.handleCloseDrilldown}
          accountId={account.id}
          year={year}
          month={controller.drilldown.month}
          filter={controller.drilldown.filter}
        />
      )}
      <CommentDialog
        open={!!controller.operations.commentDialog}
        comment={controller.operations.commentDialog?.text ?? ''}
        onSave={controller.operations.handleSaveComment}
        onClose={controller.handleCloseCommentDialog}
      />
      <CashflowContextMenu
        contextMenu={controller.contextMenu}
        onCloseContextMenu={controller.handleCloseContextMenu}
        onFillRight={controller.operations.handleFillRight}
        hasComment={controller.contextMenu ? controller.operations.getComment(controller.contextMenu.categoryId, controller.contextMenu.month) !== null : false}
        onAddComment={controller.operations.handleOpenCommentDialog}
        onEditComment={controller.operations.handleOpenCommentDialog}
        onDeleteComment={controller.operations.handleDeleteComment}
        monthContextMenu={controller.monthContextMenu}
        onCloseMonthContextMenu={controller.handleCloseMonthContextMenu}
        onCopyFromPreviousMonth={controller.operations.handleCopyFromPreviousMonth}
        onClearBudgetMonth={controller.operations.handleClearBudgetMonth}
      />
      <ConfirmDialog {...controller.confirmProps} />
    </>
  );
}
