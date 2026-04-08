import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { transactionRepository } from '../repositories/transaction-repository';
import { validateTransactionData } from '../validators';
import { NotFoundError } from '../errors';
import { registerQueryService } from '../services/register-query-service';
import type { CreateTransactionData, TransactionSearchParams, UpdateTransactionData } from '../../shared/types';

export function registerTransactionHandlers(): void {
  ipcMain.handle(CHANNELS.REGISTER_GET_VIEW_DATA, async (_event, accountId: string, year: number, month: number) => {
    try {
      const data = registerQueryService.getViewData(accountId, year, month);
      return { success: true, data };
    } catch (error) {
      console.error('register:getViewData error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_FIND_BY_MONTH, async (_event, accountId: string, year: number, month: number) => {
    try {
      const data = transactionRepository.findByMonth(accountId, year, month);
      return { success: true, data };
    } catch (error) {
      console.error('transactions:findByMonth error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_GET_OPENING_BALANCE, async (_event, accountId: string, year: number, month: number) => {
    try {
      const data = transactionRepository.getOpeningBalanceForMonth(accountId, year, month);
      return { success: true, data };
    } catch (error) {
      console.error('transactions:getOpeningBalance error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_CREATE, async (_event, accountId: string, data: CreateTransactionData) => {
    try {
      const validation = validateTransactionData(data as unknown as Record<string, unknown>);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const result = transactionRepository.create({ ...data, account_id: accountId });
      return { success: true, data: result };
    } catch (error) {
      console.error('transactions:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_UPDATE, async (_event, id: string, data: UpdateTransactionData) => {
    try {
      const validation = validateTransactionData(data as unknown as Record<string, unknown>);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const result = transactionRepository.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message };
      }

      console.error('transactions:update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_DELETE, async (_event, id: string) => {
    try {
      const result = transactionRepository.delete(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('transactions:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_UPDATE_NOTE, async (_event, id: string, note: string | null) => {
    try {
      const result = transactionRepository.updateNote(id, note);
      return { success: true, data: result };
    } catch (error) {
      console.error('transactions:updateNote error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_TOGGLE_FLAG, async (_event, id: string) => {
    try {
      const result = transactionRepository.toggleFlag(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('transactions:toggleFlag error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_SEARCH, async (_event, params: TransactionSearchParams) => {
    try {
      const data = transactionRepository.search(params);
      return { success: true, data };
    } catch (error) {
      console.error('transactions:search error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}


