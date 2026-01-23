const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');

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

// Ensure static files are accessible to standalone server
function ensureStaticFiles() {
  if (!app.isPackaged) return;

  const projectRoot = path.join(process.resourcesPath, 'app.asar.unpacked');
  const staticSource = path.join(projectRoot, '.next', 'static');
  const staticTarget = path.join(projectRoot, '.next', 'standalone', '.next', 'static');

  try {
    // Check if target already exists
    if (fs.existsSync(staticTarget)) {
      const stats = fs.lstatSync(staticTarget);
      // If it's a symlink, remove it and copy instead
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(staticTarget);
      } else {
        // Already a directory, assume it's correct
        return;
      }
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(staticTarget);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Copy static files if source exists
    if (fs.existsSync(staticSource)) {
      // Use a simple copy approach - in production you might want to use a more robust method
      fs.cpSync(staticSource, staticTarget, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to ensure static files:', err);
  }
}

// Start Next standalone (only in production)
function startNextStandalone() {
  if (!app.isPackaged) {
    console.log('DEV mode: start Next manually with npm run dev');
    return;
  }

  // Ensure static files are accessible
  ensureStaticFiles();

  // Project root where .next directory is located
  const projectRoot = path.join(
    process.resourcesPath,
    'app.asar.unpacked'
  );

  const serverPath = path.join(
    projectRoot,
    '.next',
    'standalone',
    'server.js'
  );

  nextProcess = spawn(
    process.execPath,
    [serverPath],
    {
      // Run from project root so Next.js can find static files
      cwd: projectRoot,
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
