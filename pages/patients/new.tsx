'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Patient } from '@/lib/types';
import PatientForm from './_form';

export default function NewPatient() {
  const router = useRouter();
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
      const response = await fetch('/api/patients', {
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
        router.push('/');
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
    <div className="shadow rounded p-4 m-4 bg-blue-50">
      <h1 className="text-3xl font-bold mb-4 text-black flex text-blue-800 justify-center">
        Nuevo Paciente
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
        submitLabel="Agregar paciente"
        isEdit={false}
        treatment={treatment}
        setTreatment={setTreatment}
        onCancel={() => router.push('/')}
      />
    </div>
  );
}
