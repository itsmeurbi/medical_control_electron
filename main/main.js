const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

const isDev = process.env.NODE_ENV !== 'production';

function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkServer = () => {
      attempts++;
      const urlObj = new URL(url);
      const req = http.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || 3000,
          path: '/',
          method: 'GET',
          timeout: 1000
        },
        () => {
          resolve();
        }
      );

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Server did not start in time'));
        } else {
          setTimeout(checkServer, 1000);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error('Server did not start in time'));
        } else {
          setTimeout(checkServer, 1000);
        }
      });

      req.end();
    };

    checkServer();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  if (isDev) {
    waitForServer(startUrl)
      .then(() => {
        mainWindow.loadURL(startUrl);
        mainWindow.webContents.openDevTools();
      })
      .catch((err) => {
        console.error('Failed to connect to Next.js server:', err);
        mainWindow.loadURL(startUrl); // Try anyway
      });
  } else {
    mainWindow.loadURL(startUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
