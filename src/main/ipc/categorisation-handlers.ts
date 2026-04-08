import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { categorisationRuleRepository } from '../repositories/categorisation-rule-repository';
import { autoCategorisationService } from '../services/auto-categorisation-service';
import { validateCategorisationRuleData } from '../validators';

export function registerCategorisationHandlers(): void {
  ipcMain.handle(CHANNELS.RULES_FIND_BY_ID, async (_event, id: string) => {
    try {
      const data = categorisationRuleRepository.findById(id);
      if (!data) return { success: false, error: 'Rule not found' };
      return { success: true, data };
    } catch (error) {
      console.error('rules:findById error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.RULES_FIND_BY_ACCOUNT, async (_event, accountId: string) => {
    try {
      const data = categorisationRuleRepository.findByAccount(accountId);
      return { success: true, data };
    } catch (error) {
      console.error('rules:findByAccount error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.RULES_CREATE, async (_event, accountId: string, ruleData) => {
    try {
      const validation = validateCategorisationRuleData(ruleData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      const data = categorisationRuleRepository.create(accountId, ruleData);
      return { success: true, data };
    } catch (error) {
      console.error('rules:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.RULES_UPDATE, async (_event, id: string, ruleData) => {
    try {
      if (ruleData.match_text !== undefined || ruleData.match_type !== undefined) {
        const validation = validateCategorisationRuleData({
          match_text: ruleData.match_text ?? 'placeholder',
          match_type: ruleData.match_type ?? 'contains',
          ...ruleData,
        });
        if (!validation.isValid) {
          return { success: false, error: validation.error };
        }
      }
      const data = categorisationRuleRepository.update(id, ruleData);
      return { success: true, data };
    } catch (error) {
      console.error('rules:update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.RULES_DELETE, async (_event, id: string) => {
    try {
      const data = categorisationRuleRepository.delete(id);
      return { success: true, data };
    } catch (error) {
      console.error('rules:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_AUTO_CATEGORISE_PREVIEW, async (_event, accountId: string, year: number, month: number, mode: string) => {
    try {
      const validMode = mode === 'all' ? 'all' : 'uncategorised';
      const data = autoCategorisationService.preview(accountId, year, month, validMode);
      return { success: true, data };
    } catch (error) {
      console.error('autoCategorise:preview error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TRANSACTIONS_AUTO_CATEGORISE_APPLY, async (_event, accountId: string, proposals, overwrite: boolean) => {
    try {
      const data = autoCategorisationService.apply(accountId, proposals, overwrite);
      return { success: true, data };
    } catch (error) {
      console.error('autoCategorise:apply error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
