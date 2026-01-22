import type { NextApiRequest, NextApiResponse } from 'next';
import { consultationQueries, patientQueries } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { patient_id } = req.query;

  if (req.method === 'GET') {
    try {
      if (!patient_id) {
        return res.status(400).json({ error: 'patient_id is required' });
      }
      
      const patientId = parseInt(patient_id as string, 10);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient_id' });
      }

      const consultations = await consultationQueries.findByPatientId(patientId);
      res.status(200).json(consultations);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      res.status(500).json({ error: 'Error fetching consultations' });
    }
  } else if (req.method === 'POST') {
    try {
      const consultationData = req.body;
      
      // Validate required fields
      if (!consultationData.patient_id || !consultationData.date) {
        return res.status(400).json({ error: 'patient_id and date are required' });
      }

      // Validate that either procedure or meds is present
      if (!consultationData.procedure && !consultationData.meds) {
        return res.status(400).json({ error: 'Either procedure or meds must be provided' });
      }

      // Verify patient exists
      const patient = await patientQueries.findById(consultationData.patient_id);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const data = {
        ...consultationData,
        date: new Date(consultationData.date).toISOString(),
      };

      const consultation = await consultationQueries.create(data);
      res.status(201).json(consultation);
    } catch (error) {
      console.error('Error creating consultation:', error);
      res.status(500).json({ error: 'Error creating consultation' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
