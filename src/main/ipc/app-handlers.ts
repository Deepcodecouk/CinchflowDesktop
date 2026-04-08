import { app, ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { toDisplayVersion } from '../../shared/version';

export function registerAppHandlers(): void {
  ipcMain.handle(CHANNELS.APP_GET_INFO, async () => {
    try {
      const version = app.getVersion();
      return {
        success: true,
        data: {
          version,
          displayVersion: toDisplayVersion(version),
        },
      };
    } catch (error) {
      console.error('app:getInfo error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
