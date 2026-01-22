'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Patient, Gender, MaritalStatus } from '@/lib/types';
import { calculateAge } from '@/lib/utils';

export default function EditPatient() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    registeredAt: new Date().toISOString().split('T')[0],
    gender: undefined,
    birthDate: '',
  });

  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/patients/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.birthDate) {
            setFormData({
              ...data,
              registeredAt: data.registeredAt ? data.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
              birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
            });
            if (data.birthDate) {
              setAge(calculateAge(data.birthDate));
            }
          } else {
            setFormData({
              ...data,
              registeredAt: data.registeredAt ? data.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
          setFetching(false);
        })
        .catch(err => {
          console.error('Error fetching patient:', err);
          setErrors({ submit: 'Error cargando al paciente' });
          setFetching(false);
        });
    }
  }, [id]);

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setFormData({ ...formData, birthDate: date });
    if (date) {
      const calculatedAge = calculateAge(date);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nombre es requerido';
    if (!formData.registeredAt) newErrors.registeredAt = 'Fecha de ingreso es requerida';
    if (formData.gender === undefined) newErrors.gender = 'Sexo es requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Error actualizando al paciente' });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      setErrors({ submit: 'Error actualizando al paciente' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="shadow rounded p-4 m-4 bg-blue-50">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="shadow rounded p-4 m-4 bg-blue-50">
      <h1 className="text-3xl font-bold mb-4 text-black flex text-blue-800 justify-center">
        Editar Paciente
      </h1>

      {errors.submit && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 shadow rounded bg-white p-4 gap-x-6 gap-y-2">
          {/* Column 1 */}
          <div className="flex flex-col gap-2">
            <div className="w-full">
              <label className="block mb-1">Nombre:</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full rounded p-2 text-gray-900 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 w-full gap-2">
              <div>
                <label className="block mb-1">Exp:</label>
                <input
                  type="text"
                  value={formData.medicalRecord || ''}
                  disabled
                  readOnly
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                />
              </div>
              <div>
                <label className="block mb-1">F. Ingreso:</label>
                <input
                  type="date"
                  required
                  value={formData.registeredAt || ''}
                  onChange={(e) => setFormData({ ...formData, registeredAt: e.target.value })}
                  className={`w-full rounded p-2 text-gray-900 border ${
                    errors.registeredAt ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.registeredAt && (
                  <p className="text-red-500 text-sm mt-1">{errors.registeredAt}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-6 w-full gap-2">
              <div className="flex flex-col justify-end col-span-3">
                <label className="block mb-1">F. Nac:</label>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={handleBirthDateChange}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="block mb-1">Edad:</label>
                <input
                  type="number"
                  value={age || ''}
                  disabled
                  readOnly
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="block mb-1">Sexo:</label>
                <select
                  required
                  value={formData.gender ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: parseInt(e.target.value) as Gender })
                  }
                  className={`w-full rounded p-2 text-gray-900 border ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="">Seleccionar</option>
                  <option value={Gender.Masculino}>Masculino</option>
                  <option value={Gender.Femenino}>Femenino</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>
              <div className="flex flex-col justify-end">
                <label className="block mb-1">E. Civil:</label>
                <select
                  value={formData.maritalStatus ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maritalStatus: e.target.value ? (parseInt(e.target.value) as MaritalStatus) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value={MaritalStatus.Casado}>Casado</option>
                  <option value={MaritalStatus.Divorciado}>Divorciado</option>
                  <option value={MaritalStatus.Soltero}>Soltero</option>
                  <option value={MaritalStatus.UnionLibre}>Unión Libre</option>
                  <option value={MaritalStatus.Viudo}>Viudo</option>
                </select>
              </div>
            </div>

            <div>
              <div className="w-full grid grid-cols-2 gap-2">
                <div className="w-full">
                  <label className="block mb-1">Referencia:</label>
                  <input
                    type="text"
                    value={formData.reference || ''}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="w-full">
                  <label className="block mb-1">S. Fiscal/Fact:</label>
                  <textarea
                    value={formData.fiscalSituation || ''}
                    onChange={(e) => setFormData({ ...formData, fiscalSituation: e.target.value })}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    rows={1}
                  />
                </div>
              </div>
              <div className="w-full grid grid-cols-1 gap-2 mt-2">
                <div className="w-full">
                  <label className="block mb-1">Ocupación:</label>
                  <textarea
                    value={formData.occupations || ''}
                    onChange={(e) => setFormData({ ...formData, occupations: e.target.value })}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    rows={1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-2">
            <div className="w-full flex flex-col">
              <label className="font-bold text-red-600 mb-1">ALERGIAS:</label>
              <textarea
                value={formData.alergies || ''}
                onChange={(e) => setFormData({ ...formData, alergies: e.target.value })}
                className="w-full rounded p-2 text-red-600 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full flex flex-col">
              <label className="font-bold text-red-600 mb-1">ANTICOAGULANTES:</label>
              <textarea
                value={formData.anticoagulants || ''}
                onChange={(e) => setFormData({ ...formData, anticoagulants: e.target.value })}
                className="w-full rounded p-2 text-red-600 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="w-full flex flex-col justify-end">
                <label className="block mb-1">Celular 1:</label>
                <input
                  type="text"
                  value={formData.cellphoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, cellphoneNumber: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full flex flex-col justify-end">
                <label className="block mb-1">Celular 2:</label>
                <input
                  type="text"
                  value={formData.cellphoneNumberTwo || ''}
                  onChange={(e) => setFormData({ ...formData, cellphoneNumberTwo: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full flex flex-col justify-end">
                <label className="block mb-1">Celular 3:</label>
                <input
                  type="text"
                  value={formData.cellphoneNumberThree || ''}
                  onChange={(e) => setFormData({ ...formData, cellphoneNumberThree: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full flex flex-col justify-end">
                <label className="block mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full flex flex-col justify-end col-span-2">
                <label className="block mb-1">Email:</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <div className="w-full grid grid-cols-8 gap-2">
                <div className="w-full col-span-5">
                  <label className="block mb-1">Domicilio:</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    rows={1}
                  />
                </div>
                <div className="w-full col-span-3">
                  <label className="block mb-1">Ciudad:</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-2">
            <div className="w-full flex flex-col">
              <label className="block mb-1">Crónicos/Degenerativas:</label>
              <textarea
                value={formData.chronics || ''}
                onChange={(e) => setFormData({ ...formData, chronics: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full flex flex-col">
              <label className="block mb-1">DX. A. Inicial:</label>
              <textarea
                value={formData.initialDx || ''}
                onChange={(e) => setFormData({ ...formData, initialDx: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full flex flex-col justify-end">
              <label className="block mb-1">DX. A. Final:</label>
              <textarea
                value={formData.finalDx || ''}
                onChange={(e) => setFormData({ ...formData, finalDx: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full flex flex-col">
              <label className="block mb-1">Antecedentes:</label>
              <textarea
                value={formData.medicalBackground || ''}
                onChange={(e) => setFormData({ ...formData, medicalBackground: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full flex flex-col">
              <label className="block mb-1">QX:</label>
              <textarea
                value={formData.surgicalBackground || ''}
                onChange={(e) => setFormData({ ...formData, surgicalBackground: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="flex">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-800 shadow-sm text-white font-bold py-2 px-4 rounded block mr-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Actualizar paciente'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded border"
            >
              Regresar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
