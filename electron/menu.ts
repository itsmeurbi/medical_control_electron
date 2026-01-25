import { app, Menu, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';
import https from 'https';
import { readFileSync } from 'fs';

/**
 * Gets the current app version from package.json
 */
function getCurrentVersion(): string {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version || app.getVersion();
  } catch {
    return app.getVersion();
  }
}

/**
 * Compares two version strings (semver format)
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

/**
 * Fetches the latest release from GitHub
 */
async function getLatestRelease(): Promise<{ version: string; url: string; body: string } | null> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/itsmeurbi/medical_control_electron/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'Medical-Control-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            // Remove 'v' prefix if present (e.g., "v1.0.1" -> "1.0.1")
            const version = release.tag_name.replace(/^v/, '');
            resolve({
              version,
              url: release.html_url,
              body: release.body || ''
            });
          } catch (error) {
            reject(new Error('Failed to parse release data'));
          }
        } else if (res.statusCode === 404) {
          // No releases found
          resolve(null);
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Checks for updates and shows a dialog if available
 */
async function checkForUpdates(mainWindow: BrowserWindow) {
  try {
    const currentVersion = getCurrentVersion();

    // Make the API call first
    const latestRelease = await getLatestRelease();

    if (!latestRelease) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Sin actualizaciones',
        message: 'No hay actualizaciones disponibles',
        detail: `Estás usando la versión más reciente (${currentVersion}).\n\nNo se encontraron releases en GitHub.`,
        buttons: ['Entendido']
      });
      return;
    }

    const comparison = compareVersions(latestRelease.version, currentVersion);

    if (comparison > 0) {
      // New version available
      const releaseNotes = latestRelease.body
        ? latestRelease.body.substring(0, 300).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')
        : 'Sin notas de versión disponibles.';

      const response = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización disponible',
        message: 'Hay una nueva versión disponible',
        detail: `Versión actual: ${currentVersion}\nVersión disponible: ${latestRelease.version}\n\n${releaseNotes}\n\n¿Deseas abrir la página de descarga?`,
        buttons: ['Abrir descarga', 'Más tarde'],
        defaultId: 0,
        cancelId: 1
      });

      if (response.response === 0) {
        shell.openExternal(latestRelease.url);
      }
    } else {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Sin actualizaciones',
        message: 'Estás usando la versión más reciente',
        detail: `Versión actual: ${currentVersion}\nÚltima versión disponible: ${latestRelease.version}`,
        buttons: ['Entendido']
      });
    }
  } catch (error: any) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error al verificar actualizaciones',
      message: 'No se pudo verificar actualizaciones',
      detail: `Error: ${error.message}\n\nPuedes verificar manualmente en:\nhttps://github.com/itsmeurbi/medical_control_electron/releases`,
      buttons: ['Entendido']
    });
  }
}

/**
 * Creates and sets the application menu
 * @param mainWindow - The main browser window instance
 */
export function createMenu(mainWindow: BrowserWindow) {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Importar datos',
          accelerator: process.platform === 'darwin' ? 'Cmd+I' : 'Ctrl+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('import-data');
            }
          }
        },
        {
          label: 'Exportar datos',
          accelerator: process.platform === 'darwin' ? 'Cmd+E' : 'Ctrl+E',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('export-data');
            }
          }
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'Salir' : 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Buscar actualizaciones',
          click: () => {
            if (mainWindow) {
              checkForUpdates(mainWindow);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Cómo exportar datos',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Cómo exportar datos',
                message: 'Exportar datos',
                detail: 'Tus datos se exportan en formato CSV para su comprensión. El archivo exportado contiene todos los pacientes y consultas registrados en el sistema.',
                buttons: ['Entendido']
              });
            }
          }
        },
        {
          label: 'Cómo importar datos',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Cómo importar datos',
                message: 'Importar datos',
                detail: 'Importar datos puede sobreescribir registros que sean encontrados como duplicados. Los archivos deben comenzar con "patients" o "consults" respectivamente.\n\nEjemplos:\n- patients.csv\n- consults.csv\n\nLos archivos deben estar en formato CSV con las columnas correspondientes.',
                buttons: ['Entendido']
              });
            }
          }
        },
        {
          label: 'Ubicación de la base de datos',
          click: () => {
            if (mainWindow) {
              const userDataPath = app.getPath('userData');
              const dbPath = path.join(userDataPath, 'database', 'medical_control.db');

              dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'Ubicación de la base de datos',
                message: 'Ubicación de la base de datos',
                detail: `La base de datos se encuentra en:\n\n${dbPath}\n\n⚠️ IMPORTANTE: No modifiques este archivo manualmente. Cualquier modificación directa puede corromper los datos y hacer que la aplicación deje de funcionar correctamente.\n\nSi necesitas hacer una copia de seguridad, usa la función de exportar datos desde el menú.`,
                buttons: ['Entendido']
              });
            }
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}