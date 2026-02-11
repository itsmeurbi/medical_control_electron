import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Patient, Consultation } from '../../lib/types';
import PatientForm from '../../components/patients/PatientForm';
import { apiUrl } from '../../src/utils/api';

export default function EditPatient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTreatments = async (page: number = 1) => {
    if (!id) return;

    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) return;

    try {
      const response = await fetch(apiUrl(`/api/consultations?patient_id=${patientId}&page=${page}`));
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
      fetch(apiUrl(`/api/patients/${id}`))
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
      const response = await fetch(apiUrl(`/api/consultations/${consultationId}`), {
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
    if (!id) {
      setErrors({ submit: 'ID de paciente no válido' });
      return;
    }

    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) {
      setErrors({ submit: 'ID de paciente no válido' });
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/consultations'), {
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

      const response = await fetch(apiUrl(`/api/consultations/${editingConsultation.id}`), {
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

  const handlePatientDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setErrors({});
    try {
      const response = await fetch(apiUrl(`/api/patients/${id}`), { method: 'DELETE' });
      if (response.ok) {
        setShowDeleteConfirm(false);
        navigate('/');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Error eliminando al paciente' });
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      setErrors({ submit: 'Error eliminando al paciente' });
    } finally {
      setDeleting(false);
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

    if (!id) {
      setErrors({ submit: 'ID de paciente no válido' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/patients/${id}`), {
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
        navigate('/');
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
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Editar Paciente</h1>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="cursor-pointer text-sm text-slate-400 transition hover:text-red-600 focus-visible:outline-none"
          >
            Eliminar paciente
          </button>
        </div>

        {errors.submit && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          onCancel={() => navigate('/')}
        />

        {/* Delete patient confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md">
              <div className="rounded-2xl bg-white shadow-xl">
                <div className="px-6 py-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Eliminar paciente
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    ¿Está seguro de que desea eliminar a este paciente y todos sus tratamientos? Esta acción no se puede deshacer.
                  </p>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handlePatientDelete}
                      disabled={deleting}
                      className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Consultation Modal */}
        {showEditModal && editingConsultation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl">
              <div className="rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Editar tratamiento
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingConsultation(null);
                    }}
                    className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span className="sr-only">Close modal</span>
                  </button>
                </div>
                <div className="px-6 py-5">
                  <form onSubmit={handleConsultationUpdate} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600">F. del tratamiento</label>
                      <input
                        type="date"
                        name="date"
                        defaultValue={editingConsultation.date ? editingConsultation.date.split('T')[0] : ''}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Procedimiento</label>
                      <textarea
                        name="procedure"
                        defaultValue={editingConsultation.procedure || ''}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Medicamentos</label>
                      <textarea
                        name="meds"
                        defaultValue={editingConsultation.meds || ''}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                      >
                        Actualizar Tratamiento
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingConsultation(null);
                        }}
                        className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
