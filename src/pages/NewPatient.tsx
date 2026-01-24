import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../lib/types';
import PatientForm from '../../components/patients/PatientForm';
import { apiUrl } from '../../src/utils/api';

export default function NewPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    registeredAt: new Date().toISOString().split('T')[0],
    gender: undefined,
    birthDate: '',
  });

  const [treatment, setTreatment] = useState({
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    meds: '',
  });

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
      const response = await fetch(apiUrl('/api/patients'), {
        method: 'POST',
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
        setErrors({ submit: error.error || 'Error creando al paciente' });
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setErrors({ submit: 'Error creando al paciente' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Nuevo Paciente</h1>
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
          submitLabel="Agregar paciente"
          isEdit={false}
          treatment={treatment}
          setTreatment={setTreatment}
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  );
}
