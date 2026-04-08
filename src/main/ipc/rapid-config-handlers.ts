import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import { CHANNELS } from '../../shared/channels';
import { rapidConfigService } from '../services/rapid-config-service';

export function registerRapidConfigHandlers(): void {
  ipcMain.handle(CHANNELS.RAPID_CONFIG_PARSE, async (_event, content: string) => {
    try {
      const data = rapidConfigService.parseConfig(content);
      return { success: true, data };
    } catch (error) {
      console.error('rapidConfig:parse error:', error);
      return { success: false, error: 'Failed to parse configuration file' };
    }
  });

  ipcMain.handle(CHANNELS.RAPID_CONFIG_EXECUTE, async (_event, plan) => {
    try {
      const data = rapidConfigService.executeConfig(plan);
      return { success: true, data };
    } catch (error) {
      console.error('rapidConfig:execute error:', error);
      return { success: false, error: 'Failed to execute configuration' };
    }
  });

  ipcMain.handle(CHANNELS.RAPID_CONFIG_EXPORT, async () => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: 'No focused window' };

      const content = rapidConfigService.exportConfig();

      const result = await dialog.showSaveDialog(win, {
        defaultPath: 'cinchflow-config.txt',
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: true, data: null };
      }

      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, data: result.filePath };
    } catch (error) {
      console.error('rapidConfig:export error:', error);
      return { success: false, error: 'Failed to export configuration' };
    }
  });
}
