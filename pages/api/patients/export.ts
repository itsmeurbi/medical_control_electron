import type { NextApiRequest, NextApiResponse } from 'next';
import { patientQueries, consultationQueries } from '@/lib/database';
import { stringify } from 'csv-stringify/sync';
import JSZip from 'jszip';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const patients = await patientQueries.all();
      const allConsultations = await consultationQueries.all();

      // Convert to CSV
      const patientsCsv = stringify(patients, { header: true });
      const consultationsCsv = stringify(allConsultations, { header: true });

      // Create ZIP
      const zip = new JSZip();
      const today = new Date().toISOString().split('T')[0];
      zip.file(`patients_${today}.csv`, patientsCsv);
      zip.file(`consults_${today}.csv`, consultationsCsv);

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="patients_and_consults_${today}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ error: 'Error exporting data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
