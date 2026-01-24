import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createMenu } from './menu';
import { setupIpcHandlers } from './lib/handlers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..');

// Vite dev server or production dist
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null
let dbModule: any;

// Initialize database
async function initDatabase() {
  try {
    process.env.USER_DATA_PATH = app.getPath('userData');
    dbModule = await import('./lib/database');
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })
  win.maximize();

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  win.webContents.openDevTools();
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
    await initDatabase();
    await setupIpcHandlers(dbModule);
    createWindow();

    if (win) {
      createMenu(win);
      console.log('✓ App started successfully');
    }
  } catch (error) {
    console.error('Error starting app:', error);
  }
});
