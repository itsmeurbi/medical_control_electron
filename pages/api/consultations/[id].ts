import type { NextApiRequest, NextApiResponse } from 'next';
import { consultationQueries } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const consultationId = parseInt(id as string, 10);

  if (isNaN(consultationId)) {
    return res.status(400).json({ error: 'Invalid consultation ID' });
  }

  if (req.method === 'GET') {
    try {
      const consultation = await consultationQueries.findById(consultationId);
      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found' });
      }
      res.status(200).json(consultation);
    } catch (error) {
      console.error('Error fetching consultation:', error);
      res.status(500).json({ error: 'Error fetching consultation' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const consultation = await consultationQueries.findById(consultationId);
      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const data: Record<string, unknown> = { ...req.body };
      if (data.date && typeof data.date === 'string') {
        data.date = new Date(data.date).toISOString();
      }

      const updatedConsultation = await consultationQueries.update(consultationId, data);
      res.status(200).json(updatedConsultation);
    } catch (error) {
      console.error('Error updating consultation:', error);
      res.status(500).json({ error: 'Error updating consultation' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await consultationQueries.delete(consultationId);
      res.status(200).json({ message: 'Consultation deleted successfully' });
    } catch (error) {
      console.error('Error deleting consultation:', error);
      res.status(500).json({ error: 'Error deleting consultation' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
