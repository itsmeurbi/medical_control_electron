import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../../lib/types';
import { apiUrl } from '../../src/utils/api';

interface Statistics {
  totalPatients: number;
  totalConsultations: number;
  recentRegistrations: number;
}

export default function Home() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch statistics and recent patients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, recentResponse] = await Promise.all([
          fetch(apiUrl('/api/statistics')),
          fetch(apiUrl('/api/patients/recent?limit=10')),
        ]);

        const stats = await statsResponse.json();
        const recent = await recentResponse.json();

        setStatistics(stats);
        setRecentPatients(recent);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

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

        {/* Statistics Cards */}
        {!loading && statistics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Pacientes</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{statistics.totalPatients}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Consultas</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{statistics.totalConsultations}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Registros Recientes</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{statistics.recentRegistrations}</p>
                  <p className="mt-1 text-xs text-slate-500">Últimos 30 días</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Patients List */}
        {!loading && recentPatients.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Pacientes Recientes</h2>
            </div>
            <div className="overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {recentPatients.map((patient) => (
                  <li key={patient.id}>
                    <Link
                      to={`/patients/${patient.id}/edit`}
                      className="block px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                          <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                            {patient.age !== null && patient.age !== undefined && (
                              <span>Edad: {patient.age} años</span>
                            )}
                            {patient.city && <span>Ciudad: {patient.city}</span>}
                            {patient.registeredAt && (
                              <span>Registrado: {formatDate(patient.registeredAt)}</span>
                            )}
                          </div>
                        </div>
                        <svg
                          className="h-5 w-5 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
