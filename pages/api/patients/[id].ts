import type { NextApiRequest, NextApiResponse } from 'next';
import { patientQueries, consultationQueries } from '@/lib/database';
import { calculateAge, generateMedicalRecord } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const patientId = parseInt(id as string, 10);

  if (isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }

  if (req.method === 'GET') {
    try {
      const patient = await patientQueries.findById(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const patientWithAge = {
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id),
        treatments: patient.treatments
      };

      res.status(200).json(patientWithAge);
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Error fetching patient' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const patient = await patientQueries.findById(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Extract treatment data and exclude relation/computed fields before cleaning
      const treatment = (req.body as Record<string, unknown>).treatment;
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        treatment: _treatment,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        treatments: _treatments,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        age: _age,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        medical_record: _medical_record,
        ...patientDataWithoutExtras
      } = req.body as Record<string, unknown>;

      const data: Record<string, unknown> = { ...patientDataWithoutExtras };
      if (data.registered_at) {
        data.registeredAt = new Date(data.registered_at as string).toISOString();
        delete data.registered_at;
      }
      if (data.birth_date) {
        data.birthDate = new Date(data.birth_date as string).toISOString();
        delete data.birth_date;
      }

      const updatedPatient = await patientQueries.update(patientId, data);

      // Create new treatment if provided
      if (treatment && typeof treatment === 'object' && 'procedure' in treatment && 'meds' in treatment) {
        const treatmentData = treatment as { date?: string; procedure?: string; meds?: string };
        if (treatmentData.procedure || treatmentData.meds) {
          try {
            await consultationQueries.create({
              patientId: updatedPatient.id,
              date: treatmentData.date || new Date().toISOString(),
              procedure: treatmentData.procedure || null,
              meds: treatmentData.meds || null,
            });
          } catch (error) {
            console.error('Error creating treatment:', error);
            // Continue even if treatment creation fails
          }
        }
      }

      const patientWithAge = {
        ...updatedPatient,
        age: calculateAge(updatedPatient.birthDate),
        medical_record: updatedPatient.medicalRecord || generateMedicalRecord(updatedPatient.id)
      };

      res.status(200).json(patientWithAge);
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Error updating patient' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await patientQueries.delete(patientId);
      res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: 'Error deleting patient' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
