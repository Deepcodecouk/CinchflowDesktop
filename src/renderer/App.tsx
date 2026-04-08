import { useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './routes/dashboard';
import { AccountRegisterPage } from './routes/account-register';
import { CashflowPage } from './routes/cashflow';
import { SettingsPage } from './routes/settings';
import { NotesPage } from './routes/notes';
import { PinLockScreen } from './components/ui/PinLockScreen';
import { useAccountsStore } from './stores/accounts-store';
import { useSettingsStore } from './stores/settings-store';
import { callIpc, toErrorMessage } from './lib/ipc-client';

export function App() {
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const [pinLocked, setPinLocked] = useState<boolean | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const checkPin = useCallback(async () => {
    try {
      const isSet = await callIpc<boolean>(window.api.pin.isSet(), 'Failed to check PIN status');
      setPinLocked(Boolean(isSet));
      setPinError(null);
    } catch (error) {
      setPinLocked(false);
      setPinError(toErrorMessage(error, 'Failed to check PIN status'));
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
    checkPin();
  }, [fetchAccounts, fetchSettings, checkPin]);

  function handleUnlock() {
    setPinLocked(false);
  }

  if (pinLocked === null) {
    return <div className="flex h-screen items-center justify-center text-sm text-zinc-400">Loading application...</div>;
  }

  return (
    <>
      {pinError && (
        <div className="border-b border-amber-700/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          {pinError}
        </div>
      )}
      {pinLocked && <PinLockScreen onUnlock={handleUnlock} />}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts/:accountId/:year/:month" element={<AccountRegisterPage />} />
            <Route path="/accounts/:accountId" element={<AccountRegisterPage />} />
            <Route path="/cashflow/:year" element={<CashflowPage />} />
            <Route path="/cashflow" element={<CashflowPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </>
  );
}
