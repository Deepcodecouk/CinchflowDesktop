import { create } from 'zustand';
import { callIpc, toErrorMessage } from '../lib/ipc-client';
import type { DbSetting } from '../../shared/types';

interface SettingsState {
  currencySymbol: string;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  setCurrency: (symbol: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currencySymbol: '£',
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });

    try {
      const setting = await callIpc<DbSetting | null>(
        window.api.settings.get('currency'),
        'Failed to fetch settings',
      );

      if (setting?.value) {
        set({ currencySymbol: setting.value, error: null });
      }
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to fetch settings') });
    } finally {
      set({ loading: false });
    }
  },

  setCurrency: async (symbol: string) => {
    try {
      await callIpc(window.api.settings.set('currency', symbol), 'Failed to save currency setting');
      set({ currencySymbol: symbol, error: null });
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to save currency setting') });
      throw error;
    }
  },
}));
