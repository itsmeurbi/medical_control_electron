import type { NextApiRequest, NextApiResponse } from 'next';
import { patientQueries } from '@/lib/database';
import { calculateAge, generateMedicalRecord } from '@/lib/utils';

// Clean data for Prisma - remove undefined and convert empty strings to null
function cleanData(data: any): any {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value === '' && key !== 'name' && key !== 'registeredAt' && key !== 'gender') {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const patients = await patientQueries.all();
      const patientsWithAge = patients.map(patient => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null)
      }));
      res.status(200).json(patientsWithAge);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Error fetching patients' });
    }
  } else if (req.method === 'POST') {
    try {
      const patientData = req.body;

      // Validate required fields
      if (!patientData.name || !patientData.registeredAt || patientData.gender === undefined) {
        return res.status(400).json({ error: 'Name, registeredAt, and gender are required' });
      }

      // Clean and prepare data
      const cleaned = cleanData(patientData);

      // Handle date conversions
      const data: any = {
        ...cleaned,
        registeredAt: cleaned.registeredAt
          ? new Date(cleaned.registeredAt).toISOString()
          : new Date().toISOString(),
        birthDate: cleaned.birthDate
          ? new Date(cleaned.birthDate).toISOString()
          : null,
      };

      const patient = await patientQueries.create(data);
      const patientWithAge = {
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id)
      };

      res.status(201).json(patientWithAge);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Error creating patient' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
