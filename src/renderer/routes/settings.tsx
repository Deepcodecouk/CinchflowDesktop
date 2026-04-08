import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, List, Tags, Lock, LockOpen } from 'lucide-react';
import { useAccountsStore } from '../stores/accounts-store';
import { useSettingsStore } from '../stores/settings-store';
import { AccountFormDialog } from '../components/accounts/AccountFormDialog';
import { DeleteAccountDialog } from '../components/accounts/DeleteAccountDialog';
import { CategoryEditorDialog } from '../components/settings/CategoryEditorDialog';
import { RulesDialog } from '../components/settings/RulesDialog';
import { RapidConfigDialog } from '../components/settings/RapidConfigDialog';
import { PinSetupDialog } from '../components/settings/PinSetupDialog';
import { PinClearDialog } from '../components/settings/PinClearDialog';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { TestDataPanel } from '../features/test-data/components/TestDataPanel';
import { useConfirm } from '../hooks/use-confirm';
import { callIpc, toErrorMessage } from '../lib/ipc-client';
import { cn, formatCurrency } from '../lib/utils';
import { getAccountTypeBadgeClass } from '../lib/styles';
import { CURRENCY_SYMBOLS } from '../../shared/constants';
import type { AccountWithBalance } from '../../shared/types';

interface AccountFormValues {
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
  openingBalance: number;
}

