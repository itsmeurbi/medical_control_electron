import type { NextApiRequest, NextApiResponse } from 'next';
import { patientQueries } from '@/lib/database';
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

      const data: any = { ...req.body };
      if (data.registered_at) {
        data.registeredAt = new Date(data.registered_at).toISOString();
        delete data.registered_at;
      }
      if (data.birth_date) {
        data.birthDate = new Date(data.birth_date).toISOString();
        delete data.birth_date;
      }

      const updatedPatient = await patientQueries.update(patientId, data);
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
