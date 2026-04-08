import { createHash } from 'node:crypto';
import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { settingsRepository } from '../repositories/settings-repository';

const PIN_SETTING_KEY = 'pin_hash';

function hashPin(pin: string): string {

  return createHash('sha256').update(pin.toLowerCase()).digest('hex');

}

export function registerPinHandlers(): void {

  ipcMain.handle(CHANNELS.PIN_IS_SET, async () => {

    try {
      const setting = settingsRepository.findByKey(PIN_SETTING_KEY);
      return { success: true, data: !!setting };
    } catch (error) {
      console.error('pin:isSet error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }

  });

  ipcMain.handle(CHANNELS.PIN_SET, async (_event, pin: string) => {

    try {
      const hash = hashPin(pin);
      settingsRepository.upsert(PIN_SETTING_KEY, hash);
      return { success: true };
    } catch (error) {
      console.error('pin:set error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }

  });

  ipcMain.handle(CHANNELS.PIN_VERIFY, async (_event, pin: string) => {

    try {
      const setting = settingsRepository.findByKey(PIN_SETTING_KEY);
      if (!setting) return { success: true, data: false };
      const hash = hashPin(pin);
      return { success: true, data: hash === setting.value };
    } catch (error) {
      console.error('pin:verify error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }

  });

  ipcMain.handle(CHANNELS.PIN_CLEAR, async (_event, pin: string) => {

    try {
      const setting = settingsRepository.findByKey(PIN_SETTING_KEY);
      if (!setting) return { success: false, error: 'No PIN is set' };

      const hash = hashPin(pin);
      if (hash !== setting.value) {
        return { success: false, error: 'Incorrect PIN' };
      }

      const db = (await import('../db/connection')).getDb();
      db.prepare('DELETE FROM settings WHERE key = ?').run(PIN_SETTING_KEY);
      return { success: true };
    } catch (error) {
      console.error('pin:clear error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }

  });

}
