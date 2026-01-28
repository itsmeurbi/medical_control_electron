import { ipcMain, app } from 'electron';

export function setupAppSettingsHandlers(): void {
  // GET /api/app-settings/login-item
  ipcMain.handle('api:app-settings:get-login-item', async (): Promise<{ openAtLogin: boolean }> => {
    try {
      const settings = app.getLoginItemSettings();
      return {
        openAtLogin: settings.openAtLogin || false,
      };
    } catch (error) {
      console.error('Error getting login item settings:', error);
      throw error;
    }
  });

  // POST /api/app-settings/login-item
  ipcMain.handle('api:app-settings:set-login-item', async (_event, { openAtLogin }: { openAtLogin: boolean }): Promise<{ success: boolean }> => {
    try {
      app.setLoginItemSettings({
        openAtLogin,
        openAsHidden: false,
      });
      return { success: true };
    } catch (error) {
      console.error('Error setting login item settings:', error);
      throw error;
    }
  });
}
