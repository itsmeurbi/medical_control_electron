'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Patient, Consultation } from '@/lib/types';
import PatientForm from '../_form';

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
  const [treatments, setTreatments] = useState<Consultation[]>([]);
  const [treatmentPage, setTreatmentPage] = useState(1);
  const [treatmentPagination, setTreatmentPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [treatment, setTreatment] = useState({
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    meds: '',
  });
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchTreatments = async (page: number = 1) => {
    if (!id || typeof id !== 'string') return;

    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) return;

    try {
      const response = await fetch(`/api/consultations?patient_id=${patientId}&page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setTreatments(data.consultations || []);
        setTreatmentPagination(data.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      }
    } catch (error) {
      console.error('Error fetching treatments:', error);
    }
  };

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
          } else {
            setFormData({
              ...data,
              registeredAt: data.registeredAt ? data.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
          setFetching(false);
          // Fetch paginated treatments
          fetchTreatments(1);
        })
        .catch(err => {
          console.error('Error fetching patient:', err);
          setErrors({ submit: 'Error cargando al paciente' });
          setFetching(false);
        });
    }
  }, [id]);

  const handleTreatmentDelete = async (consultationId: number) => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh treatments list (stay on current page)
        fetchTreatments(treatmentPage);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Error eliminando el tratamiento' });
      }
    } catch (error) {
      console.error('Error deleting treatment:', error);
      setErrors({ submit: 'Error eliminando el tratamiento' });
    }
  };

  const handleTreatmentEdit = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    setShowEditModal(true);
  };

  const handleTreatmentAdd = async (treatmentData: { date: string; procedure: string; meds: string }) => {
    if (!id || typeof id !== 'string') {
      setErrors({ submit: 'ID de paciente no válido' });
      return;
    }

    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) {
      setErrors({ submit: 'ID de paciente no válido' });
      return;
    }

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          date: treatmentData.date || new Date().toISOString().split('T')[0],
          procedure: treatmentData.procedure || null,
          meds: treatmentData.meds || null,
        }),
      });

      if (response.ok) {
        // Refresh treatments list (stay on current page)
        fetchTreatments(treatmentPage);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Error agregando el tratamiento' });
      }
    } catch (error) {
      console.error('Error adding treatment:', error);
      setErrors({ submit: 'Error agregando el tratamiento' });
    }
  };

  const handleConsultationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsultation || !editingConsultation.id) return;

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        date: formData.get('date'),
        procedure: formData.get('procedure'),
        meds: formData.get('meds'),
      };

      const response = await fetch(`/api/consultations/${editingConsultation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingConsultation(null);
        // Refresh treatments list (stay on current page)
        fetchTreatments(treatmentPage);
    } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Error actualizando el tratamiento' });
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      setErrors({ submit: 'Error actualizando el tratamiento' });
    }
  };

  const handleSubmit = async (e: React.FormEvent, treatmentData?: { date: string; procedure: string; meds: string }) => {
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
        body: JSON.stringify({
          ...formData,
          treatment: treatmentData && (treatmentData.procedure || treatmentData.meds) ? treatmentData : undefined,
        }),
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

      <PatientForm
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        loading={loading}
        onSubmit={handleSubmit}
        submitLabel="Actualizar paciente"
        isEdit={true}
        treatments={treatments}
        treatment={treatment}
        setTreatment={setTreatment}
        onTreatmentDelete={handleTreatmentDelete}
        onTreatmentEdit={handleTreatmentEdit}
        onTreatmentAdd={handleTreatmentAdd}
        treatmentPagination={treatmentPagination}
        onTreatmentPageChange={(page) => {
          setTreatmentPage(page);
          fetchTreatments(page);
        }}
      />

      {/* Edit Consultation Modal */}
      {showEditModal && editingConsultation && (
        <div className="shadow bg-gray-900/50 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex">
          <div className="relative p-4 w-full max-w-2xl max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                <h3 className="text-xl font-semibold text-gray-900">
                  Editar tratamiento
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingConsultation(null);
                  }}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                >
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="p-4">
                <div className="grid justify-items-center p-4">
                  <form onSubmit={handleConsultationUpdate} className="flex flex-col w-full">
                    <div className="w-full block">
                      <div>
                        <label className="block mb-1">F. del tratamiento:</label>
            </div>
                  <input
                        type="date"
                        name="date"
                        defaultValue={editingConsultation.date ? editingConsultation.date.split('T')[0] : ''}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                    <div className="w-full mt-2">
                      <label className="block mb-1">Procedimiento:</label>
                  <textarea
                        name="procedure"
                        defaultValue={editingConsultation.procedure || ''}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                  />
                </div>
                    <div className="w-full mt-2">
                      <label className="block mb-1">Medicamentos:</label>
                  <textarea
                        name="meds"
                        defaultValue={editingConsultation.meds || ''}
                    className="w-full rounded p-2 text-gray-900 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                  />
                </div>
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-800 shadow-sm text-white font-bold py-2 px-4 rounded block mr-2 cursor-pointer"
                      >
                        Actualizar Tratamiento
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingConsultation(null);
                        }}
                        className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded border"
                      >
                        Cancelar
                      </button>
              </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
