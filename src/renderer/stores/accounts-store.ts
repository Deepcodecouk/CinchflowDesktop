import { create } from 'zustand';
import { callIpc, toErrorMessage } from '../lib/ipc-client';
import type { AccountWithBalance } from '../../shared/types';

interface AccountsState {
  accounts: AccountWithBalance[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });

    try {
      const accounts = await callIpc<AccountWithBalance[]>(
        window.api.accounts.findAll(),
        'Failed to fetch accounts',
      );
      set({ accounts: accounts ?? [], error: null });
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to fetch accounts') });
    } finally {
      set({ loading: false });
    }
  },
}));
