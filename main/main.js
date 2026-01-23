const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const net = require('net');
const fs = require('fs');
const { createMenu } = require('./menu');

let nextProcess;
let mainWindow;

// Wait for Next server to be ready
function waitForPort(port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const socket = new net.Socket();

      socket
        .once('error', () => {
          socket.destroy();
          if (Date.now() - start > timeout) {
            reject(new Error('Next server did not start in time'));
          } else {
            setTimeout(check, 300);
          }
        })
        .connect(port, '127.0.0.1', () => {
          socket.end();
          resolve();
        });
    };

    check();
  });
}

// Start Next standalone (only in production)
function startNextStandalone() {
  if (!app.isPackaged) {
    console.log('DEV mode: start Next manually with npm run dev');
    return;
  }

  const projectRoot = path.join(process.resourcesPath, 'app.asar.unpacked');
  const staticSource = path.join(projectRoot, '.next', 'static');
  const staticTarget = path.join(projectRoot, '.next', 'standalone', '.next', 'static');

  // Ensure static files are accessible
  if (!fs.existsSync(staticTarget) && fs.existsSync(staticSource)) {
    fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
    fs.cpSync(staticSource, staticTarget, { recursive: true });
  }

  const serverPath = path.join(projectRoot, '.next', 'standalone', 'server.js');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '3000',
    ELECTRON_RUN_AS_NODE: '1',
    USER_DATA_PATH: app.getPath('userData') // Pass user data path to Next.js
  };

  nextProcess = fork(serverPath, [], {
    cwd: projectRoot,
    silent: false,
    env
  });

  // Capture and display Next.js server logs
  nextProcess.stdout?.on('data', (data) => {
    console.log(`[Next.js] ${data.toString()}`);
  });

  nextProcess.stderr?.on('data', (data) => {
    console.error(`[Next.js Error] ${data.toString()}`);
  });

  nextProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Next standalone server exited with code ${code}`);
    }
  });
}

// Create the Electron window
async function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath
    },
    show: false
  });

  try {
    if (app.isPackaged) {
      await waitForPort(3000);
      await mainWindow.loadURL('http://localhost:3000');
    } else {
      // In dev mode, Next is already running via npm run dev
      await mainWindow.loadURL('http://localhost:3000');
    }

    mainWindow.show();

    // Open DevTools in dev mode
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  } catch (err) {
    console.error('Failed to load URL:', err);
  }
}

// App ready
app.whenReady().then(async () => {
  console.log('User data path:', app.getPath('userData'));
  startNextStandalone();
  await createWindow();
  createMenu(mainWindow);
});

// Cleanup
app.on('will-quit', () => {
  if (nextProcess) nextProcess.kill();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});