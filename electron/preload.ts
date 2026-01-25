import { ipcRenderer, contextBridge } from 'electron';

// --------- Expose API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Export data listener
  onExportData: (callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on('export-data', callback);
  },
  removeExportListener: () => {
    ipcRenderer.removeAllListeners('export-data');
  },
  // Import data listener
  onImportData: (callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on('import-data', callback);
  },
  removeImportListener: () => {
    ipcRenderer.removeAllListeners('import-data');
  },

  // Patients API
  patients: {
    list: () => ipcRenderer.invoke('api:patients:list'),
    search: (text: string) => ipcRenderer.invoke('api:patients:search', text),
    get: (id: string | number) => ipcRenderer.invoke('api:patients:get', id),
    create: (data: any) => ipcRenderer.invoke('api:patients:create', data),
    update: (id: string | number, data: any) => ipcRenderer.invoke('api:patients:update', id, data),
    delete: (id: string | number) => ipcRenderer.invoke('api:patients:delete', id),
    export: () => ipcRenderer.invoke('api:patients:export'),
    import: () => ipcRenderer.invoke('api:patients:import'),
  },

  // Consultations API
  consultations: {
    list: (params: { patient_id: string; page?: string }) => ipcRenderer.invoke('api:consultations:list', params),
    get: (id: string | number) => ipcRenderer.invoke('api:consultations:get', id),
    create: (data: any) => ipcRenderer.invoke('api:consultations:create', data),
    update: (id: string | number, data: any) => ipcRenderer.invoke('api:consultations:update', id, data),
    delete: (id: string | number) => ipcRenderer.invoke('api:consultations:delete', id),
  },

  // Advance search API
  advanceSearch: (params: any) => ipcRenderer.invoke('api:advance-searches', params),
});
