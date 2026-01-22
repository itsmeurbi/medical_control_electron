'use client';

import { useState } from 'react';
import { Patient, Gender, MaritalStatus, Evera, BloodType, RhFactor, Consultation } from '@/lib/types';
import { calculateAge } from '@/lib/utils';

interface PatientFormProps {
  formData: Partial<Patient>;
  setFormData: (data: Partial<Patient>) => void;
  errors: Record<string, string>;
  loading: boolean;
  onSubmit: (e: React.FormEvent, treatment?: { date: string; procedure: string; meds: string }) => void;
  submitLabel: string;
  isEdit?: boolean;
  treatment: { date: string; procedure: string; meds: string };
  setTreatment: (treatment: { date: string; procedure: string; meds: string }) => void;
  treatments?: Consultation[];
  treatmentPagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
  onTreatmentDelete?: (id: number) => void;
  onTreatmentEdit?: (consultation: Consultation) => void;
  onTreatmentAdd?: (treatment: { date: string; procedure: string; meds: string }) => Promise<void>;
  onTreatmentPageChange?: (page: number) => void;
}

export default function PatientForm({
  formData,
  setFormData,
  errors,
  loading,
  onSubmit,
  submitLabel,
  isEdit = false,
  treatment,
  setTreatment,
  treatments = [],
  treatmentPagination,
  onTreatmentDelete,
  onTreatmentEdit,
  onTreatmentAdd,
  onTreatmentPageChange,
}: PatientFormProps) {
  const [age, setAge] = useState<number | null>(
    formData.birthDate ? calculateAge(formData.birthDate) : null
  );
  const [activeTab, setActiveTab] = useState('pain-form');

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, treatment);
  };

  return (
    <form onSubmit={handleFormSubmit}>
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
            <div className="w-full grid grid-cols-1 gap-2 mt-2">
              <div className="w-full">
                <label className="block mb-1">Tx. Intervencionismo:</label>
                <textarea
                  value={formData.interventionismTx || ''}
                  onChange={(e) => setFormData({ ...formData, interventionismTx: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
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

      {/* Tab System */}
      <div className="bg-white mt-0.5 shadow rounded">
        <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('pain-form')}
                className={`inline-block p-4 border-b-2 rounded-t-lg font-bold cursor-pointer ${
                  activeTab === 'pain-form'
                    ? 'text-blue-800 border-blue-800'
                    : 'text-gray-600 border-gray-600 hover:text-blue-900 hover:border-blue-900'
                }`}
              >
                Caracteristicas del dolor
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('physical-exploration-form')}
                className={`inline-block p-4 border-b-2 rounded-t-lg font-bold cursor-pointer ${
                  activeTab === 'physical-exploration-form'
                    ? 'text-blue-800 border-blue-800'
                    : 'text-gray-600 border-gray-600 hover:text-blue-900 hover:border-blue-900'
                }`}
              >
                Exploración física
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('lab-form')}
                className={`inline-block p-4 border-b-2 rounded-t-lg font-bold cursor-pointer ${
                  activeTab === 'lab-form'
                    ? 'text-blue-800 border-blue-800'
                    : 'text-gray-600 border-gray-600 hover:text-blue-900 hover:border-blue-900'
                }`}
              >
                Laboratorio/Gabinete
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('treatment-form')}
                className={`inline-block p-4 border-b-2 rounded-t-lg font-bold cursor-pointer ${
                  activeTab === 'treatment-form'
                    ? 'text-blue-800 border-blue-800'
                    : 'text-gray-600 border-gray-600 hover:text-blue-900 hover:border-blue-900'
                }`}
              >
                Tratamientos
              </button>
            </li>
          </ul>
        </div>

        {/* Pain Form Tab */}
        {activeTab === 'pain-form' && (
          <div className="p-4 shadow rounded bg-white">
            <div className="grid grid-cols-4 block gap-x-6">
              <div className="w-full flex flex-col">
                <label className="block mb-1">Inicio:</label>
                <textarea
                  value={formData.painInitialState || ''}
                  onChange={(e) => setFormData({ ...formData, painInitialState: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col">
                <label className="block mb-1">Tipo:</label>
                <textarea
                  value={formData.painType || ''}
                  onChange={(e) => setFormData({ ...formData, painType: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col">
                <label className="block mb-1">Irradiaciones:</label>
                <textarea
                  value={formData.irradiations || ''}
                  onChange={(e) => setFormData({ ...formData, irradiations: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="grid grid-cols-2 content-between w-full">
                <div>
                  <label className="block mb-1">EVA:</label>
                  <select
                    value={formData.evaluation ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evaluation: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-11/12 rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">EVERA:</label>
                  <select
                    value={formData.evera ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evera: e.target.value ? (parseInt(e.target.value) as Evera) : undefined,
                      })
                    }
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value={Evera.Leve}>Leve</option>
                    <option value={Evera.Moderado}>Moderado</option>
                    <option value={Evera.Fuerte}>Fuerte</option>
                    <option value={Evera.MuyFuerte}>Muy Fuerte</option>
                    <option value={Evera.Insoportable}>Insoportable</option>
                  </select>
                </div>
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">Evolución:</label>
                <textarea
                  value={formData.painEvolution || ''}
                  onChange={(e) => setFormData({ ...formData, painEvolution: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">Duración:</label>
                <textarea
                  value={formData.painDuration || ''}
                  onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.53 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v5.69a.75.75 0 0 0 1.5 0v-5.69l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                  </svg>
                </label>
                <input
                  type="text"
                  value={formData.increasesWith || ''}
                  onChange={(e) => setFormData({ ...formData, increasesWith: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">TX. Previo:</label>
                <textarea
                  value={formData.previousTx || ''}
                  onChange={(e) => setFormData({ ...formData, previousTx: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 block gap-x-6">
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">Estado actual:</label>
                <textarea
                  value={formData.painCurrentState || ''}
                  onChange={(e) => setFormData({ ...formData, painCurrentState: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">Localización:</label>
                <textarea
                  value={formData.painLocalization || ''}
                  onChange={(e) => setFormData({ ...formData, painLocalization: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.53 14.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V8.25a.75.75 0 0 0-1.5 0v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z" clipRule="evenodd" />
                  </svg>
                </label>
                <input
                  type="text"
                  value={formData.decreasesWith || ''}
                  onChange={(e) => setFormData({ ...formData, decreasesWith: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Physical Exploration Form Tab */}
        {activeTab === 'physical-exploration-form' && (
          <div className="grid grid-cols-3 grid-rows-3 bg-white block shadow rounded p-4 gap-x-6">
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="w-full">
                <label className="block mb-1">Gpo:</label>
                <select
                  value={formData.bloodType ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bloodType: e.target.value ? (parseInt(e.target.value) as BloodType) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value={BloodType.A}>A</option>
                  <option value={BloodType.B}>B</option>
                  <option value={BloodType.AB}>AB</option>
                  <option value={BloodType.O}>O</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Rh:</label>
                <select
                  value={formData.rhFactor ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rhFactor: e.target.value ? (parseInt(e.target.value) as RhFactor) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value={RhFactor.Negativo}>Negativo</option>
                  <option value={RhFactor.Positivo}>Positivo</option>
                </select>
              </div>
            </div>
            <div className="w-full">
              <label className="block mb-1">Cabeza:</label>
              <textarea
                value={formData.head || ''}
                onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full">
              <label className="block mb-1">Abdomen:</label>
              <textarea
                value={formData.abdomen || ''}
                onChange={(e) => setFormData({ ...formData, abdomen: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              <div className="w-full">
                <label className="block mb-1">Peso(Kg):</label>
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full">
                <label className="block mb-1">Talla(cm):</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      height: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="w-full pt-2">
              <label className="block mb-1">Cuello:</label>
              <textarea
                value={formData.neck || ''}
                onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full pt-2">
              <label className="block mb-1">Columna:</label>
              <textarea
                value={formData.spine || ''}
                onChange={(e) => setFormData({ ...formData, spine: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 w-full pt-2">
              <div className="w-full">
                <label className="block mb-1">TA:</label>
                <input
                  type="text"
                  value={formData.bloodPressure || ''}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full">
                <label className="block mb-1">FC:</label>
                <input
                  type="number"
                  value={formData.heartRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heartRate: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full">
                <label className="block mb-1">FR:</label>
                <input
                  type="number"
                  value={formData.breathRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breathRate: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full">
                <label className="block mb-1">SPO2:</label>
                <input
                  type="text"
                  value={formData.spo2 || ''}
                  onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="w-full pt-2">
              <label className="block mb-1">Tórax:</label>
              <textarea
                value={formData.chest || ''}
                onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
            <div className="w-full pt-2">
              <label className="block mb-1">Extremidades:</label>
              <textarea
                value={formData.extremities || ''}
                onChange={(e) => setFormData({ ...formData, extremities: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
              />
            </div>
          </div>
        )}

        {/* Lab Form Tab */}
        {activeTab === 'lab-form' && (
          <div className="grid grid-cols-2 grid-rows-2 block shadow rounded bg-white p-4 gap-x-6">
            <div>
              <label className="block mb-1">Laboratorio:</label>
              <textarea
                value={formData.laboratory || ''}
                onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <p className="block mb-1">Estudios</p>
              <div className="flex justify-start">
                <div className="pt-2 px-2">
                  <label className="block mb-1">Rx:</label>
                  <input
                    type="checkbox"
                    checked={formData.rx || false}
                    onChange={(e) => setFormData({ ...formData, rx: e.target.checked })}
                    className="rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className="block mb-1">TAC:</label>
                  <input
                    type="checkbox"
                    checked={formData.cat || false}
                    onChange={(e) => setFormData({ ...formData, cat: e.target.checked })}
                    className="rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className="block mb-1">IRM:</label>
                  <input
                    type="checkbox"
                    checked={formData.mri || false}
                    onChange={(e) => setFormData({ ...formData, mri: e.target.checked })}
                    className="rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className="block mb-1">US:</label>
                  <input
                    type="checkbox"
                    checked={formData.us || false}
                    onChange={(e) => setFormData({ ...formData, us: e.target.checked })}
                    className="rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className="block mb-1">DO:</label>
                  <input
                    type="checkbox"
                    checked={formData.do || false}
                    onChange={(e) => setFormData({ ...formData, do: e.target.checked })}
                    className="rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className="block mb-1">EMG:</label>
                  <input
                    type="checkbox"
                    checked={formData.emg || false}
                    onChange={(e) => setFormData({ ...formData, emg: e.target.checked })}
                    className="rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <label className="block mb-1">Gabinete:</label>
              <textarea
                value={formData.cabinet || ''}
                onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="pt-2">
              <label className="block mb-1">Interconsultas:</label>
              <textarea
                value={formData.consultations || ''}
                onChange={(e) => setFormData({ ...formData, consultations: e.target.value })}
                className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Treatment Form Tab */}
        {activeTab === 'treatment-form' && (
          <div className="grid grid-cols-2 block shadow rounded bg-white p-4">
            {isEdit ? (
              <div className="flex flex-col justify-between border-solid border-r border-gray-400 pr-4">
                <div id="treatments_list">
                  <h2 className="text-lg mb-2">Historial de tratamientos</h2>
                  {treatments && treatments.length > 0 ? (
                    treatments.map((t) => (
                      <div key={t.id} className="relative">
                        <button
                          type="button"
                          onClick={() => onTreatmentEdit && onTreatmentEdit(t)}
                          className="text-blue-800 hover:text-blue-900 hover:bg-gray-200 rounded p-1 cursor-pointer absolute top-0 right-0"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <h4 className="text-md">F. del tratamiento:</h4>
                        <p className="ml-2">
                          {t.date
                            ? new Date(t.date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Sin fecha'}
                        </p>
                        {t.procedure && (
                          <>
                            <h4 className="text-md mt-2">Procedimiento:</h4>
                            <p className="ml-2 whitespace-pre-line">{t.procedure}</p>
                          </>
                        )}
                        {t.meds && (
                          <>
                            <h4 className="text-md mt-2">Medicamentos:</h4>
                            <p className="ml-2 whitespace-pre-line">{t.meds}</p>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('¿Estas seguro que deseas eliminar de forma permanente este tratamiento?')) {
                              if (onTreatmentDelete && t.id) {
                                onTreatmentDelete(t.id);
                              }
                            }
                          }}
                          className="text-red-600 text-sm mt-2 block p-1 hover:bg-gray-200 rounded cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No hay tratamientos registrados.</p>
                  )}
                </div>
                {treatmentPagination && treatmentPagination.totalPages > 1 && (
                  <div id="treatments_pagination" className="mt-4">
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      {/* Previous Button */}
                      <button
                        type="button"
                        onClick={() => onTreatmentPageChange && onTreatmentPageChange(treatmentPagination.page - 1)}
                        disabled={treatmentPagination.page === 1}
                        className={`relative inline-flex items-center rounded-l-md border px-2 py-2 text-sm font-medium focus:z-20 cursor-pointer ${
                          treatmentPagination.page === 1
                            ? 'border-gray-300 bg-slate-100 text-gray-500'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      {(() => {
                        const current = treatmentPagination.page;
                        const total = treatmentPagination.totalPages;
                        const maxVisible = 7; // Fixed number of page buttons

                        let start: number;
                        let end: number;

                        if (total <= maxVisible) {
                          // If total pages is less than max visible, show all
                          start = 1;
                          end = total;
                        } else {
                          // Calculate sliding window
                          const halfWindow = Math.floor(maxVisible / 2);

                          if (current <= halfWindow + 1) {
                            // Near the start: show first pages
                            start = 1;
                            end = maxVisible;
                          } else if (current >= total - halfWindow) {
                            // Near the end: show last pages
                            start = total - maxVisible + 1;
                            end = total;
                          } else {
                            // In the middle: center around current page
                            start = current - halfWindow;
                            end = current + halfWindow;
                          }
                        }

                        const pages: number[] = [];
                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        return pages.map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => onTreatmentPageChange && onTreatmentPageChange(page)}
                            className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium focus:z-20 cursor-pointer ${
                              page === treatmentPagination.page
                                ? 'z-10 border-blue-800 bg-indigo-50 text-blue-800'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ));
                      })()}

                      {/* Next Button */}
                      <button
                        type="button"
                        onClick={() => onTreatmentPageChange && onTreatmentPageChange(treatmentPagination.page + 1)}
                        disabled={treatmentPagination.page >= treatmentPagination.totalPages}
                        className={`relative inline-flex items-center rounded-r-md border px-2 py-2 text-sm font-medium focus:z-20 cursor-pointer ${
                          treatmentPagination.page >= treatmentPagination.totalPages
                            ? 'border-gray-300 bg-slate-100 text-gray-500'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Siguiente</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-solid border-r border-gray-400 pr-4">
                <p className="text-gray-500">Los tratamientos se mostrarán aquí después de crear el paciente.</p>
              </div>
            )}
            <div className="border-solid border-l border-gray-400 pl-4">
              <h2 className="text-lg mb-2">Nuevo Tratamiento</h2>
              <div className="w-full block mt-2">
                <div>
                  <label className="block mb-1">F. del tratamiento:</label>
                </div>
                <input
                  type="date"
                  value={treatment.date}
                  onChange={(e) => setTreatment({ ...treatment, date: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full mt-2">
                <label className="block mb-1">Procedimiento:</label>
                <textarea
                  value={treatment.procedure}
                  onChange={(e) => setTreatment({ ...treatment, procedure: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              <div className="w-full mt-2">
                <label className="block mb-1">Medicamentos:</label>
                <textarea
                  value={treatment.meds}
                  onChange={(e) => setTreatment({ ...treatment, meds: e.target.value })}
                  className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              {onTreatmentAdd && (
                <button
                  type="button"
                  onClick={async () => {
                    if (treatment.procedure || treatment.meds) {
                      await onTreatmentAdd(treatment);
                      // Reset treatment form
                      setTreatment({
                        date: new Date().toISOString().split('T')[0],
                        procedure: '',
                        meds: '',
                      });
                    }
                  }}
                  className="bg-blue-600 text-sm hover:bg-blue-800 shadow-sm text-white py-1 px-2 rounded block mr-2 cursor-pointer mt-2"
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-800 shadow-sm text-white font-bold py-2 px-4 rounded block mr-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
