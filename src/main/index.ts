import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { runMigrations } from './db/migrations';
import { closeDb } from './db/connection';
import { registerAllHandlers } from './ipc';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'CinchFlow',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  });

  // Intercept Ctrl+R/Ctrl+Shift+R before Chromium handles them as page reload.
  // before-input-event's preventDefault() blocks both Chromium's reload and the DOM
  // keydown event, so we forward the shortcut to the renderer via IPC.
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key.toLowerCase() === 'r' && input.control && !input.alt && !input.meta) {
      _event.preventDefault();
      mainWindow.webContents.send('shortcut:fill-right', input.shift);
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.on('ready', () => {
  // Remove the default menu bar
  Menu.setApplicationMenu(null);

  // Initialize database and run migrations
  runMigrations();

  // Register all IPC handlers
  registerAllHandlers();

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  closeDb();
});
