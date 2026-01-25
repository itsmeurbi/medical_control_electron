import { useState } from 'react';
import { Patient, Gender, MaritalStatus, Evera, BloodType, RhFactor, Consultation } from '../../lib/types';
import { calculateAge } from '../../lib/utils';

interface PatientFormProps {
  formData?: Partial<Patient>;
  setFormData: (data: Partial<Patient>) => void;
  errors?: Record<string, string>;
  loading?: boolean;
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
  onCancel?: () => void;
}

export default function PatientForm({
  formData = {},
  setFormData,
  errors = {},
  loading = false,
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
  onCancel,
}: PatientFormProps) {
  // Ensure formData always has a value to prevent SSR errors
  const safeFormData = formData || {};

  const [age, setAge] = useState<number | null>(
    safeFormData?.birthDate ? calculateAge(safeFormData.birthDate) : null
  );
  const [activeTab, setActiveTab] = useState('pain-form');
  const inputBase = 'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100';
  const inputError = 'border-red-300 focus:border-red-400 focus:ring-red-100';
  const selectBase = `${inputBase} h-[38px]`;
  const textareaBase = `${inputBase} resize-y`;
  const mutedInput = `${inputBase} bg-slate-100 text-slate-500`;
  const labelBase = 'block text-sm font-medium text-slate-600';

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setFormData({ ...safeFormData, birthDate: date });
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
      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-3">
        {/* Column 1 */}
        <div className="flex flex-col gap-2">
          <div className="w-full">
            <label className={labelBase}>Nombre:</label>
            <input
              type="text"
              required
              value={safeFormData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`${inputBase} ${errors.name ? inputError : ''}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 w-full gap-2">
            <div>
              <label className={labelBase}>Exp:</label>
              <input
                type="text"
                value={safeFormData.medicalRecord || ''}
                disabled
                readOnly
                className={mutedInput}
              />
            </div>
            <div>
              <label className={labelBase}>F. Ingreso:</label>
              <input
                type="date"
                required
                value={safeFormData.registeredAt || ''}
                onChange={(e) => setFormData({ ...formData, registeredAt: e.target.value })}
                className={`${inputBase} ${errors.registeredAt ? inputError : ''}`}
              />
              {errors.registeredAt && (
                <p className="mt-1 text-xs text-red-600">{errors.registeredAt}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 w-full gap-2">
            <div className="flex flex-col justify-end col-span-3">
              <label className={labelBase}>F. Nac:</label>
              <input
                type="date"
                value={safeFormData.birthDate || ''}
                onChange={handleBirthDateChange}
                className={inputBase}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className={labelBase}>Edad:</label>
              <input
                type="number"
                value={age || ''}
                disabled
                readOnly
                className={mutedInput}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className={labelBase}>Sexo:</label>
              <select
                required
                value={safeFormData.gender ?? ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className={`${selectBase} ${errors.gender ? inputError : ''}`}
              >
                <option value=""></option>
                <option value={Gender.Masculino}>M</option>
                <option value={Gender.Femenino}>F</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
            </div>
            <div className="flex flex-col justify-end">
              <label className={labelBase}>E. Civil:</label>
              <select
                value={safeFormData.maritalStatus ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maritalStatus: e.target.value ? (parseInt(e.target.value) as MaritalStatus) : undefined,
                  })
                }
                className={selectBase}
              >
                <option value=""></option>
                <option value={MaritalStatus.Casado}>C</option>
                <option value={MaritalStatus.Divorciado}>D</option>
                <option value={MaritalStatus.Soltero}>S</option>
                <option value={MaritalStatus.UnionLibre}>U</option>
                <option value={MaritalStatus.Viudo}>V</option>
              </select>
            </div>
          </div>

          <div>
            <div className="w-full grid grid-cols-2 gap-2">
              <div className="w-full">
                <label className={labelBase}>Referencia:</label>
                <input
                  type="text"
                  value={safeFormData.reference || ''}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className={inputBase}
                />
              </div>
              <div className="w-full">
                <label className={labelBase}>S. Fiscal/Fact:</label>
                <textarea
                  value={safeFormData.fiscalSituation || ''}
                  onChange={(e) => setFormData({ ...formData, fiscalSituation: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
            </div>
            <div className="w-full grid grid-cols-1 gap-2">
              <div className="w-full">
                <label className={labelBase}>Ocupación:</label>
                <textarea
                  value={safeFormData.occupations || ''}
                  onChange={(e) => setFormData({ ...formData, occupations: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-2">
          <div className="w-full flex flex-col">
            <label className="text-sm font-semibold text-red-600">ALERGIAS:</label>
            <textarea
              value={safeFormData.alergies || ''}
              onChange={(e) => setFormData({ ...formData, alergies: e.target.value })}
              className={`${textareaBase} border-red-200 text-red-600 focus:border-red-300 focus:ring-red-100`}
              rows={1}
            />
          </div>
          <div className="w-full flex flex-col">
            <label className="text-sm font-semibold text-red-600">ANTICOAGULANTES:</label>
            <textarea
              value={safeFormData.anticoagulants || ''}
              onChange={(e) => setFormData({ ...formData, anticoagulants: e.target.value })}
              className={`${textareaBase} border-red-200 text-red-600 focus:border-red-300 focus:ring-red-100`}
              rows={1}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="w-full flex flex-col justify-end">
              <label className="flex flex-col justify-end text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                </svg>
                <input
                  type="text"
                  value={safeFormData.cellphoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, cellphoneNumber: e.target.value })}
                  className={`${inputBase} mt-1`}
                />
              </label>
            </div>
            <div className="w-full flex flex-col justify-end">
              <label className="flex flex-col justify-end text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                </svg>
                <input
                  type="text"
                  value={safeFormData.cellphoneNumberTwo || ''}
                  onChange={(e) => setFormData({ ...formData, cellphoneNumberTwo: e.target.value })}
                  className={`${inputBase} mt-1`}
                />
              </label>
            </div>
            <div className="w-full flex flex-col justify-end">
              <label className="flex flex-col justify-end text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                </svg>
                <input
                  type="text"
                  value={safeFormData.cellphoneNumberThree || ''}
                  onChange={(e) => setFormData({ ...formData, cellphoneNumberThree: e.target.value })}
                  className={`${inputBase} mt-1`}
                />
              </label>
            </div>
            <div className="w-full flex flex-col justify-end">
              <label className="flex flex-col justify-end text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                </svg>
                <input
                  type="text"
                  value={safeFormData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`${inputBase} mt-1`}
                />
              </label>
            </div>
            <div className="w-full flex flex-col justify-end col-span-2">
              <label className="flex flex-col justify-end text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
                </svg>
                <input
                  type="email"
                  value={safeFormData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`${inputBase} mt-1`}
                />
              </label>
            </div>
          </div>
          <div>
            <div className="w-full grid grid-cols-8 gap-2">
              <div className="w-full col-span-5">
                <label className={labelBase}>Domicilio:</label>
                <textarea
                  value={safeFormData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full col-span-3">
                <label className={labelBase}>Ciudad:</label>
                <input
                  type="text"
                  value={safeFormData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputBase}
                />
              </div>
            </div>
            <div className="w-full grid grid-cols-1 gap-2 mt-2">
              <div className="w-full">
                <label className={labelBase}>Tx. Intervencionismo:</label>
                <textarea
                  value={safeFormData.interventionismTx || ''}
                  onChange={(e) => setFormData({ ...formData, interventionismTx: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-2">
          <div className="w-full flex flex-col">
            <label className={labelBase}>Crónicos/Degenerativas:</label>
            <textarea
              value={safeFormData.chronics || ''}
              onChange={(e) => setFormData({ ...formData, chronics: e.target.value })}
              className={textareaBase}
              rows={1}
            />
          </div>
          <div className="w-full flex flex-col">
            <label className={labelBase}>DX. A. Inicial:</label>
            <textarea
              value={safeFormData.initialDx || ''}
              onChange={(e) => setFormData({ ...formData, initialDx: e.target.value })}
              className={textareaBase}
              rows={1}
            />
          </div>
          <div className="w-full flex flex-col justify-end">
            <label className={labelBase}>DX. A. Final:</label>
            <textarea
              value={safeFormData.finalDx || ''}
              onChange={(e) => setFormData({ ...formData, finalDx: e.target.value })}
              className={textareaBase}
              rows={1}
            />
          </div>
          <div className="w-full flex flex-col">
            <label className={labelBase}>Antecedentes:</label>
            <textarea
              value={safeFormData.medicalBackground || ''}
              onChange={(e) => setFormData({ ...formData, medicalBackground: e.target.value })}
              className={textareaBase}
              rows={1}
            />
          </div>
          <div className="w-full flex flex-col">
            <label className={labelBase}>QX:</label>
            <textarea
              value={safeFormData.surgicalBackground || ''}
              onChange={(e) => setFormData({ ...formData, surgicalBackground: e.target.value })}
              className={textareaBase}
              rows={1}
            />
          </div>
        </div>
      </div>

      {/* Tab System */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 text-sm font-medium text-slate-500">
          <ul className="flex flex-wrap gap-2 px-4">
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('pain-form')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'pain-form'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                Caracteristicas del dolor
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('physical-exploration-form')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'physical-exploration-form'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                Exploración física
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('lab-form')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'lab-form'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                Laboratorio/Gabinete
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('treatment-form')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'treatment-form'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                Tratamientos
              </button>
            </li>
          </ul>
        </div>

        {/* Pain Form Tab */}
        {activeTab === 'pain-form' && (
          <div className="bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="w-full flex flex-col">
                <label className={labelBase}>Inicio:</label>
                <textarea
                  value={safeFormData.painInitialState || ''}
                  onChange={(e) => setFormData({ ...formData, painInitialState: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col">
                <label className={labelBase}>Tipo:</label>
                <textarea
                  value={safeFormData.painType || ''}
                  onChange={(e) => setFormData({ ...formData, painType: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col">
                <label className={labelBase}>Irradiaciones:</label>
                <textarea
                  value={safeFormData.irradiations || ''}
                  onChange={(e) => setFormData({ ...formData, irradiations: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 content-between w-full">
                <div>
                  <label className={labelBase}>EVA:</label>
                  <select
                    value={safeFormData.evaluation ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evaluation: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className={`${selectBase} w-11/12`}
                  >
                    <option value=""></option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelBase}>EVERA:</label>
                  <select
                    value={safeFormData.evera ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evera: e.target.value ? (parseInt(e.target.value) as Evera) : undefined,
                      })
                    }
                    className={selectBase}
                  >
                    <option value=""></option>
                    <option value={Evera.Leve}>Leve</option>
                    <option value={Evera.Moderado}>Moderado</option>
                    <option value={Evera.Fuerte}>Fuerte</option>
                    <option value={Evera.MuyFuerte}>Muy Fuerte</option>
                    <option value={Evera.Insoportable}>Insoportable</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4 mt-6">
              <div className="w-full flex flex-col pt-2">
                <label className={labelBase}>Evolución:</label>
                <textarea
                  value={safeFormData.painEvolution || ''}
                  onChange={(e) => setFormData({ ...formData, painEvolution: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className={labelBase}>Duración:</label>
                <textarea
                  value={safeFormData.painDuration || ''}
                  onChange={(e) => setFormData({ ...formData, painDuration: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block text-sm font-medium text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.53 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v5.69a.75.75 0 0 0 1.5 0v-5.69l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                  </svg>
                </label>
                <input
                  type="text"
                  value={safeFormData.increasesWith || ''}
                  onChange={(e) => setFormData({ ...formData, increasesWith: e.target.value })}
                  className={inputBase}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className={labelBase}>TX. Previo:</label>
                <textarea
                  value={safeFormData.previousTx || ''}
                  onChange={(e) => setFormData({ ...formData, previousTx: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4 mt-6">
              <div className="w-full flex flex-col pt-2">
                <label className={labelBase}>Estado actual:</label>
                <textarea
                  value={safeFormData.painCurrentState || ''}
                  onChange={(e) => setFormData({ ...formData, painCurrentState: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className={labelBase}>Localización:</label>
                <textarea
                  value={safeFormData.painLocalization || ''}
                  onChange={(e) => setFormData({ ...formData, painLocalization: e.target.value })}
                  className={textareaBase}
                  rows={1}
                />
              </div>
              <div className="w-full flex flex-col pt-2">
                <label className="block text-sm font-medium text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.53 14.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V8.25a.75.75 0 0 0-1.5 0v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z" clipRule="evenodd" />
                  </svg>
                </label>
                <input
                  type="text"
                  value={safeFormData.decreasesWith || ''}
                  onChange={(e) => setFormData({ ...formData, decreasesWith: e.target.value })}
                  className={inputBase}
                />
              </div>
            </div>
          </div>
        )}

        {/* Physical Exploration Form Tab */}
        {activeTab === 'physical-exploration-form' && (
          <div className="grid gap-6 bg-white p-6 shadow-sm lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="w-full">
                <label className={labelBase}>Gpo:</label>
                <select
                  value={safeFormData.bloodType ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bloodType: e.target.value ? (parseInt(e.target.value) as BloodType) : undefined,
                    })
                  }
                  className={selectBase}
                >
                  <option value=""></option>
                  <option value={BloodType.A}>A</option>
                  <option value={BloodType.B}>B</option>
                  <option value={BloodType.AB}>AB</option>
                  <option value={BloodType.O}>O</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>Rh:</label>
                <select
                  value={safeFormData.rhFactor ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rhFactor: e.target.value ? (parseInt(e.target.value) as RhFactor) : undefined,
                    })
                  }
                  className={selectBase}
                >
                  <option value=""></option>
                  <option value={RhFactor.Negativo}>Negativo</option>
                  <option value={RhFactor.Positivo}>Positivo</option>
                </select>
              </div>
            </div>
            <div className="w-full">
              <label className={labelBase}>Cabeza:</label>
              <textarea
                value={safeFormData.head || ''}
                onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                className={textareaBase}
                rows={1}
              />
            </div>
            <div className="w-full">
              <label className={labelBase}>Abdomen:</label>
              <textarea
                value={safeFormData.abdomen || ''}
                onChange={(e) => setFormData({ ...formData, abdomen: e.target.value })}
                className={textareaBase}
                rows={1}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              <div className="w-full">
                <label className={labelBase}>Peso(Kg):</label>
                <input
                  type="number"
                  value={safeFormData.weight || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className={inputBase}
                />
              </div>
              <div className="w-full">
                <label className={labelBase}>Talla(cm):</label>
                <input
                  type="number"
                  value={safeFormData.height || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      height: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className={inputBase}
                />
              </div>
            </div>
            <div className="w-full pt-2">
              <label className={labelBase}>Cuello:</label>
              <textarea
                value={safeFormData.neck || ''}
                onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                className={textareaBase}
                rows={1}
              />
            </div>
            <div className="w-full pt-2">
              <label className={labelBase}>Columna:</label>
              <textarea
                value={safeFormData.spine || ''}
                onChange={(e) => setFormData({ ...formData, spine: e.target.value })}
                className={textareaBase}
                rows={1}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 w-full pt-2">
              <div className="w-full">
                <label className={labelBase}>TA:</label>
                <input
                  type="text"
                  value={safeFormData.bloodPressure || ''}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  className={inputBase}
                />
              </div>
              <div className="w-full">
                <label className={labelBase}>FC:</label>
                <input
                  type="number"
                  value={safeFormData.heartRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heartRate: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className={inputBase}
                />
              </div>
              <div className="w-full">
                <label className={labelBase}>FR:</label>
                <input
                  type="number"
                  value={safeFormData.breathRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breathRate: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className={inputBase}
                />
              </div>
              <div className="w-full">
                <label className={labelBase}>SPO2:</label>
                <input
                  type="text"
                  value={safeFormData.spo2 || ''}
                  onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                  className={inputBase}
                />
              </div>
            </div>
            <div className="w-full pt-2">
              <label className={labelBase}>Tórax:</label>
              <textarea
                value={safeFormData.chest || ''}
                onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                className={textareaBase}
                rows={1}
              />
            </div>
            <div className="w-full pt-2">
              <label className={labelBase}>Extremidades:</label>
              <textarea
                value={safeFormData.extremities || ''}
                onChange={(e) => setFormData({ ...formData, extremities: e.target.value })}
                className={textareaBase}
                rows={1}
              />
            </div>
          </div>
        )}

        {/* Lab Form Tab */}
        {activeTab === 'lab-form' && (
          <div className="grid gap-6 bg-white p-6 shadow-sm lg:grid-cols-2">
            <div>
              <label className={labelBase}>Laboratorio:</label>
              <textarea
                value={safeFormData.laboratory || ''}
                onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                className={textareaBase}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Estudios</p>
              <div className="flex justify-start">
                <div className="pt-2 px-2">
                  <label className={labelBase}>Rx:</label>
                  <input
                    type="checkbox"
                    checked={safeFormData.rx || false}
                    onChange={(e) => setFormData({ ...formData, rx: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className={labelBase}>TAC:</label>
                  <input
                    type="checkbox"
                    checked={safeFormData.cat || false}
                    onChange={(e) => setFormData({ ...formData, cat: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className={labelBase}>IRM:</label>
                  <input
                    type="checkbox"
                    checked={safeFormData.mri || false}
                    onChange={(e) => setFormData({ ...formData, mri: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className={labelBase}>US:</label>
                  <input
                    type="checkbox"
                    checked={safeFormData.us || false}
                    onChange={(e) => setFormData({ ...formData, us: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className={labelBase}>DO:</label>
                  <input
                    type="checkbox"
                    checked={safeFormData.do || false}
                    onChange={(e) => setFormData({ ...formData, do: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="pt-2 px-2">
                  <label className={labelBase}>EMG:</label>
                  <input
                    type="checkbox"
                    checked={safeFormData.emg || false}
                    onChange={(e) => setFormData({ ...formData, emg: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <label className={labelBase}>Gabinete:</label>
              <textarea
                value={safeFormData.cabinet || ''}
                onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                className={textareaBase}
              />
            </div>
            <div className="pt-2">
              <label className={labelBase}>Interconsultas:</label>
              <textarea
                value={safeFormData.consultations || ''}
                onChange={(e) => setFormData({ ...formData, consultations: e.target.value })}
                className={textareaBase}
              />
            </div>
          </div>
        )}

        {/* Treatment Form Tab */}
        {activeTab === 'treatment-form' && (
          <div className="grid gap-6 bg-white p-6 shadow-sm lg:grid-cols-2">
            {isEdit ? (
              <div className="flex flex-col justify-between border-r border-slate-200 pr-4">
                <div id="treatments_list">
                  <h2 className="text-base font-semibold text-slate-900 mb-3">Historial de tratamientos</h2>
                  {treatments && treatments.length > 0 ? (
                    treatments.map((t) => (
                      <div key={t.id} className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <button
                          type="button"
                          onClick={() => onTreatmentEdit && onTreatmentEdit(t)}
                          className="absolute right-2 top-2 rounded-full p-1 text-blue-600 transition hover:bg-white hover:text-blue-700 cursor-pointer"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <h4 className="text-sm font-semibold text-slate-700">F. del tratamiento</h4>
                        <p className="ml-2 text-sm text-slate-600">
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
                            <h4 className="mt-2 text-sm font-semibold text-slate-700">Procedimiento</h4>
                            <p className="ml-2 whitespace-pre-line text-sm text-slate-600">{t.procedure}</p>
                          </>
                        )}
                        {t.meds && (
                          <>
                            <h4 className="mt-2 text-sm font-semibold text-slate-700">Medicamentos</h4>
                            <p className="ml-2 whitespace-pre-line text-sm text-slate-600">{t.meds}</p>
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
                          className="mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay tratamientos registrados.</p>
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
                            ? 'border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                                ? 'z-10 border-blue-600 bg-blue-50 text-blue-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
                            ? 'border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
              <div className="border-r border-slate-200 pr-4">
                <p className="text-sm text-slate-500">Los tratamientos se mostrarán aquí después de crear el paciente.</p>
              </div>
            )}
            <div className="border-l border-slate-200 pl-4">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Nuevo Tratamiento</h2>
              <div className="w-full block mt-2">
                <div>
                  <label className={labelBase}>F. del tratamiento:</label>
                </div>
                <input
                  type="date"
                  value={treatment.date}
                  onChange={(e) => setTreatment({ ...treatment, date: e.target.value })}
                  className={inputBase}
                />
              </div>
              <div className="w-full mt-2">
                <label className={labelBase}>Procedimiento:</label>
                <textarea
                  value={treatment.procedure}
                  onChange={(e) => setTreatment({ ...treatment, procedure: e.target.value })}
                  className={textareaBase}
                  rows={4}
                />
              </div>
              <div className="w-full mt-2">
                <label className={labelBase}>Medicamentos:</label>
                <textarea
                  value={treatment.meds}
                  onChange={(e) => setTreatment({ ...treatment, meds: e.target.value })}
                  className={textareaBase}
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
                  className="mt-3 inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 cursor-pointer"
          >
            Regresar
          </button>
        )}
        <div className="flex">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
