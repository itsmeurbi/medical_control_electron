const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onExportData: (callback) => {
    ipcRenderer.on('export-data', callback);
  },
  removeExportListener: () => {
    ipcRenderer.removeAllListeners('export-data');
  }
});
