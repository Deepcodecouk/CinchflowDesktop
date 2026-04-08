import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import { CHANNELS } from '../../shared/channels';
import { getImportHandlers, getImportHandler } from '../import-handlers';
import { importService } from '../services/import-service';
import { importRepository } from '../repositories/import-repository';

export function registerImportHandlers(): void {
  ipcMain.handle(CHANNELS.IMPORT_GET_HANDLERS, async () => {
    try {
      return { success: true, data: getImportHandlers() };
    } catch (error) {
      console.error('import:getHandlers error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.IMPORT_TRANSFORM, async (_event, accountId: string, handlerName: string, fileContent: string, autoCategorise: boolean) => {
    try {
      const handler = getImportHandler(handlerName);
      if (!handler) {
        return { success: false, error: `Unknown import handler: ${handlerName}` };
      }
      const parsed = handler.processFile(fileContent);
      if (parsed.length === 0) {
        return { success: false, error: 'No transactions could be parsed from this file with the selected format.' };
      }
      const data = importService.prepareImport(accountId, parsed, autoCategorise ?? false);
      return { success: true, data };
    } catch (error) {
      console.error('import:transform error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.IMPORT_PROCESS, async (_event, accountId: string, transactions) => {
    try {
      const data = importService.processImport(accountId, transactions);
      return { success: true, data };
    } catch (error) {
      console.error('import:process error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.IMPORT_GET_HISTORY, async (_event, accountId: string) => {
    try {
      const data = importRepository.getHistory(accountId);
      return { success: true, data };
    } catch (error) {
      console.error('import:getHistory error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.IMPORT_ROLLBACK, async (_event, importId: string) => {
    try {
      const data = importRepository.rollback(importId);
      return { success: true, data };
    } catch (error) {
      console.error('import:rollback error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.DIALOG_OPEN_FILE, async (_event, filters) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: 'No focused window' };

      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: filters ?? [
          { name: 'Bank Statements', extensions: ['csv', 'ofx', 'qfx'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null };
      }

      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: { filePath, content } };
    } catch (error) {
      console.error('dialog:openFile error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
