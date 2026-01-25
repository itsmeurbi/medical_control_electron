/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
// Used in Renderer process, expose in `preload.ts`
interface Window {
  electronAPI: {
    onExportData: (callback: (event: any, ...args: any[]) => void) => void;
    removeExportListener: () => void;
    onImportData: (callback: (event: any, ...args: any[]) => void) => void;
    removeImportListener: () => void;
    patients: {
      list: () => Promise<any[]>;
      search: (text: string) => Promise<any[]>;
      get: (id: string | number) => Promise<any>;
      create: (data: any) => Promise<any>;
      update: (id: string | number, data: any) => Promise<any>;
      delete: (id: string | number) => Promise<any>;
      export: () => Promise<Buffer>;
      import: () => Promise<{ success: boolean; importedPatients: number; importedConsultations: number; errors?: string[]; message?: string }>;
    };
    consultations: {
      list: (params: { patient_id: string; page?: string }) => Promise<any>;
      get: (id: string | number) => Promise<any>;
      create: (data: any) => Promise<any>;
      update: (id: string | number, data: any) => Promise<any>;
      delete: (id: string | number) => Promise<any>;
    };
    advanceSearch: (params: any) => Promise<any>;
  };
}