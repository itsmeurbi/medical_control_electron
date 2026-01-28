import { ipcMain, dialog, BrowserWindow } from 'electron';
import { createRequire } from 'node:module';
import fs from 'fs';
import path from 'path';
import type { DatabaseModule, PatientWithComputed, PatientCreateData, PatientUpdateData, ImportResponse, PatientCsvRow, ConsultationCsvRow } from './types';
import type { Patient } from '../../../lib/types';
import {
  cleanData,
  transformPatientForExport,
  transformConsultationForExport,
  transformPatientForImport,
  transformConsultationForImport,
  normalizeDateToISO,
} from './utils';

const require = createRequire(import.meta.url);

// Helper to omit keys from an object
function omit<T extends Record<string, unknown>, K extends string>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

// Helper to titleize names (capitalize first letter of each word)
function titleizeName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function setupPatientHandlers(
  dbModule: DatabaseModule,
  calculateAge: (birthDate: string | null | undefined) => number | null,
  generateMedicalRecord: (id: number) => string
): void {
  const { patientQueries, consultationQueries, default: prisma } = dbModule;

  // GET /api/patients
  ipcMain.handle('api:patients:list', async () => {
    try {
      const patients = await patientQueries.all();
      return patients.map((patient: Patient): PatientWithComputed => ({
        ...patient,
        age: calculateAge(patient.birthDate ?? null),
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
      return patients.map((patient: Patient): PatientWithComputed => ({
        ...patient,
        age: calculateAge(patient.birthDate ?? null),
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null)
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
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null),
        treatments: patient.treatments
      };
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  });

  // POST /api/patients
  ipcMain.handle('api:patients:create', async (_event, patientData: PatientCreateData): Promise<PatientWithComputed> => {
    try {
      if (!patientData.name || !patientData.registeredAt || patientData.gender === undefined) {
        throw new Error('Name, registeredAt, and gender are required');
      }

      const treatment = patientData.treatment;
      const patientDataWithoutTreatment = omit(patientData as unknown as Record<string, unknown>, ['treatment']);

      const cleaned = cleanData(patientDataWithoutTreatment);

      // Remove gender from cleaned data since it needs special handling
      const cleanedWithoutGender = omit(cleaned, ['gender']);
      const data: Partial<Patient> = {
        ...cleanedWithoutGender,
        registeredAt: (cleaned.registeredAt as string | undefined)
          ? new Date(cleaned.registeredAt as string).toISOString()
          : new Date().toISOString(),
        birthDate: (cleaned.birthDate as string | undefined)
          ? new Date(cleaned.birthDate as string).toISOString()
          : null,
        // Handle gender conversion - PatientCreateData allows string | number, but Patient needs Gender enum
        gender: patientData.gender as unknown as Patient['gender'],
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
        age: calculateAge(patient.birthDate ?? null),
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null)
      };
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  });

  // PUT /api/patients/:id
  ipcMain.handle('api:patients:update', async (_event, id: string, patientData: PatientUpdateData): Promise<PatientWithComputed> => {
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
      const patientDataWithoutExtras = omit(
        patientData as unknown as Record<string, unknown>,
        ['treatment', 'treatments', 'age', 'medical_record']
      );

      const dataRecord = patientDataWithoutExtras as unknown as Record<string, unknown>;
      const dataWithoutGender = omit(patientDataWithoutExtras, ['gender']);
      const data: Partial<Patient> = { ...dataWithoutGender };

      // Handle gender conversion if provided
      if (dataRecord.gender !== undefined) {
        data.gender = dataRecord.gender as unknown as Patient['gender'];
      }

      if (dataRecord.registered_at) {
        data.registeredAt = new Date(dataRecord.registered_at as string).toISOString();
        delete dataRecord.registered_at;
      }
      if (dataRecord.birth_date) {
        data.birthDate = new Date(dataRecord.birth_date as string).toISOString();
        delete dataRecord.birth_date;
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
        age: calculateAge(updatedPatient.birthDate ?? null),
        medical_record: updatedPatient.medicalRecord || (updatedPatient.id ? generateMedicalRecord(updatedPatient.id) : null)
      };
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  });

  // DELETE /api/patients/:id
  ipcMain.handle('api:patients:delete', async (_event, id: string): Promise<{ success: boolean }> => {
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
  ipcMain.handle('api:patients:export', async (): Promise<Buffer> => {
    try {
      const { stringify } = require('csv-stringify/sync');
      const JSZip = require('jszip');

      const patients = await patientQueries.all();
      const allConsultations = await consultationQueries.all();

      // Transform to snake_case matching reference format
      const transformedPatients = patients.map(transformPatientForExport);
      const transformedConsultations = allConsultations.map(transformConsultationForExport);

      const patientsCsv = stringify(transformedPatients, { header: true });
      const consultationsCsv = stringify(transformedConsultations, { header: true });

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

  // POST /api/patients/import
  ipcMain.handle('api:patients:import', async (): Promise<ImportResponse> => {
    try {
      const { parse } = require('csv-parse/sync');
      const mainWindow = BrowserWindow.getAllWindows()[0];

      if (!mainWindow) {
        throw new Error('No main window available');
      }

      // Open file dialog to select CSV files
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Importar datos',
        filters: [
          { name: 'Archivos CSV', extensions: ['csv'] },
          { name: 'Todos los archivos', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'Importacion cancelada' };
      }

      let patientsFile: string | null = null;
      let consultationsFile: string | null = null;

      // Find patients and consultations files
      for (const filePath of result.filePaths) {
        const fileName = path.basename(filePath).toLowerCase();
        if (fileName.startsWith('patients')) {
          patientsFile = filePath;
        } else if (fileName.startsWith('consults')) {
          consultationsFile = filePath;
        }
      }

      let importedPatients = 0;
      let importedConsultations = 0;
      const errors: string[] = [];
      // Map CSV patient IDs to database IDs (for consultations that reference CSV IDs)
      const csvIdToDbIdMap = new Map<number, number>();

      // Import patients
      if (patientsFile) {
        try {
          const fileContent = fs.readFileSync(patientsFile, 'utf-8');
          const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });

          for (const record of records) {
            try {
              // Convert empty strings to null in the raw record before transformation
              const cleanedRecord: Record<string, unknown> = {};
              for (const [key, value] of Object.entries(record)) {
                cleanedRecord[key] = value === '' ? null : value;
              }

              const patientData = transformPatientForImport(cleanedRecord as unknown as PatientCsvRow);

              // Get the original ID from CSV if present
              const csvId = patientData.id ? (typeof patientData.id === 'string' ? parseInt(patientData.id, 10) : patientData.id) : null;

              // Remove fields that shouldn't be in create/update
              const patientDataRecord = patientData as unknown as Record<string, unknown>;
              const dataToImport = omit(patientDataRecord, ['id', 'treatments', 'age', 'medical_record']);

              // Check if patient exists by ID FIRST (before validating required fields)
              let existingPatient = null;
              if (csvId && !isNaN(csvId)) {
                existingPatient = await patientQueries.findById(csvId);
              }

              // Get CSV values
              const dataToImportRecord = dataToImport as Record<string, unknown>;
              let nameValue = dataToImportRecord.name;
              const registeredAtValue = dataToImportRecord.registeredAt;
              const genderValue = dataToImportRecord.gender;

              // If patient exists and CSV name is empty, use existing patient's name
              if (existingPatient && (!nameValue || (typeof nameValue === 'string' && nameValue.trim() === ''))) {
                nameValue = existingPatient.name;
                dataToImportRecord.name = existingPatient.name;
              }

              let nameStr = typeof nameValue === 'string' ? nameValue.trim() : String(nameValue || '');

              // Normalize name to title case
              if (nameStr.length > 0) {
                nameStr = titleizeName(nameStr);
                dataToImportRecord.name = nameStr;
              }
              let registeredAtStr = typeof registeredAtValue === 'string' ? registeredAtValue.trim() : String(registeredAtValue || '');

              // Default missing values
              if (registeredAtStr.length === 0) {
                registeredAtStr = new Date().toISOString();
                dataToImportRecord.registeredAt = registeredAtStr;
              }

              if (genderValue === undefined || genderValue === null || genderValue === '') {
                dataToImportRecord.gender = 'masculino';
              }

              // Only require name for NEW patients (existing patients already have name from database)
              if (!existingPatient && nameStr.length === 0) {
                errors.push(`Skipping patient "${csvId ? `ID ${csvId}` : 'unknown'}": missing required field (name) for new patient`);
                continue;
              }

              // Normalize all date fields to ISO format
              if (dataToImportRecord.registeredAt) {
                const normalized = normalizeDateToISO(dataToImportRecord.registeredAt);
                if (!normalized) {
                  errors.push(`Skipping patient "${nameStr || 'unknown'}": invalid registeredAt date format`);
                  continue;
                }
                dataToImportRecord.registeredAt = normalized;
              }

              if (dataToImportRecord.birthDate) {
                const normalized = normalizeDateToISO(dataToImportRecord.birthDate);
                dataToImportRecord.birthDate = normalized;
              }

              // Convert boolean strings to actual booleans
              const booleanFields = ['rx', 'cat', 'mri', 'us', 'do', 'emg'];
              for (const field of booleanFields) {
                if (dataToImportRecord[field] !== undefined && dataToImportRecord[field] !== null) {
                  if (typeof dataToImportRecord[field] === 'string') {
                    dataToImportRecord[field] = dataToImportRecord[field].toString().toLowerCase() === 'true' || dataToImportRecord[field] === '1';
                  }
                }
              }

              // Convert numeric fields
              const numericFields = ['maritalStatus', 'evaluation', 'evera', 'bloodType', 'rhFactor', 'weight', 'height', 'heartRate', 'breathRate'];
              for (const field of numericFields) {
                if (dataToImportRecord[field] !== undefined && dataToImportRecord[field] !== null && dataToImportRecord[field] !== '') {
                  const num = typeof dataToImportRecord[field] === 'string' ? parseFloat(dataToImportRecord[field] as string) : dataToImportRecord[field];
                  dataToImportRecord[field] = (typeof num === 'number' && isNaN(num)) ? null : num;
                } else {
                  dataToImportRecord[field] = null;
                }
              }

              // Clean the data using the same function as create
              const cleaned = cleanData(dataToImportRecord as Record<string, unknown>);

              // If not found by ID, check by name
              if (!existingPatient && nameStr) {
                const patientsByName = await prisma.patient.findMany({
                  where: { name: nameStr },
                  take: 1,
                });
                if (patientsByName.length > 0) {
                  existingPatient = patientsByName[0];
                  // If CSV has ID, verify it matches
                  if (csvId && existingPatient.id !== csvId) {
                    existingPatient = null; // Name matches but ID doesn't, treat as new
                  }
                }
              }

              if (existingPatient && existingPatient.id) {
                // Update existing patient
                await patientQueries.update(existingPatient.id, cleaned);
                if (csvId && !isNaN(csvId)) {
                  csvIdToDbIdMap.set(csvId, existingPatient.id);
                }
                importedPatients++;
              } else {
                // Create new patient
                const newPatient = await patientQueries.create(cleaned);
                if (csvId && !isNaN(csvId) && newPatient.id) {
                  csvIdToDbIdMap.set(csvId, newPatient.id);
                }
                importedPatients++;
              }
            } catch (error: unknown) {
              const errorObj = error as Error;
              const recordData = record as Record<string, unknown>;
              const patientName = (recordData.name as string | undefined) || (recordData.id as string | number | undefined)?.toString() || 'unknown';
              const errorMsg = errorObj.message || String(error);
              // Extract the field name from Prisma errors if possible
              const fieldMatch = errorMsg.match(/Argument `(\w+)`/);
              const fieldInfo = fieldMatch ? ` (field: ${fieldMatch[1]})` : '';
              errors.push(`Error importing patient "${patientName}"${fieldInfo}: ${errorMsg.substring(0, 200)}`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as Error;
          errors.push(`Error reading patients file: ${errorObj.message}`);
        }
      }

      // Import consultations
      if (consultationsFile) {
        try {
          const fileContent = fs.readFileSync(consultationsFile, 'utf-8');
          const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });

          for (const record of records) {
            try {
              // Convert empty strings to null in the raw record before transformation
              const cleanedRecord: Record<string, unknown> = {};
              for (const [key, value] of Object.entries(record)) {
                cleanedRecord[key] = value === '' ? null : value;
              }

              const consultationData = transformConsultationForImport(cleanedRecord as unknown as ConsultationCsvRow);

              // Remove fields that shouldn't be in create
              const dataToImport = omit(consultationData, ['id', 'createdAt', 'updatedAt']);

              // Ensure required fields - check for null, undefined, or empty string
              const patientIdValue = dataToImport.patientId;
              const dateValue = dataToImport.date;

              const patientIdStr = patientIdValue ? String(patientIdValue).trim() : '';
              const dateStr = dateValue ? String(dateValue).trim() : '';

              if (!patientIdStr || !dateStr) {
                errors.push(`Skipping consultation: missing required fields (patient_id: "${patientIdValue}", date: "${dateValue}")`);
                continue;
              }

              // Convert patientId to number (CSV reads it as string, handle spaces/trimming)
              const csvPatientId = parseInt(patientIdStr, 10);

              if (isNaN(csvPatientId) || csvPatientId <= 0) {
                errors.push(`Skipping consultation: invalid patient_id "${patientIdValue}" (parsed as "${patientIdStr}")`);
                continue;
              }

              // Check CSV ID to DB ID map first (for newly imported patients)
              let dbPatientId = csvIdToDbIdMap.get(csvPatientId);
              let patient = null;

              if (dbPatientId) {
                // Use mapped database ID
                patient = await patientQueries.findById(dbPatientId);
              } else {
                // Try CSV ID directly (for existing patients that weren't updated)
                patient = await patientQueries.findById(csvPatientId);
                if (patient) {
                  dbPatientId = csvPatientId;
                }
              }

              if (!patient) {
                errors.push(`Skipping consultation: patient ID ${csvPatientId} not found`);
                continue;
              }

              // Update patientId to the database ID
              dataToImport.patientId = dbPatientId;

              // Normalize date to ISO format
              if (dataToImport.date) {
                const normalized = normalizeDateToISO(dataToImport.date);
                if (!normalized) {
                  errors.push(`Skipping consultation: invalid date format for patient ID ${dataToImport.patientId}`);
                  continue;
                }
                dataToImport.date = normalized;
              }

              // Clean the data (consultationQueries.create uses cleanData internally, but let's be explicit)
              const cleaned = cleanData(dataToImport);

              await consultationQueries.create(cleaned);
              importedConsultations++;
            } catch (error: unknown) {
              const errorObj = error as Error;
              const errorMsg = errorObj.message || String(error);
              const fieldMatch = errorMsg.match(/Argument `(\w+)`/);
              const fieldInfo = fieldMatch ? ` (field: ${fieldMatch[1]})` : '';
              errors.push(`Error importing consultation${fieldInfo}: ${errorMsg.substring(0, 200)}`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as Error;
          errors.push(`Error reading consultations file: ${errorObj.message}`);
        }
      }

      return {
        success: true,
        importedPatients,
        importedConsultations,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: unknown) {
      console.error('Error importing data:', error);
      throw error;
    }
  });

  // GET /api/patients/recent
  ipcMain.handle('api:patients:recent', async (_event, limit: number = 10) => {
    try {
      const patients = await patientQueries.recent(limit);
      return patients.map((patient: Patient): PatientWithComputed => ({
        ...patient,
        age: calculateAge(patient.birthDate ?? null),
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null)
      }));
    } catch (error) {
      console.error('Error fetching recent patients:', error);
      throw error;
    }
  });
}
