// Type definitions for electronAPI


// Helper to convert IPC calls to fetch-like interface
async function ipcFetch(method: string, path: string, body?: any): Promise<Response> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  try {
    let result: any;

    if (path === '/api/patients') {
      if (method === 'GET') {
        result = await window.electronAPI.patients.list();
      } else if (method === 'POST') {
        result = await window.electronAPI.patients.create(body);
      }
    } else if (path.startsWith('/api/patients/search')) {
      const url = new URL(path, 'http://localhost');
      const text = url.searchParams.get('text') || '';
      result = await window.electronAPI.patients.search(text);
    } else if (path.startsWith('/api/patients/export')) {
      const buffer = await window.electronAPI.patients.export();
      // Convert buffer to blob for download
      const blob = new Blob([new Uint8Array(buffer)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      window.location.href = url;
      return new Response(null, { status: 200 });
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
        result = await window.electronAPI.patients.update(id, body);
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
          result = await window.electronAPI.consultations.create(body);
        }
      } else if (path.match(/^\/api\/consultations\/(\d+)$/)) {
        const match = path.match(/^\/api\/consultations\/(\d+)$/);
        const id = match ? match[1] : '';
        if (method === 'GET') {
          result = await window.electronAPI.consultations.get(id);
        } else if (method === 'PUT') {
          result = await window.electronAPI.consultations.update(id, body);
        } else if (method === 'DELETE') {
          result = await window.electronAPI.consultations.delete(id);
        }
      }
    } else if (path.startsWith('/api/advance-searches')) {
      const url = new URL(path, 'http://localhost');
      result = await window.electronAPI.advanceSearch({
        attribute_name: url.searchParams.get('attribute_name') || '',
        attribute_value: url.searchParams.get('attribute_value') || '',
        match_type: url.searchParams.get('match_type') || 'exact',
        page: parseInt(url.searchParams.get('page') || '1', 10),
      });
    } else if (path === '/api/statistics') {
      result = await window.electronAPI.statistics.get();
    } else if (path.startsWith('/api/patients/recent')) {
      const url = new URL(path, 'http://localhost');
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      result = await window.electronAPI.patients.recent(limit);
    }

    // Convert result to Response-like object
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Convert error to Response-like object
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: error.message?.includes('not found') ? 404 : 500,
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
