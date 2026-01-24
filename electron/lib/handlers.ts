import { ipcMain } from 'electron';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Helper to clean data
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

// IPC Handlers
export async function setupIpcHandlers(dbModule: any) {
  const { patientQueries, consultationQueries, default: prisma } = dbModule;

  // Get utils functions - vite-plugin-electron bundles them
  const utils = await import('./utils');
  const { calculateAge, generateMedicalRecord } = utils;

  // Advanced search helper
  async function advancedSearch(attributeName: string, attributeValue: string, matchType: string) {
    if (!attributeName || !attributeValue) {
      return [];
    }

    const searchValue = attributeValue.toLowerCase();
    const whereClause: any = {};

    if (['gender', 'maritalStatus', 'evera', 'bloodType', 'rhFactor'].includes(attributeName)) {
      const enumMap: any = {
        gender: { masculino: 0, femenino: 1 },
        maritalStatus: { casado: 0, divorciado: 1, soltero: 2, unionlibre: 3, viudo: 4 },
        evera: { leve: 0, moderado: 1, fuerte: 2, muyfuerte: 3, insoportable: 4 },
        bloodType: { a: 0, b: 1, ab: 2, o: 3 },
        rhFactor: { negativo: 0, positivo: 1 },
      };

      const enumValues = enumMap[attributeName];
      if (enumValues) {
        const matchingValues = Object.entries(enumValues)
          .filter(([key]) => {
            switch (matchType) {
              case 'starts_with': return key.startsWith(searchValue);
              case 'ends_with': return key.endsWith(searchValue);
              case 'contains': return key.includes(searchValue);
              default: return key === searchValue;
            }
          })
          .map(([, value]) => value);

        if (matchingValues.length > 0) {
          whereClause[attributeName] = { in: matchingValues };
        } else {
          return [];
        }
      }
    } else {
      const field = attributeName;
      switch (matchType) {
        case 'starts_with':
          whereClause[field] = { startsWith: attributeValue };
          break;
        case 'ends_with':
          whereClause[field] = { endsWith: attributeValue };
          break;
        case 'contains':
          whereClause[field] = { contains: attributeValue };
          break;
        default:
          whereClause[field] = attributeValue;
      }
    }

    return await prisma.patient.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  // GET /api/patients
  ipcMain.handle('api:patients:list', async () => {
    try {
      const patients = await patientQueries.all();
      return patients.map((patient: any) => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null)
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  });

  // GET /api/patients/search
  ipcMain.handle('api:patients:search', async (_event, text: string) => {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Search text is required');
      }
      const patients = await patientQueries.search(text);
      return patients.map((patient: any) => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id)
      }));
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  });

  // GET /api/patients/:id
  ipcMain.handle('api:patients:get', async (_event, id: string) => {
    try {
      const patientId = parseInt(id, 10);
      if (isNaN(patientId)) {
        throw new Error('Invalid patient ID');
      }
      const patient = await patientQueries.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }
      return {
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id),
        treatments: patient.treatments
      };
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  });

  // POST /api/patients
  ipcMain.handle('api:patients:create', async (_event, patientData: any) => {
    try {
      if (!patientData.name || !patientData.registeredAt || patientData.gender === undefined) {
        throw new Error('Name, registeredAt, and gender are required');
      }

      const treatment = patientData.treatment;
      const { treatment: _, ...patientDataWithoutTreatment } = patientData;

      const cleaned = cleanData(patientDataWithoutTreatment);

      const data = {
        ...cleaned,
        registeredAt: cleaned.registeredAt
          ? new Date(cleaned.registeredAt).toISOString()
          : new Date().toISOString(),
        birthDate: cleaned.birthDate
          ? new Date(cleaned.birthDate).toISOString()
          : null,
      };

      const patient = await patientQueries.create(data);
      if (!patient) {
        throw new Error('Failed to create patient');
      }

      if (treatment && (treatment.procedure || treatment.meds)) {
        try {
          await consultationQueries.create({
            patientId: patient.id,
            date: treatment.date || new Date().toISOString(),
            procedure: treatment.procedure || null,
            meds: treatment.meds || null,
          });
        } catch (error) {
          console.error('Error creating initial treatment:', error);
        }
      }

      return {
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id)
      };
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  });

  // PUT /api/patients/:id
  ipcMain.handle('api:patients:update', async (_event, id: string, patientData: any) => {
    try {
      const patientId = parseInt(id, 10);
      if (isNaN(patientId)) {
        throw new Error('Invalid patient ID');
      }

      const existingPatient = await patientQueries.findById(patientId);
      if (!existingPatient) {
        throw new Error('Patient not found');
      }

      const treatment = patientData.treatment;
      const {
        treatment: _treatment,
        treatments: _treatments,
        age: _age,
        medical_record: _medical_record,
        ...patientDataWithoutExtras
      } = patientData;

      const data: any = { ...patientDataWithoutExtras };
      if (data.registered_at) {
        data.registeredAt = new Date(data.registered_at).toISOString();
        delete data.registered_at;
      }
      if (data.birth_date) {
        data.birthDate = new Date(data.birth_date).toISOString();
        delete data.birth_date;
      }

      const updatedPatient = await patientQueries.update(patientId, data);

      if (treatment && typeof treatment === 'object' && 'procedure' in treatment && 'meds' in treatment) {
        const treatmentData = treatment;
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
          }
        }
      }

      return {
        ...updatedPatient,
        age: calculateAge(updatedPatient.birthDate),
        medical_record: updatedPatient.medicalRecord || generateMedicalRecord(updatedPatient.id)
      };
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  });

  // DELETE /api/patients/:id
  ipcMain.handle('api:patients:delete', async (_event, id: string) => {
    try {
      const patientId = parseInt(id, 10);
      if (isNaN(patientId)) {
        throw new Error('Invalid patient ID');
      }
      await patientQueries.delete(patientId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  });

  // GET /api/patients/export
  ipcMain.handle('api:patients:export', async () => {
    try {
      const { stringify } = require('csv-stringify/sync');
      const JSZip = require('jszip');

      const patients = await patientQueries.all();
      const allConsultations = await consultationQueries.all();

      const patientsCsv = stringify(patients, { header: true });
      const consultationsCsv = stringify(allConsultations, { header: true });

      const zip = new JSZip();
      const today = new Date().toISOString().split('T')[0];
      zip.file(`patients_${today}.csv`, patientsCsv);
      zip.file(`consults_${today}.csv`, consultationsCsv);

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      return zipBuffer;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  });

  // GET /api/consultations
  ipcMain.handle('api:consultations:list', async (_event, { patient_id, page }: { patient_id: string, page?: string }) => {
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
  ipcMain.handle('api:consultations:create', async (_event, consultationData: any) => {
    try {
      if (!consultationData.patient_id || !consultationData.date) {
        throw new Error('patient_id and date are required');
      }

      if (!consultationData.procedure && !consultationData.meds) {
        throw new Error('Either procedure or meds must be provided');
      }

      const patientId = parseInt(consultationData.patient_id, 10);
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
  ipcMain.handle('api:consultations:get', async (_event, id: string) => {
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
  ipcMain.handle('api:consultations:update', async (_event, id: string, consultationData: any) => {
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
  ipcMain.handle('api:consultations:delete', async (_event, id: string) => {
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

  // GET /api/advance-searches
  ipcMain.handle('api:advance-searches', async (_event, { attribute_name, attribute_value, match_type, page }: any) => {
    try {
      if (!attribute_name || !attribute_value) {
        throw new Error('attribute_name and attribute_value are required');
      }

      const pageNum = parseInt(page || '1', 10);
      const itemsPerPage = 5;
      const skip = (pageNum - 1) * itemsPerPage;

      const allPatients = await advancedSearch(attribute_name, attribute_value, match_type || 'exact');
      const total = allPatients.length;
      const patients = allPatients.slice(skip, skip + itemsPerPage);

      const patientsWithAge = patients.map((patient: any) => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id)
      }));

      const totalPages = Math.ceil(total / itemsPerPage);

      return {
        patients: patientsWithAge,
        total,
        page: pageNum,
        totalPages,
      };
    } catch (error) {
      console.error('Error in advance search:', error);
      throw error;
    }
  });
}