export function SettingsPage() {
  const { accounts, fetchAccounts } = useAccountsStore();
  const { currencySymbol, setCurrency } = useSettingsStore();
  const { confirmProps, confirm } = useConfirm();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<AccountWithBalance | null>(null);
  const [categoryEditorAccount, setCategoryEditorAccount] = useState<AccountWithBalance | null>(null);
  const [rulesAccount, setRulesAccount] = useState<AccountWithBalance | null>(null);
  const [configPlan, setConfigPlan] = useState<unknown>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [pinIsSet, setPinIsSet] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [pinClearOpen, setPinClearOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkPinStatus = useCallback(async () => {
    try {
      const isSet = await callIpc<boolean>(window.api.pin.isSet(), 'Failed to check PIN status');
      setPinIsSet(Boolean(isSet));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to check PIN status'));
    }
  }, []);

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

  function clearMessages() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function refreshAccountsWithMessage(successMessage?: string) {
    await fetchAccounts();

    if (successMessage) {
      setStatusMessage(successMessage);
    }
  }

  async function handleCreateAccount(data: AccountFormValues) {
    try {
      await callIpc(window.api.accounts.create({ ...data, openingBalance: data.openingBalance }), 'Failed to create account');
      clearMessages();
      await refreshAccountsWithMessage('Account created successfully.');
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to create account'));
    }
  }

  async function handleUpdateAccount(data: AccountFormValues) {
    if (!editingAccount) {
      return;
    }

    try {
      await callIpc(
        window.api.accounts.update(editingAccount.id, { ...data, openingBalance: data.openingBalance }),
        'Failed to update account',
      );
      clearMessages();
      await refreshAccountsWithMessage('Account updated successfully.');
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to update account'));
    }
  }

  async function handleDeleteAccount() {
    if (!deletingAccount) {
      return;
    }

    try {
      await callIpc(window.api.accounts.delete(deletingAccount.id), 'Failed to delete account');
      clearMessages();
      await refreshAccountsWithMessage('Account deleted successfully.');
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to delete account'));
    }
  }

  async function handleBackupDatabase() {
    try {
      const backupPath = await callIpc<string | null>(window.api.db.backup(), 'Failed to back up database');

      if (backupPath) {
        setStatusMessage(`Backup saved to ${backupPath}`);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to back up database'));
    }
  }

  function handleRestoreDatabase() {
    confirm({
      title: 'Restore Database',
      message: 'This will replace all current data with the backup. The application will restart. Continue?',
      confirmLabel: 'Restore',
      onConfirm: async () => {
        try {
          const restored = await callIpc<boolean>(window.api.db.restore(), 'Failed to restore database');

          if (!restored) {
            setStatusMessage('Restore cancelled.');
          }
        } catch (error) {
          setErrorMessage(toErrorMessage(error, 'Failed to restore database'));
        }
      },
    });
  }

  async function handleImportConfig() {
    try {
      const file = await callIpc<{ filePath: string; content: string } | null>(
        window.api.dialog.openFile([
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ]),
        'Failed to open configuration file',
      );

      if (!file) {
        return;
      }

      const parsedPlan = await callIpc<unknown>(window.api.rapidConfig.parse(file.content), 'Failed to parse configuration file');
      setConfigPlan(parsedPlan);
      setConfigDialogOpen(true);
      setErrorMessage(null);
      setStatusMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to import configuration file'));
    }
  }

  function handlePinSet() {
    setPinSetupOpen(false);
    setPinIsSet(true);
    setStatusMessage('Startup PIN set successfully.');
    setErrorMessage(null);
  }

  function handlePinCleared() {
    setPinClearOpen(false);
    setPinIsSet(false);
    setStatusMessage('Startup PIN cleared successfully.');
    setErrorMessage(null);
  }

  async function handleExportConfig() {
    try {
      const exportPath = await callIpc<string | null>(window.api.rapidConfig.export(), 'Failed to export configuration');

      if (exportPath) {
        setStatusMessage(`Configuration exported to ${exportPath}`);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to export configuration'));
    }
  }

  async function handleExecuteConfig() {
    try {
      const result = await callIpc<{ accountsCreated: number; headersCreated: number; categoriesCreated: number; rulesCreated: number }>(window.api.rapidConfig.execute(configPlan), 'Failed to import configuration');
      await fetchAccounts();
      setStatusMessage(
        `Import complete: ${result.accountsCreated} accounts, ${result.headersCreated} headers, ${result.categoriesCreated} categories, ${result.rulesCreated} rules created.`,
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to import configuration'));
    }
  }

  function handleAddAccountClick() {
    setEditingAccount(null);
    setFormOpen(true);
  }

  function handleEditAccountClick(account: AccountWithBalance) {
    setEditingAccount(account);
    setFormOpen(true);
  }

  function handleCategoryEditorClick(account: AccountWithBalance) {
    setCategoryEditorAccount(account);
  }

  function handleRulesClick(account: AccountWithBalance) {
    setRulesAccount(account);
  }

  function handleDeleteAccountClick(account: AccountWithBalance) {
    setDeletingAccount(account);
    setDeleteOpen(true);
  }

  async function handleCurrencyChange(event: React.ChangeEvent<HTMLSelectElement>) {
    try {
      await setCurrency(event.target.value);
      setStatusMessage('Currency updated successfully.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to save currency setting'));
    }
  }

  function handleClearPinClick() {
    setPinClearOpen(true);
  }

  function handleSetPinClick() {
    setPinSetupOpen(true);
  }

  function handleAccountFormClose() {
    setFormOpen(false);
    setEditingAccount(null);
  }

  function handleDeleteDialogClose() {
    setDeleteOpen(false);
    setDeletingAccount(null);
  }

  function handleCategoryEditorClose() {
    setCategoryEditorAccount(null);
  }

  function handleRulesClose() {
    setRulesAccount(null);
  }

  function handlePinSetupClose() {
    setPinSetupOpen(false);
  }

  function handlePinClearClose() {
    setPinClearOpen(false);
  }

  function handleConfigDialogClose() {
    setConfigDialogOpen(false);
    setConfigPlan(null);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {statusMessage && (
        <div className="rounded-lg border border-emerald-700/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-700/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-200">Accounts</h2>
          <Button size="sm" onClick={handleAddAccountClick}>
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 py-12 text-center">
            <p className="text-zinc-400">No accounts yet. Create your first account to get started.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Account</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Opening Balance</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <span className="mr-2">{account.icon}</span>
                      <span className="text-zinc-100">{account.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded px-2 py-0.5 text-xs font-medium capitalize',
                          getAccountTypeBadgeClass(account.type),
                        )}
                      >
                        {account.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-200">
                      {formatCurrency(account.opening_balance, currencySymbol)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditAccountClick(account)} title="Edit account">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Categories" onClick={() => handleCategoryEditorClick(account)}>
                          <Tags className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Categorisation Rules" onClick={() => handleRulesClick(account)}>
                          <List className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccountClick(account)}
                          title="Delete account"
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
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-200">Currency</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Currency Symbol</label>
          <select
            value={currencySymbol}
            onChange={handleCurrencyChange}
            className="w-48 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCY_SYMBOLS.map((currency) => (
              <option key={currency.code} value={currency.symbol}>
                {currency.symbol} - {currency.code}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-200">Security</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Startup PIN</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {pinIsSet
                  ? 'A PIN is currently set. You will be asked for it on startup.'
                  : 'Require a PIN to access the application on startup.'}
              </p>
            </div>
            {pinIsSet ? (
              <Button variant="secondary" onClick={handleClearPinClick}>
                <LockOpen className="w-4 h-4" />
                Clear PIN
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleSetPinClick}>
                <Lock className="w-4 h-4" />
                Set PIN
              </Button>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-200">Database</h2>
        <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <Button variant="secondary" onClick={handleBackupDatabase}>
            Backup Database
          </Button>
          <Button variant="secondary" onClick={handleRestoreDatabase}>
            Restore Database
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-200">Advanced</h2>
        <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <Button variant="secondary" onClick={handleImportConfig}>
            Import Configuration File
          </Button>
          <Button variant="secondary" onClick={handleExportConfig}>
            Export Configuration File
          </Button>
        </div>
      </section>

      <TestDataPanel />

      <AccountFormDialog
        open={formOpen}
        onClose={handleAccountFormClose}
        onSave={editingAccount ? handleUpdateAccount : handleCreateAccount}
        account={editingAccount}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteAccount}
        account={deletingAccount}
      />

      <CategoryEditorDialog
        open={!!categoryEditorAccount}
        onClose={handleCategoryEditorClose}
        accountId={categoryEditorAccount?.id ?? ''}
        accountName={categoryEditorAccount?.name ?? ''}
      />

      <RulesDialog
        open={!!rulesAccount}
        onClose={handleRulesClose}
        accountId={rulesAccount?.id ?? ''}
        accountName={rulesAccount?.name ?? ''}
      />
      <ConfirmDialog {...confirmProps} />

      <PinSetupDialog open={pinSetupOpen} onClose={handlePinSetupClose} onPinSet={handlePinSet} />
      <PinClearDialog open={pinClearOpen} onClose={handlePinClearClose} onPinCleared={handlePinCleared} />

      <RapidConfigDialog
        open={configDialogOpen}
        onClose={handleConfigDialogClose}
        plan={configPlan as any}
        onConfirm={handleExecuteConfig}
      />
    </div>
  );
}
