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

  const handleExport = () => {
    window.location.href = apiUrl('/api/patients/export');
  };

  // Listen for native menu export event
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onExportData(handleExport);

      return () => {
        window.electronAPI?.removeExportListener();
      };
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="shadow-sm rounded p-4 m-4 bg-blue-50">
        <h1 className="text-3xl font-bold mb-4 text-black flex justify-center text-blue-900">
          Pacientes
        </h1>
        <div className="shadow-sm rounded p-4 mb-6 bg-white">
          <div className="pb-4 bg-white mt-4 flex justify-between items-center relative">
            <div className="flex items-start flex-col gap-2 w-3/6">
              <div ref={searchFieldRef} className="w-full relative">
                <label htmlFor="table-search" className="sr-only text-gray-900">Search</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-500"
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
                    className="rounded block p-2 pl-10 w-full text-sm text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {showSearchResults && searchResults.length > 0 && (
                  <div className="shadow w-3/12 rounded absolute bg-white top-10 z-10">
                    <ul id="patients-list" className="max-h-60 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <li key={patient.id}>
                          <Link
                            to={`/patients/${patient.id}/edit`}
                            className="flex hover:bg-blue-300 p-2 text-gray-900"
                            onClick={() => {
                              setSearchResults([]);
                              setSearchText('');
                            }}
                          >
                            {patient.name}
                          </Link>
                          <hr />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Link
                to="/advance-search"
                className="text-blue-800 hover:text-blue-900 shrink-0"
                title="Editar"
              >
                Busqueda Avanzada
              </Link>
            </div>
            <div className="flex gap-3">
              <Link
                to="/patients/new"
                className="bg-blue-600 hover:bg-blue-800 shadow-sm text-white font-bold py-2 px-4 rounded"
              >
                Agregar paciente
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
