import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../../lib/types';
import { apiUrl } from '../../src/utils/api';

// Searchable attributes with labels
const searchableAttributes = [
  { value: 'name', label: 'Nombre' },
  { value: 'city', label: 'Ciudad' },
  { value: 'address', label: 'Domicilio' },
  { value: 'phone_number', label: 'Teléfono' },
  { value: 'medical_record', label: 'Expediente' },
  { value: 'reference', label: 'Referencia' },
  { value: 'occupations', label: 'Ocupación' },
  { value: 'alergies', label: 'Alergias' },
  { value: 'email', label: 'Email' },
  { value: 'gender', label: 'Sexo' },
  { value: 'marital_status', label: 'Estado Civil' },
  { value: 'blood_type', label: 'Tipo de Sangre' },
];

const matchTypes = [
  { value: 'exact', label: 'Coincidencia exacta' },
  { value: 'starts_with', label: 'Comienza con' },
  { value: 'contains', label: 'Contiene' },
  { value: 'ends_with', label: 'Termina con' },
];

export default function AdvanceSearch() {
  const [attributeName, setAttributeName] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [matchType, setMatchType] = useState('exact');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const handleSearch = async (e: React.FormEvent, page: number = 1) => {
    e.preventDefault();

    if (!attributeName || !attributeValue) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        attribute_name: attributeName,
        attribute_value: attributeValue,
        match_type: matchType,
        page: page.toString(),
      });

      const response = await fetch(apiUrl(`/api/advance-searches?${params}`));
      const data = await response.json();

      setResults(data.patients || []);
      setTotal(data.total || 0);
      setCurrentPage(data.page || 1);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Búsqueda avanzada
            </h3>
            <Link
              to="/"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg
                className="h-3 w-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </Link>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={(e) => handleSearch(e, 1)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="attribute_name"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Campo a buscar
                  </label>
                  <select
                    id="attribute_name"
                    required
                    value={attributeName}
                    onChange={(e) => setAttributeName(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Seleccione un campo</option>
                    {searchableAttributes.map((attr) => (
                      <option key={attr.value} value={attr.value}>
                        {attr.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="match_type"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Tipo de coincidencia
                  </label>
                  <select
                    id="match_type"
                    required
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    {matchTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="attribute_value"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Valor
                  </label>
                  <input
                    type="text"
                    id="attribute_value"
                    required
                    value={attributeValue}
                    onChange={(e) => setAttributeValue(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="Ingrese el valor a buscar"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50"
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
                <Link
                  to="/"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-5">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nombre
                      </th>
                      {attributeName !== 'name' && attributeName !== 'medical_record' && (
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {searchableAttributes.find(a => a.value === attributeName)?.label || attributeName}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {results.map((patient) => (
                      <tr key={patient.id} className="transition hover:bg-slate-50">
                        <td>
                          <Link
                            to={`/patients/${patient.id}/edit`}
                            className="block px-6 py-4 text-sm text-slate-700 hover:text-blue-600"
                          >
                            {patient.name}
                          </Link>
                        </td>
                        {attributeName !== 'name' && attributeName !== 'medical_record' && (
                          <td>
                            <Link
                              to={`/patients/${patient.id}/edit`}
                              className="block px-6 py-4 text-sm text-slate-600 hover:text-blue-600"
                            >
                              {String((patient as unknown as Record<string, unknown>)[attributeName] || '')}
                            </Link>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3 py-4 text-sm text-slate-600">
                  <button
                    onClick={(e) => handleSearch(e, currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {currentPage} de {totalPages} ({total} resultados)
                  </span>
                  <button
                    onClick={(e) => handleSearch(e, currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}

          {results.length === 0 && !loading && attributeName && attributeValue && (
            <div className="border-t border-slate-200 px-6 py-8">
              <p className="text-center text-sm text-slate-500">
                No se encontraron pacientes que coincidan con la búsqueda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
