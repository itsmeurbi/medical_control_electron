import { app, Menu, BrowserWindow } from 'electron';

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
