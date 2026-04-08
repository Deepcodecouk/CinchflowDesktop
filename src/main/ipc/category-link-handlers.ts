import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { getDb } from '../db/connection';
import { categoryLinkRepository } from '../repositories/category-link-repository';

type CategoryLinkCreateRequest = {
  source_account_id: string;
  source_category_id: string;
  target_account_id: string;
  target_category_id: string;
};

function isIncomeType(type: string): boolean {
  return type === 'income_start' || type === 'income_end';
}

export function registerCategoryLinkHandlers(): void {
  ipcMain.handle(CHANNELS.CATEGORY_LINKS_FIND_ALL, async () => {
    try {
      const data = categoryLinkRepository.findAll();
      return { success: true, data };
    } catch (error) {
      console.error('categoryLinks:findAll error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_LINKS_FIND_BY_CATEGORY, async (_event, categoryId: string) => {
    try {
      const data = categoryLinkRepository.findByCategoryId(categoryId);
      return { success: true, data };
    } catch (error) {
      console.error('categoryLinks:findByCategory error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_LINKS_CREATE, async (_event, data: CategoryLinkCreateRequest) => {
    try {
      const db = getDb();

      if (data.source_account_id === data.target_account_id) {
        return { success: false, error: 'Source and target must be on different accounts' };
      }

      const sourceHeader = db.prepare(`
        SELECT ch.type
        FROM categories c
        JOIN category_headers ch ON ch.id = c.category_header_id
        WHERE c.id = ?
      `).get(data.source_category_id) as { type: string } | undefined;

      const targetHeader = db.prepare(`
        SELECT ch.type
        FROM categories c
        JOIN category_headers ch ON ch.id = c.category_header_id
        WHERE c.id = ?
      `).get(data.target_category_id) as { type: string } | undefined;

      if (!sourceHeader || !targetHeader) {
        return { success: false, error: 'Category not found' };
      }

      if (isIncomeType(sourceHeader.type) === isIncomeType(targetHeader.type)) {
        return {
          success: false,
          error: 'Linked categories must be opposite types (income <-> expense)',
        };
      }

      if (categoryLinkRepository.findByCategoryId(data.source_category_id).length > 0) {
        return { success: false, error: 'Source category already has a link' };
      }

      if (categoryLinkRepository.findByCategoryId(data.target_category_id).length > 0) {
        return { success: false, error: 'Target category already has a link' };
      }

      const result = categoryLinkRepository.create(data);
      return { success: true, data: result };
    } catch (error) {
      console.error('categoryLinks:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.CATEGORY_LINKS_DELETE, async (_event, id: string) => {
    try {
      const result = categoryLinkRepository.delete(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('categoryLinks:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
