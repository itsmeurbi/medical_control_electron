const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any Electron APIs you need here
});
