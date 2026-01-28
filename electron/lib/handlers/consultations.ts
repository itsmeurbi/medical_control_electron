import { ipcMain } from 'electron';
import type { DatabaseModule, ConsultationListResponse, ConsultationCreateData, ConsultationUpdateData } from './types';
import type { Consultation } from '../../../lib/types';
import { logCRUD, logError } from '../logger';

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
      logCRUD('READ', 'Consultation', undefined, { patientId, operation: 'list', page });

      const pageNum = parseInt(page || '1', 10);
      const itemsPerPage = 1;
      const skip = (pageNum - 1) * itemsPerPage;

      const [consultations, totalCount] = await Promise.all([
        consultationQueries.findByPatientIdPaginated(patientId, skip, itemsPerPage),
        consultationQueries.countByPatientId(patientId),
      ]);

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      const result = {
        consultations,
        pagination: {
          page: pageNum,
          itemsPerPage,
          totalCount,
          totalPages,
        },
      };
      logCRUD('READ', 'Consultation', undefined, { patientId, success: true, count: consultations.length });
      return result;
    } catch (error) {
      logError('Error fetching consultations', error, 'api:consultations:list');
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

      logCRUD('CREATE', 'Consultation', undefined, { patientId });

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

      const result = await consultationQueries.create(data);
      logCRUD('CREATE', 'Consultation', result.id, { patientId: result.patientId, success: true });
      return result;
    } catch (error) {
      logError('Error creating consultation', error, 'api:consultations:create');
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
      logCRUD('READ', 'Consultation', consultationId);
      const consultation = await consultationQueries.findById(consultationId);
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      return consultation;
    } catch (error) {
      logError('Error fetching consultation', error, 'api:consultations:get');
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

      logCRUD('UPDATE', 'Consultation', consultationId);
      const existingConsultation = await consultationQueries.findById(consultationId);
      if (!existingConsultation) {
        throw new Error('Consultation not found');
      }

      const data = {
        date: consultationData.date ? new Date(consultationData.date).toISOString() : existingConsultation.date,
        procedure: consultationData.procedure !== undefined ? consultationData.procedure : existingConsultation.procedure,
        meds: consultationData.meds !== undefined ? consultationData.meds : existingConsultation.meds,
      };

      const result = await consultationQueries.update(consultationId, data);
      logCRUD('UPDATE', 'Consultation', consultationId, { success: true });
      return result;
    } catch (error) {
      logError('Error updating consultation', error, 'api:consultations:update');
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
      logCRUD('DELETE', 'Consultation', consultationId);
      await consultationQueries.delete(consultationId);
      logCRUD('DELETE', 'Consultation', consultationId, { success: true });
      return { success: true };
    } catch (error) {
      logError('Error deleting consultation', error, 'api:consultations:delete');
      console.error('Error deleting consultation:', error);
      throw error;
    }
  });
}
