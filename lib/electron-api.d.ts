/// <reference types="vite-plugin-electron/electron-env" />

// Make electronAPI types available to files in the lib directory
// This extends the Window interface globally

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
} from '../electron/lib/handlers/types';
import type { Consultation } from './types';

declare global {
  interface Window {
    electronAPI: {
      onExportData: (callback: (event: Electron.IpcRendererEvent) => void) => void;
      removeExportListener: () => void;
      onImportData: (callback: (event: Electron.IpcRendererEvent) => void) => void;
      removeImportListener: () => void;
      patients: {
        list: () => Promise<PatientWithComputed[]>;
        search: (text: string) => Promise<PatientWithComputed[]>;
        get: (id: string | number) => Promise<PatientWithComputed & { treatments?: Consultation[] }>;
        create: (data: PatientCreateData) => Promise<PatientWithComputed>;
        update: (id: string | number, data: PatientUpdateData) => Promise<PatientWithComputed>;
        delete: (id: string | number) => Promise<{ success: boolean }>;
        export: () => Promise<{ success: boolean; filePath?: string }>;
        import: () => Promise<ImportResponse>;
        recent: (limit?: number) => Promise<PatientWithComputed[]>;
      };
      consultations: {
        list: (params: { patient_id: string; page?: string }) => Promise<ConsultationListResponse>;
        get: (id: string | number) => Promise<Consultation>;
        create: (data: ConsultationCreateData) => Promise<Consultation>;
        update: (id: string | number, data: ConsultationUpdateData) => Promise<Consultation>;
        delete: (id: string | number) => Promise<{ success: boolean }>;
      };
      statistics: {
        get: () => Promise<StatisticsResponse>;
      };
      advanceSearch: (params: AdvanceSearchParams) => Promise<AdvanceSearchResponse>;
    };
  }
}

export {};
