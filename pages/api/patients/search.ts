import type { NextApiRequest, NextApiResponse } from 'next';
import { patientQueries } from '@/lib/database';
import { calculateAge, generateMedicalRecord } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { text } = req.query;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Search text is required' });
      }

      const patients = await patientQueries.search(text);
      const patientsWithAge = patients.map(patient => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id)
      }));

      res.status(200).json(patientsWithAge);
    } catch (error) {
      console.error('Error searching patients:', error);
      res.status(500).json({ error: 'Error searching patients' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
