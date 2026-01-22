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
  const [treatment, setTreatment] = useState({
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    meds: '',
  });

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
          // Store treatments separately
          if (data.treatments) {
            setTreatments(data.treatments);
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
      />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded border"
        >
          Regresar
        </button>
      </div>
    </div>
  );
}
