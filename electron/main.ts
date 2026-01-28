import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createMenu } from './menu';
import { setupIpcHandlers } from './lib/handlers';
import { initializeLogger, logNavigation } from './lib/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..');

// Vite dev server or production dist
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;
const VITE_PUBLIC = process.env.VITE_PUBLIC;

let win: BrowserWindow | null
let dbModule: any;

// Initialize database
async function initDatabase() {
  try {
    // USER_DATA_PATH is set in app.whenReady() before this is called
    dbModule = await import('./lib/database');
    // Reinitialize database with correct path after USER_DATA_PATH is set
    const { ensureDatabaseInitialized } = dbModule;
    ensureDatabaseInitialized();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })
  win.maximize();

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  console.log('=== Electron App Ready ===');
  try {
    // Initialize logger first (clears log file)
    process.env.USER_DATA_PATH = app.getPath('userData');
    initializeLogger();

    await initDatabase();
    await setupIpcHandlers(dbModule);

    // Setup navigation logging handler
    ipcMain.on('log:navigation', (_event, { from, to }: { from: string; to: string }) => {
      logNavigation(from, to);
    });

    // Enable auto-launch on login by default (only if not already set)
    const loginItemSettings = app.getLoginItemSettings();
    if (!loginItemSettings.openAtLogin) {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
      });
      console.log('✓ Auto-launch on login enabled');
    }

    createWindow();

    if (win) {
      createMenu(win);
      console.log('✓ App started successfully');
    }
  } catch (error) {
    console.error('Error starting app:', error);
  }
});
