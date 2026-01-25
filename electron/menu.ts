import { app, Menu, BrowserWindow, dialog } from 'electron';
import path from 'path';

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
