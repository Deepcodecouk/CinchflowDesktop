import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { CHANNELS } from '../../shared/channels';
import { settingsRepository } from '../repositories/settings-repository';
import { getDbPath, closeDb, checkpointWal } from '../db/connection';
import { runMigrations } from '../db/migrations';

export function registerSettingsHandlers(): void {
  ipcMain.handle(CHANNELS.SETTINGS_GET_ALL, async () => {
    try {
      const data = settingsRepository.findAll();
      return { success: true, data };
    } catch (error) {
      console.error('settings:getAll error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.SETTINGS_GET, async (_event, key: string) => {
    try {
      const data = settingsRepository.findByKey(key);
      return { success: true, data: data ?? null };
    } catch (error) {
      console.error('settings:get error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.SETTINGS_SET, async (_event, key: string, value: string) => {
    try {
      const data = settingsRepository.upsert(key, value);
      return { success: true, data };
    } catch (error) {
      console.error('settings:set error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.DB_BACKUP, async () => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: 'No focused window' };

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const defaultName = `cinchflow-backup-${dateStr}.db`;

      const result = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [{ name: 'Database Files', extensions: ['db'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: true, data: null };
      }

      checkpointWal();
      const dbPath = getDbPath();
      fs.copyFileSync(dbPath, result.filePath);
      return { success: true, data: result.filePath };
    } catch (error) {
      console.error('db:backup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.DB_RESTORE, async () => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: 'No focused window' };

      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Database Files', extensions: ['db'] }],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: false };
      }

      const sourcePath = result.filePaths[0];
      const dbPath = getDbPath();

      // Checkpoint WAL into main file, close DB, swap file, reopen and reload
      checkpointWal();
      closeDb();
      fs.copyFileSync(sourcePath, dbPath);
      runMigrations();
      win.webContents.reload();

      return { success: true, data: true };
    } catch (error) {
      console.error('db:restore error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
