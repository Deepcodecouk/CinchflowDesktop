import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { testDataService } from '../features/test-data/test-data-service';

export function registerTestDataHandlers(): void {
  ipcMain.handle(CHANNELS.TEST_DATA_GET_STATUS, async () => {
    try {
      const data = testDataService.getStatus();
      return { success: true, data };
    } catch (error) {
      console.error('testData:getStatus error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.TEST_DATA_CREATE, async () => {
    try {
      const data = testDataService.create();
      return { success: true, data };
    } catch (error) {
      console.error('testData:create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  });

  ipcMain.handle(CHANNELS.TEST_DATA_REMOVE, async () => {
    try {
      const data = testDataService.remove();
      return { success: true, data };
    } catch (error) {
      console.error('testData:remove error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  });
}
