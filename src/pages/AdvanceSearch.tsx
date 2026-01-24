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
    <div className="shadow bg-gray-900/50 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex">
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              Búsqueda avanzada
            </h3>
            <Link
              to="/"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            >
              <svg
                className="w-3 h-3"
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
          <div className="p-4">
            <form onSubmit={(e) => handleSearch(e, 1)}>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label
                    htmlFor="attribute_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Campo a buscar
                  </label>
                  <select
                    id="attribute_name"
                    required
                    value={attributeName}
                    onChange={(e) => setAttributeName(e.target.value)}
                    className="w-full rounded p-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tipo de coincidencia
                  </label>
                  <select
                    id="match_type"
                    required
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="w-full rounded p-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {matchTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="attribute_value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor
                  </label>
                  <input
                    type="text"
                    id="attribute_value"
                    required
                    value={attributeValue}
                    onChange={(e) => setAttributeValue(e.target.value)}
                    className="w-full rounded p-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese el valor a buscar"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
                <Link
                  to="/"
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="p-4 border-t">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      {attributeName !== 'name' && attributeName !== 'medical_record' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {searchableAttributes.find(a => a.value === attributeName)?.label || attributeName}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((patient) => (
                      <tr key={patient.id} className="hover:bg-blue-50 hover:shadow-md transition-all duration-200 ease-in-out">
                        <td>
                          <Link
                            to={`/patients/${patient.id}/edit`}
                            className="block px-6 py-4 whitespace-nowrap hover:text-blue-600"
                          >
                            {patient.name}
                          </Link>
                        </td>
                        {attributeName !== 'name' && attributeName !== 'medical_record' && (
                          <td>
                            <Link
                              to={`/patients/${patient.id}/edit`}
                              className="block px-6 py-4 whitespace-nowrap hover:text-blue-600"
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
                <div className="flex justify-center py-4 gap-2">
                  <button
                    onClick={(e) => handleSearch(e, currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2">
                    Página {currentPage} de {totalPages} ({total} resultados)
                  </span>
                  <button
                    onClick={(e) => handleSearch(e, currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}

          {results.length === 0 && !loading && attributeName && attributeValue && (
            <div className="p-4 border-t">
              <p className="text-center text-gray-500 py-8">
                No se encontraron pacientes que coincidan con la búsqueda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
