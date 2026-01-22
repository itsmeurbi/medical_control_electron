const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let nextServer;

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
    : 'http://localhost:3000';

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
    // Start Next.js server in production
    const nextPath = path.join(__dirname, '../.next/standalone');
    const serverPath = path.join(nextPath, 'server.js');

    // Set PORT environment variable
    process.env.PORT = '3000';

    // Start the Next.js server
    nextServer = spawn(process.execPath, [serverPath], {
      cwd: nextPath,
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production'
      }
    });

    nextServer.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
    });

    nextServer.stderr.on('data', (data) => {
      console.error(`Next.js error: ${data}`);
    });

    // Wait for server to start
    waitForServer(startUrl)
      .then(() => {
        mainWindow.loadURL(startUrl);
      })
      .catch((err) => {
        console.error('Failed to start Next.js server:', err);
      });
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

app.on('before-quit', () => {
  // Kill Next.js server on app quit
  if (nextServer) {
    nextServer.kill();
  }
});
