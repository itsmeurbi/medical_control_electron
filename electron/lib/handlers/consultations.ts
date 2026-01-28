import { ipcMain } from 'electron';
import type { DatabaseModule, ConsultationListResponse, ConsultationCreateData, ConsultationUpdateData } from './types';
import type { Consultation } from '../../../lib/types';

export function setupConsultationHandlers(dbModule: DatabaseModule): void {
  const { patientQueries, consultationQueries } = dbModule;

  // GET /api/consultations
  ipcMain.handle('api:consultations:list', async (_event, { patient_id, page }: { patient_id: string, page?: string }): Promise<ConsultationListResponse> => {
    try {
      if (!patient_id) {
        throw new Error('patient_id is required');
      }

      const patientId = parseInt(patient_id, 10);
      if (isNaN(patientId)) {
        throw new Error('Invalid patient_id');
      }

      const pageNum = parseInt(page || '1', 10);
      const itemsPerPage = 1;
      const skip = (pageNum - 1) * itemsPerPage;

      const [consultations, totalCount] = await Promise.all([
        consultationQueries.findByPatientIdPaginated(patientId, skip, itemsPerPage),
        consultationQueries.countByPatientId(patientId),
      ]);

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      return {
        consultations,
        pagination: {
          page: pageNum,
          itemsPerPage,
          totalCount,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  });

  // POST /api/consultations
  ipcMain.handle('api:consultations:create', async (_event, consultationData: ConsultationCreateData): Promise<Consultation> => {
    try {
      if (!consultationData.patient_id || !consultationData.date) {
        throw new Error('patient_id and date are required');
      }

      if (!consultationData.procedure && !consultationData.meds) {
        throw new Error('Either procedure or meds must be provided');
      }

      const patientIdStr = typeof consultationData.patient_id === 'number' 
        ? consultationData.patient_id.toString() 
        : consultationData.patient_id;
      const patientId = parseInt(patientIdStr, 10);
      if (isNaN(patientId)) {
        throw new Error('Invalid patient_id');
      }

      const patient = await patientQueries.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      const data = {
        patientId: patientId,
        date: new Date(consultationData.date).toISOString(),
        procedure: consultationData.procedure || null,
        meds: consultationData.meds || null,
      };

      return await consultationQueries.create(data);
    } catch (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }
  });

  // GET /api/consultations/:id
  ipcMain.handle('api:consultations:get', async (_event, id: string): Promise<Consultation> => {
    try {
      const consultationId = parseInt(id, 10);
      if (isNaN(consultationId)) {
        throw new Error('Invalid consultation ID');
      }
      const consultation = await consultationQueries.findById(consultationId);
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      return consultation;
    } catch (error) {
      console.error('Error fetching consultation:', error);
      throw error;
    }
  });

  // PUT /api/consultations/:id
  ipcMain.handle('api:consultations:update', async (_event, id: string, consultationData: ConsultationUpdateData): Promise<Consultation> => {
    try {
      const consultationId = parseInt(id, 10);
      if (isNaN(consultationId)) {
        throw new Error('Invalid consultation ID');
      }

      const existingConsultation = await consultationQueries.findById(consultationId);
      if (!existingConsultation) {
        throw new Error('Consultation not found');
      }

      const data = {
        date: consultationData.date ? new Date(consultationData.date).toISOString() : existingConsultation.date,
        procedure: consultationData.procedure !== undefined ? consultationData.procedure : existingConsultation.procedure,
        meds: consultationData.meds !== undefined ? consultationData.meds : existingConsultation.meds,
      };

      return await consultationQueries.update(consultationId, data);
    } catch (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }
  });

  // DELETE /api/consultations/:id
  ipcMain.handle('api:consultations:delete', async (_event, id: string): Promise<{ success: boolean }> => {
    try {
      const consultationId = parseInt(id, 10);
      if (isNaN(consultationId)) {
        throw new Error('Invalid consultation ID');
      }
      await consultationQueries.delete(consultationId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting consultation:', error);
      throw error;
    }
  });
}
