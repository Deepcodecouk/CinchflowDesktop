import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { UNCATEGORISED_CATEGORY_ID } from '../../shared/constants';
import { getDb } from '../db/connection';
import { cashflowQueryService } from '../services/cashflow-query-service';
import { buildDashboardBalanceSummary } from '../services/dashboard-balance-summary';
import { accountRepository } from '../repositories/account-repository';
import type {
  AccountBalance,
  DashboardBudgetProgressAccount,
  DashboardBudgetProgressItem,
} from '../../shared/types';

export function registerDashboardHandlers(): void {

  ipcMain.handle(CHANNELS.DASHBOARD_BALANCES, async (_event, year: number, month: number) => {

    try {

      const db = getDb();
      const accounts = accountRepository.findAll();
      const endDate = Date.UTC(year, month, 1) / 1000; // End of selected month

      const balances: AccountBalance[] = accounts.map((account) => {

        const result = db.prepare(
          'SELECT SUM(delta_value) as total FROM transactions WHERE account_id = ? AND date < ?',
        ).get(account.id, endDate) as { total: number | null };

        return {
          id: account.id,
          name: account.name,
          icon: account.icon,
          type: account.type,
          balance: result.total ?? 0,
        };
      
});

      return { success: true, data: balances };
    
} catch (error) {

      console.error('dashboard:balances error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

  ipcMain.handle(CHANNELS.DASHBOARD_BUDGET_PROGRESS, async (_event, year: number, month: number) => {

    try {

      const accounts = accountRepository.findAll();

      const result: DashboardBudgetProgressAccount[] = accounts.map((account) => {

        const tableData = cashflowQueryService.getTableData(account.id, year);

        const commentMap = new Map<string, string>();

        for (const entry of tableData.comments) {

          if (entry.month === month) {

            commentMap.set(entry.category_id ?? UNCATEGORISED_CATEGORY_ID, entry.comment);
          
}
        
}

        const items: DashboardBudgetProgressItem[] = tableData.hierarchies.flatMap((hierarchy) =>
          hierarchy.categories.map((category) => ({
            category_id: category.id,
            category_name: category.name,
            category_header_id: hierarchy.header.id,
            category_header_name: hierarchy.header.name,
            category_colour: hierarchy.header.colour,
            category_type: hierarchy.header.type,
            budget: tableData.budgetLookup[category.id]?.[month] ?? 0,
            actual: tableData.actualsLookup[category.id]?.[month] ?? 0,
            comment: commentMap.get(category.id) ?? null,
          })),
        );

        if (
          tableData.budgetLookup[UNCATEGORISED_CATEGORY_ID]?.[month] !== undefined
          || tableData.actualsLookup[UNCATEGORISED_CATEGORY_ID]?.[month] !== undefined
          || commentMap.has(UNCATEGORISED_CATEGORY_ID)
        ) {

          items.push({
            category_id: UNCATEGORISED_CATEGORY_ID,
            category_name: 'Uncategorised',
            category_header_id: UNCATEGORISED_CATEGORY_ID,
            category_header_name: 'Uncategorised',
            category_colour: '#71717a',
            category_type: 'variable_expense',
            budget: tableData.budgetLookup[UNCATEGORISED_CATEGORY_ID]?.[month] ?? 0,
            actual: tableData.actualsLookup[UNCATEGORISED_CATEGORY_ID]?.[month] ?? 0,
            comment: commentMap.get(UNCATEGORISED_CATEGORY_ID) ?? null,
          });
        
}

        return {
          account_id: account.id,
          account_name: account.name,
          account_icon: account.icon,
          balanceSummary: buildDashboardBalanceSummary(tableData, year, month),
          items,
        };
      
});

      return { success: true, data: result };
    
} catch (error) {

      console.error('dashboard:budgetProgress error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    
}
  
});

}
