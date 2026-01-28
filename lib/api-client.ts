// IPC-based API client for Electron
// This replaces fetch() calls with IPC communication

import type {
  PatientCreateData,
  PatientUpdateData,
  ConsultationCreateData,
  ConsultationUpdateData,
  AdvanceSearchParams,
  MatchType,
} from '../electron/lib/handlers/types';

// Note: Type declaration is in src/utils/api.ts to avoid conflicts

// Helper to wrap direct data in Response (preload returns data directly, not IpcResponse)
function wrapInResponse<T>(data: T): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
  } as Response;
}

// API client that mimics fetch() but uses IPC
export const apiClient = {
  // Patients API
  async getPatients(): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const data = await window.electronAPI.patients.list();
    return wrapInResponse(data);
  },

  async getPatient(id: number | string): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const data = await window.electronAPI.patients.get(id);
    return wrapInResponse(data);
  },

  async createPatient(data: PatientCreateData): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const result = await window.electronAPI.patients.create(data);
    return wrapInResponse(result);
  },

  async updatePatient(id: number | string, data: PatientUpdateData): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const result = await window.electronAPI.patients.update(id, data);
    return wrapInResponse(result);
  },

  async deletePatient(id: number | string): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    await window.electronAPI.patients.delete(id);
    return wrapInResponse({ success: true });
  },

  async searchPatients(text: string): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const data = await window.electronAPI.patients.search(text);
    return wrapInResponse(data);
  },

  async exportPatients(): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const buffer = await window.electronAPI.patients.export();
    // Generate filename
    const today = new Date().toISOString().split('T')[0];
    return {
      buffer,
      filename: `medical-control-export-${today}.zip`,
      mimeType: 'application/zip',
    };
  },

  // Consultations API
  async getConsultations(patientId: number | string, page: number = 1): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const data = await window.electronAPI.consultations.list({ patient_id: String(patientId), page: String(page) });
    return wrapInResponse(data);
  },

  async getConsultation(id: number | string): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const data = await window.electronAPI.consultations.get(id);
    return wrapInResponse(data);
  },

  async createConsultation(data: ConsultationCreateData): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const result = await window.electronAPI.consultations.create(data);
    return wrapInResponse(result);
  },

  async updateConsultation(id: number | string, data: ConsultationUpdateData): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const result = await window.electronAPI.consultations.update(id, data);
    return wrapInResponse(result);
  },

  async deleteConsultation(id: number | string): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    await window.electronAPI.consultations.delete(id);
    return wrapInResponse({ success: true });
  },

  // Advanced search
  async advanceSearch(params: AdvanceSearchParams): Promise<Response> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const data = await window.electronAPI.advanceSearch(params);
    return wrapInResponse(data);
  },
};

// Fallback fetch wrapper for compatibility
// In Electron, use IPC; in browser/dev, use fetch
export async function fetch(url: string, options?: RequestInit): Promise<Response> {
  // If Electron API is available, use IPC
  if (window.electronAPI) {
    return handleElectronFetch(url, options);
  }

  // Otherwise, use regular fetch (for dev mode or browser)
  return window.fetch(url, options);
}

async function handleElectronFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!window.electronAPI) {
    return window.fetch(url, options);
  }

  // Parse URL to determine endpoint
  const urlObj = new URL(url, window.location.origin);
  const pathname = urlObj.pathname;

  // Patients endpoints
  if (pathname === '/api/patients' || pathname === '/api/patients/') {
    if (options?.method === 'GET') {
      return apiClient.getPatients();
    } else if (options?.method === 'POST') {
      const data = JSON.parse(options.body as string);
      return apiClient.createPatient(data);
    }
  }

  // Patient by ID
  const patientIdMatch = pathname.match(/^\/api\/patients\/(\d+)$/);
  if (patientIdMatch) {
    const id = patientIdMatch[1];
    if (options?.method === 'GET') {
      return apiClient.getPatient(id);
    } else if (options?.method === 'PUT' || options?.method === 'PATCH') {
      const data = JSON.parse(options.body as string);
      return apiClient.updatePatient(id, data);
    } else if (options?.method === 'DELETE') {
      return apiClient.deletePatient(id);
    }
  }

  // Patient search
  if (pathname === '/api/patients/search') {
    const text = urlObj.searchParams.get('text') || '';
    return apiClient.searchPatients(text);
  }

  // Patient export
  if (pathname === '/api/patients/export') {
    try {
      const result = await apiClient.exportPatients();
      // Convert Buffer to Uint8Array for Blob
      const uint8Array = new Uint8Array(result.buffer);
      const blob = new Blob([uint8Array], { type: result.mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true }),
      } as Response;
    } catch (error) {
      return {
        ok: false,
        status: 500,
        statusText: 'Export failed',
        json: async () => ({ error: String(error) }),
      } as Response;
    }
  }

  // Consultations endpoints
  if (pathname === '/api/consultations' || pathname === '/api/consultations/') {
    if (options?.method === 'GET') {
      const patientId = urlObj.searchParams.get('patient_id');
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      if (patientId) {
        return apiClient.getConsultations(patientId, page);
      }
    } else if (options?.method === 'POST') {
      const data = JSON.parse(options.body as string);
      return apiClient.createConsultation(data);
    }
  }

  // Consultation by ID
  const consultationIdMatch = pathname.match(/^\/api\/consultations\/(\d+)$/);
  if (consultationIdMatch) {
    const id = consultationIdMatch[1];
    if (options?.method === 'GET') {
      return apiClient.getConsultation(id);
    } else if (options?.method === 'PUT' || options?.method === 'PATCH') {
      const data = JSON.parse(options.body as string);
      return apiClient.updateConsultation(id, data);
    } else if (options?.method === 'DELETE') {
      return apiClient.deleteConsultation(id);
    }
  }

  // Advanced search
  if (pathname === '/api/advance-searches' || pathname === '/api/advance-searches/') {
    const matchTypeParam = urlObj.searchParams.get('match_type');
    const matchType: MatchType | undefined = matchTypeParam && ['exact', 'starts_with', 'ends_with', 'contains'].includes(matchTypeParam)
      ? (matchTypeParam as MatchType)
      : 'exact';
    const params: AdvanceSearchParams = {
      attribute_name: urlObj.searchParams.get('attribute_name') || '',
      attribute_value: urlObj.searchParams.get('attribute_value') || '',
      match_type: matchType,
      page: parseInt(urlObj.searchParams.get('page') || '1', 10),
    };
    return apiClient.advanceSearch(params);
  }

  // Fallback to regular fetch if no match
  return window.fetch(url, options);
}