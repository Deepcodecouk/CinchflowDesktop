import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { getDb } from '../db/connection';
import { transaction } from '../db/connection';
import { categoryHeaderRepository } from '../repositories/category-header-repository';
import { categoryRepository } from '../repositories/category-repository';
import { validateCategoryHeaderData, validateCategoryData } from '../validators';

export function registerCategoryHandlers(): void {
  ipcMain.handle(CHANNELS.CATEGORY_HEADERS_FIND_BY_ACCOUNT, async (_event, accountId: string) => {
    try {
      const data = categoryHeaderRepository.findByAccount(accountId);
      return { success: true, data };
    } catch (error) {
      console.error('categoryHeaders:findByAccount error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_HEADERS_FIND_HIERARCHICAL, async (_event, accountId: string) => {
    try {
      const data = categoryHeaderRepository.findHierarchical(accountId);
      return { success: true, data };
    } catch (error) {
      console.error('categoryHeaders:findHierarchical error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_HEADERS_CREATE, async (_event, data) => {
    try {
      const validation = validateCategoryHeaderData(data);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      const result = categoryHeaderRepository.create(data);
      return { success: true, data: result };
    } catch (error) {
      console.error('categoryHeaders:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_HEADERS_UPDATE, async (_event, id: string, data) => {
    try {
      const result = categoryHeaderRepository.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('categoryHeaders:update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_HEADERS_DELETE, async (_event, id: string) => {
    try {
      const result = categoryHeaderRepository.delete(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('categoryHeaders:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  // Categories
  ipcMain.handle(CHANNELS.CATEGORIES_CREATE, async (_event, data) => {
    try {
      const validation = validateCategoryData(data);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      const result = categoryRepository.create(data);
      return { success: true, data: result };
    } catch (error) {
      console.error('categories:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORIES_UPDATE, async (_event, id: string, data) => {
    try {
      const result = categoryRepository.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('categories:update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORIES_DELETE, async (_event, id: string) => {
    try {
      const result = categoryRepository.delete(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('categories:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORIES_COUNT_TRANSACTIONS, async (_event, categoryId: string) => {
    try {
      const db = getDb();
      const result = db.prepare(
        'SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND is_opening_balance = 0',
      ).get(categoryId) as { count: number };
      return { success: true, data: result.count };
    } catch (error) {
      console.error('categories:countTransactions error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORIES_DELETE_WITH_REASSIGNMENT, async (_event, categoryId: string, reassignTo: string | null) => {
    try {
      transaction(() => {
        const db = getDb();
        // Reassign transactions: null = uncategorised, string = another category ID
        db.prepare('UPDATE transactions SET category_id = ?, updated_at = ? WHERE category_id = ?')
          .run(reassignTo, Date.now(), categoryId);
        // Also reassign budget amounts
        if (reassignTo === null) {
          // Move to uncategorised - check if target budget exists first
          const budgets = db.prepare('SELECT * FROM budget_amounts WHERE category_id = ?').all(categoryId) as Array<{ id: string; account_id: string; year: number; month: number; amount: number }>;
          for (const b of budgets) {
            const existing = db.prepare(
              'SELECT id FROM budget_amounts WHERE account_id = ? AND category_id IS NULL AND year = ? AND month = ?',
            ).get(b.account_id, b.year, b.month);
            if (!existing) {
              db.prepare('UPDATE budget_amounts SET category_id = NULL, updated_at = ? WHERE id = ?')
                .run(Date.now(), b.id);
            } else {
              db.prepare('DELETE FROM budget_amounts WHERE id = ?').run(b.id);
            }
          }
        } else {
          // Merge budgets into target category
          const budgets = db.prepare('SELECT * FROM budget_amounts WHERE category_id = ?').all(categoryId) as Array<{ id: string; account_id: string; year: number; month: number; amount: number }>;
          for (const b of budgets) {
            const existing = db.prepare(
              'SELECT id FROM budget_amounts WHERE account_id = ? AND category_id = ? AND year = ? AND month = ?',
            ).get(b.account_id, reassignTo, b.year, b.month);
            if (!existing) {
              db.prepare('UPDATE budget_amounts SET category_id = ?, updated_at = ? WHERE id = ?')
                .run(reassignTo, Date.now(), b.id);
            } else {
              db.prepare('DELETE FROM budget_amounts WHERE id = ?').run(b.id);
            }
          }
        }
        // Also reassign categorisation rules
        db.prepare('UPDATE categorisation_rules SET category_id = ?, updated_at = ? WHERE category_id = ?')
          .run(reassignTo, Date.now(), categoryId);
        // Delete the category itself
        categoryRepository.delete(categoryId);
      });
      return { success: true, data: true };
    } catch (error) {
      console.error('categories:deleteWithReassignment error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
