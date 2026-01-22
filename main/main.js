const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let nextProcess;

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

  const serverPath = path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    '.next',
    'standalone',
    'server.js'
  );

  nextProcess = spawn(
    process.execPath,
    [serverPath],
    {
      // Important: cwd must be the standalone folder
      cwd: path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone'),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3000',
        ELECTRON_RUN_AS_NODE: '1'
      }
    }
  );

  nextProcess.on('exit', (code) => {
    console.log(`Next standalone server exited with code ${code}`);
  });
}

// Create the Electron window
async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { contextIsolation: true },
    show: false
  });

  try {
    if (app.isPackaged) {
      await waitForPort(3000);
      await win.loadURL('http://localhost:3000');
    } else {
      // In dev mode, Next is already running via npm run dev
      await win.loadURL('http://localhost:3000');
    }

    win.show();
  } catch (err) {
    console.error('Failed to load URL:', err);
  }
}

// App ready
app.whenReady().then(async () => {
  startNextStandalone();
  await createWindow();
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
