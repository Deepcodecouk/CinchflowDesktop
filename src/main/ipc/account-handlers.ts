import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { accountService } from '../services/account-service';
import { validateAccountData } from '../validators';
import { NotFoundError } from '../errors';

export function registerAccountHandlers(): void {
  ipcMain.handle(CHANNELS.ACCOUNTS_FIND_ALL, async () => {
    try {
      const data = accountService.getAllAccountsWithBalance();
      return { success: true, data };
    } catch (error) {
      console.error('accounts:findAll error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.ACCOUNTS_FIND_BY_ID, async (_event, id: string) => {
    try {
      const data = accountService.getAccountWithBalance(id);
      return { success: true, data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message };
      }
      console.error('accounts:findById error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.ACCOUNTS_CREATE, async (_event, data) => {
    try {
      const validation = validateAccountData(data);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      const result = accountService.createAccountWithBalance(data);
      return { success: true, data: result };
    } catch (error) {
      console.error('accounts:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.ACCOUNTS_UPDATE, async (_event, id: string, data) => {
    try {
      const result = accountService.updateAccountWithBalance(id, data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message };
      }
      console.error('accounts:update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.ACCOUNTS_DELETE, async (_event, id: string) => {
    try {
      const result = accountService.deleteAccount(id);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message };
      }
      console.error('accounts:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
