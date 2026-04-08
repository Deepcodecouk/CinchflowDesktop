import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/channels';
import { notesRepository } from '../repositories/notes-repository';

export function registerNotesHandlers(): void {
  ipcMain.handle(CHANNELS.NOTES_FIND_ALL, async () => {
    try {
      const data = notesRepository.findAll();
      return { success: true, data };
    } catch (error) {
      console.error('notes:findAll error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.NOTES_CREATE, async (_event, data: { title: string; content: string }) => {
    try {
      const result = notesRepository.create(data);
      return { success: true, data: result };
    } catch (error) {
      console.error('notes:create error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.NOTES_UPDATE, async (_event, id: string, data: { title?: string; content?: string }) => {
    try {
      const result = notesRepository.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('notes:update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });

  ipcMain.handle(CHANNELS.NOTES_DELETE, async (_event, id: string) => {
    try {
      const data = notesRepository.delete(id);
      return { success: true, data };
    } catch (error) {
      console.error('notes:delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  });
}
