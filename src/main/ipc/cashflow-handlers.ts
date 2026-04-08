import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { transaction } from '../db/connection';
import { cashflowQueryService } from '../services/cashflow-query-service';
import { budgetRepository } from '../repositories/budget-repository';
import { cashflowCommentRepository } from '../repositories/cashflow-comment-repository';
import { categoryLinkRepository } from '../repositories/category-link-repository';
import type { CashflowActualTransactionsRequest } from '../../shared/types';

function applyWithLinkedCategory(
  accountId: string,
  categoryId: string | null,
  fn: (accId: string, catId: string | null) => void,
) {

  fn(accountId, categoryId);

  if (!categoryId) {

    return;
  
}

  const linked = categoryLinkRepository.findLinkedCategory(accountId, categoryId);

  if (linked) {

    fn(linked.linkedAccountId, linked.linkedCategoryId);
  
}

}

export function registerCashflowHandlers(): void {

  ipcMain.handle(CHANNELS.CASHFLOW_GET_TABLE_DATA, async (_event, accountId: string, year: number) => {

    try {

      return { success: true, data: cashflowQueryService.getTableData(accountId, year) };
    
} catch (error) {

      console.error('cashflow:getTableData error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.CASHFLOW_GET_ACTUAL_TRANSACTIONS, async (_event, request: CashflowActualTransactionsRequest) => {

    try {

      return { success: true, data: cashflowQueryService.getActualTransactions(request) };
    
} catch (error) {

      console.error('cashflow:getActualTransactions error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.BUDGET_UPSERT, async (_event, accountId: string, categoryId: string | null, year: number, month: number, amount: number) => {

    try {

      const dbCategoryId = categoryId === '__uncategorised__' ? null : categoryId;
      const data = transaction(() => {

        const result = budgetRepository.upsert(accountId, dbCategoryId, year, month, amount);

        applyWithLinkedCategory(accountId, dbCategoryId, (linkedAccountId, linkedCategoryId) => {

          if (linkedAccountId !== accountId || linkedCategoryId !== dbCategoryId) {

            budgetRepository.upsert(linkedAccountId, linkedCategoryId, year, month, amount);
          
}
        
});

        return result;
      
});

      return { success: true, data };
    
} catch (error) {

      console.error('budget:upsert error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.BUDGET_FILL_RIGHT, async (_event, accountId: string, categoryId: string | null, year: number, fromMonth: number, amount: number, mode: string) => {

    try {

      const dbCategoryId = categoryId === '__uncategorised__' ? null : categoryId;
      const validMode = mode === 'empty_only' ? 'empty_only' : 'overwrite';

      transaction(() => {

        applyWithLinkedCategory(accountId, dbCategoryId, (linkedAccountId, linkedCategoryId) => {

          budgetRepository.fillRight(linkedAccountId, linkedCategoryId, year, fromMonth, amount, validMode);
        
});
      
});

      return { success: true, data: null };
    
} catch (error) {

      console.error('budget:fillRight error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.BUDGET_COPY_FROM_PREVIOUS_MONTH, async (_event, accountId: string, year: number, month: number, mode: string) => {

    try {

      const validMode = mode === 'empty_only' ? 'empty_only' : 'overwrite';
      const data = transaction(() => budgetRepository.copyFromPreviousMonth(accountId, year, month, validMode));

      return { success: true, data };
    
} catch (error) {

      console.error('budget:copyFromPreviousMonth error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.BUDGET_COPY_FROM_PREVIOUS_YEAR, async (_event, accountId: string, year: number, mode: string) => {

    try {

      const validMode = mode === 'empty_only' ? 'empty_only' : 'overwrite';
      const data = transaction(() => budgetRepository.copyFromPreviousYear(accountId, year, validMode));

      return { success: true, data };
    
} catch (error) {

      console.error('budget:copyFromPreviousYear error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.BUDGET_CLEAR_MONTH, async (_event, accountId: string, year: number, month: number) => {

    try {

      const data = transaction(() => budgetRepository.clearMonth(accountId, year, month));

      return { success: true, data };
    
} catch (error) {

      console.error('budget:clearMonth error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.CASHFLOW_COMMENTS_GET, async (_event, accountId: string, year: number) => {

    try {

      const data = cashflowCommentRepository.findByAccountAndYear(accountId, year);

      return { success: true, data };
    
} catch (error) {

      console.error('cashflowComments:get error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.CASHFLOW_COMMENTS_UPSERT, async (_event, accountId: string, categoryId: string | null, year: number, month: number, comment: string) => {

    try {

      const dbCategoryId = categoryId === '__uncategorised__' ? null : categoryId;
      const data = cashflowCommentRepository.upsert(accountId, dbCategoryId, year, month, comment);

      return { success: true, data };
    
} catch (error) {

      console.error('cashflowComments:upsert error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.CASHFLOW_COMMENTS_DELETE, async (_event, id: string) => {

    try {

      const data = cashflowCommentRepository.delete(id);

      return { success: true, data };
    
} catch (error) {

      console.error('cashflowComments:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

}
