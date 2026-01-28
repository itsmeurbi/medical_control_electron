import { ipcRenderer, contextBridge } from 'electron';
import type {
  PatientWithComputed,
  PatientCreateData,
  PatientUpdateData,
  ConsultationListResponse,
  ConsultationCreateData,
  ConsultationUpdateData,
  StatisticsResponse,
  AdvanceSearchParams,
  AdvanceSearchResponse,
  ImportResponse,
} from './lib/handlers/types';
import type { Consultation } from '../lib/types';

// --------- Expose API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Export data listener
  onExportData: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.on('export-data', callback);
  },
  removeExportListener: () => {
    ipcRenderer.removeAllListeners('export-data');
  },
  // Import data listener
  onImportData: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.on('import-data', callback);
  },
  removeImportListener: () => {
    ipcRenderer.removeAllListeners('import-data');
  },

  // Patients API
  patients: {
    list: () => ipcRenderer.invoke('api:patients:list') as Promise<PatientWithComputed[]>,
    search: (text: string) => ipcRenderer.invoke('api:patients:search', text) as Promise<PatientWithComputed[]>,
    get: (id: string | number) => ipcRenderer.invoke('api:patients:get', id) as Promise<PatientWithComputed & { treatments?: Consultation[] }>,
    create: (data: PatientCreateData) => ipcRenderer.invoke('api:patients:create', data) as Promise<PatientWithComputed>,
    update: (id: string | number, data: PatientUpdateData) => ipcRenderer.invoke('api:patients:update', id, data) as Promise<PatientWithComputed>,
    delete: (id: string | number) => ipcRenderer.invoke('api:patients:delete', id) as Promise<{ success: boolean }>,
    export: () => ipcRenderer.invoke('api:patients:export') as Promise<{ success: boolean; filePath?: string }>,
    import: () => ipcRenderer.invoke('api:patients:import') as Promise<ImportResponse>,
    recent: (limit?: number) => ipcRenderer.invoke('api:patients:recent', limit) as Promise<PatientWithComputed[]>,
  },

  // Statistics API
  statistics: {
    get: () => ipcRenderer.invoke('api:statistics') as Promise<StatisticsResponse>,
  },

  // Consultations API
  consultations: {
    list: (params: { patient_id: string; page?: string }) => ipcRenderer.invoke('api:consultations:list', params) as Promise<ConsultationListResponse>,
    get: (id: string | number) => ipcRenderer.invoke('api:consultations:get', id) as Promise<Consultation>,
    create: (data: ConsultationCreateData) => ipcRenderer.invoke('api:consultations:create', data) as Promise<Consultation>,
    update: (id: string | number, data: ConsultationUpdateData) => ipcRenderer.invoke('api:consultations:update', id, data) as Promise<Consultation>,
    delete: (id: string | number) => ipcRenderer.invoke('api:consultations:delete', id) as Promise<{ success: boolean }>,
  },

  // Advance search API
  advanceSearch: (params: AdvanceSearchParams) => ipcRenderer.invoke('api:advance-searches', params) as Promise<AdvanceSearchResponse>,

  // App settings API
  appSettings: {
    getLoginItem: () => ipcRenderer.invoke('api:app-settings:get-login-item') as Promise<{ openAtLogin: boolean }>,
    setLoginItem: (settings: { openAtLogin: boolean }) => ipcRenderer.invoke('api:app-settings:set-login-item', settings) as Promise<{ success: boolean }>,
  },

  // Logger API
  logNavigation: (from: string, to: string) => {
    ipcRenderer.send('log:navigation', { from, to });
  },
});
