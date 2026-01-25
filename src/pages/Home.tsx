import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../../lib/types';
import { apiUrl } from '../../src/utils/api';

export default function Home() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive showSearchResults from state - no separate state needed
  const showSearchResults = searchText.length > 1 && searchResults.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchFieldRef.current && !searchFieldRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setSearchText('');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.length <= 1) {
      // Don't call setState synchronously - just return early
      // showSearchResults will be false automatically since searchText.length <= 1
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetch(apiUrl(`/api/patients/search?text=${encodeURIComponent(searchText)}`))
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
        })
        .catch(err => {
          console.error('Error searching patients:', err);
          setSearchResults([]);
        });
    }, 300); // Debounce for 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  const handleExport = async () => {
    await fetch(apiUrl('/api/patients/export'));
  };

  const handleImport = async () => {
    try {
      const response = await fetch(apiUrl('/api/patients/import'), {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        alert(`Import completed!\nPatients: ${result.importedPatients}\nConsultations: ${result.importedConsultations}${result.errors ? `\n\nErrors:\n${result.errors.join('\n')}` : ''}`);
        // Optionally refresh the page or reload data
        window.location.reload();
      } else {
        alert(`Import failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error importing data: ${error.message}`);
    }
  };

  // Listen for native menu export/import events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onExportData(handleExport);
      window.electronAPI.onImportData(handleImport);

      return () => {
        window.electronAPI?.removeExportListener();
        window.electronAPI?.removeImportListener();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Pacientes</h1>
          <Link
            to="/patients/new"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Agregar paciente
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div ref={searchFieldRef} className="relative w-full sm:max-w-md">
              <label htmlFor="table-search" className="sr-only text-slate-600">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Busqueda por nombre"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <ul id="patients-list" className="max-h-64 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <li key={patient.id} className="border-b border-slate-100 last:border-b-0">
                        <Link
                          to={`/patients/${patient.id}/edit`}
                          className="flex items-center rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                          onClick={() => {
                            setSearchResults([]);
                            setSearchText('');
                          }}
                        >
                          {patient.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Link
              to="/advance-search"
              className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              title="Editar"
            >
              Busqueda Avanzada
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
