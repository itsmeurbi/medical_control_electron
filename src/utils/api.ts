// Type definitions for electronAPI

import type {
  PatientCreateData,
  PatientUpdateData,
  ConsultationCreateData,
  ConsultationUpdateData,
  AdvanceSearchParams,
  MatchType,
  PatientWithComputed,
  ConsultationListResponse,
  StatisticsResponse,
  AdvanceSearchResponse,
  ImportResponse,
} from '../../electron/lib/handlers/types';
import type { Consultation } from '../../lib/types';

// Helper to convert IPC calls to fetch-like interface
async function ipcFetch(method: string, path: string, body?: PatientCreateData | PatientUpdateData | ConsultationCreateData | ConsultationUpdateData): Promise<Response> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  try {
    let result: PatientWithComputed[] | PatientWithComputed | ConsultationListResponse | Consultation | StatisticsResponse | AdvanceSearchResponse | ImportResponse | { success: boolean } | Buffer | null = null;

    if (path === '/api/patients') {
      if (method === 'GET') {
        result = await window.electronAPI.patients.list();
      } else if (method === 'POST') {
        if (!body) {
          throw new Error('Request body is required for POST /api/patients');
        }
        result = await window.electronAPI.patients.create(body as PatientCreateData);
      }
    } else if (path.startsWith('/api/patients/search')) {
      const url = new URL(path, 'http://localhost');
      const text = url.searchParams.get('text') || '';
      result = await window.electronAPI.patients.search(text);
    } else if (path.startsWith('/api/patients/export')) {
      // Handler now shows save dialog and saves the file directly
      const result = await window.electronAPI.patients.export();
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (path.startsWith('/api/patients/import')) {
      if (method === 'POST') {
        result = await window.electronAPI.patients.import();
      }
    } else if (path.match(/^\/api\/patients\/(\d+)$/)) {
      const match = path.match(/^\/api\/patients\/(\d+)$/);
      const id = match ? match[1] : '';
      if (method === 'GET') {
        result = await window.electronAPI.patients.get(id);
      } else if (method === 'PUT') {
        if (!body) {
          throw new Error('Request body is required for PUT /api/patients/:id');
        }
        result = await window.electronAPI.patients.update(id, body as PatientUpdateData);
      } else if (method === 'DELETE') {
        result = await window.electronAPI.patients.delete(id);
      }
    } else if (path.startsWith('/api/consultations')) {
      const url = new URL(path, 'http://localhost');
      if (url.pathname === '/api/consultations') {
        if (method === 'GET') {
          const patient_id = url.searchParams.get('patient_id') || '';
          const page = url.searchParams.get('page') || '1';
          result = await window.electronAPI.consultations.list({ patient_id, page });
        } else if (method === 'POST') {
          if (!body) {
            throw new Error('Request body is required for POST /api/consultations');
          }
          result = await window.electronAPI.consultations.create(body as ConsultationCreateData);
        }
      } else if (path.match(/^\/api\/consultations\/(\d+)$/)) {
        const match = path.match(/^\/api\/consultations\/(\d+)$/);
        const id = match ? match[1] : '';
        if (method === 'GET') {
          result = await window.electronAPI.consultations.get(id);
        } else if (method === 'PUT') {
          if (!body) {
            throw new Error('Request body is required for PUT /api/consultations/:id');
          }
          result = await window.electronAPI.consultations.update(id, body as ConsultationUpdateData);
        } else if (method === 'DELETE') {
          result = await window.electronAPI.consultations.delete(id);
        }
      }
    } else if (path.startsWith('/api/advance-searches')) {
      const url = new URL(path, 'http://localhost');
      const matchTypeParam = url.searchParams.get('match_type');
      const matchType: MatchType = matchTypeParam && ['exact', 'starts_with', 'ends_with', 'contains'].includes(matchTypeParam)
        ? (matchTypeParam as MatchType)
        : 'exact';
      const params: AdvanceSearchParams = {
        attribute_name: url.searchParams.get('attribute_name') || '',
        attribute_value: url.searchParams.get('attribute_value') || '',
        match_type: matchType,
        page: parseInt(url.searchParams.get('page') || '1', 10),
      };
      result = await window.electronAPI.advanceSearch(params);
    } else if (path === '/api/statistics') {
      result = await window.electronAPI.statistics.get();
    } else if (path.startsWith('/api/patients/recent')) {
      const url = new URL(path, 'http://localhost');
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      result = await window.electronAPI.patients.recent(limit);
    }

    // Convert result to Response-like object
    if (result === null) {
      throw new Error('No handler found for this path');
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    // Convert error to Response-like object
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: errorMessage.includes('not found') ? 404 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// API URL helper - now just returns the path for IPC
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath;
}

// Override fetch to use IPC in Electron
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // Only intercept /api calls
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (window.electronAPI && url.startsWith('/api/')) {
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    return ipcFetch(method, url, body);
  }

  // Fallback to original fetch for non-API calls
  return originalFetch(input, init);
};
