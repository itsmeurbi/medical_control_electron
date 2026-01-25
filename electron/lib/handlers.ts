import { ipcMain, dialog, BrowserWindow } from 'electron';
import { createRequire } from 'node:module';
import fs from 'fs';
import path from 'path';

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

// Transform patient data to snake_case for backward compatibility
function transformPatientForExport(patient: any): any {
  // Map camelCase to snake_case matching the reference CSV column order
  const mapping: Record<string, string> = {
    id: 'id',
    name: 'name',
    birthDate: 'birth_date',
    city: 'city',
    address: 'address',
    phoneNumber: 'phone_number',
    medicalRecord: 'medical_record',
    registeredAt: 'registered_at',
    gender: 'gender',
    maritalStatus: 'marital_status',
    reference: 'reference',
    occupations: 'occupations',
    primaryDx: 'primary_dx',
    initialDx: 'initial_dx',
    finalDx: 'final_dx',
    medicalBackground: 'medical_background',
    surgicalBackground: 'surgical_background',
    interventionismTx: 'interventionism_tx',
    painType: 'pain_type',
    painLocalization: 'pain_localization',
    painEvolution: 'pain_evolution',
    painDuration: 'pain_duration',
    painInitialState: 'pain_initial_state',
    painCurrentState: 'pain_current_state',
    alergies: 'alergies',
    irradiations: 'irradiations',
    evaluation: 'evaluation',
    evera: 'evera',
    previousTx: 'previous_tx',
    bloodType: 'blood_type',
    rhFactor: 'rh_factor',
    weight: 'weight',
    height: 'height',
    bloodPressure: 'blood_pressure',
    heartRate: 'heart_rate',
    breathRate: 'breath_rate',
    generalInspection: 'general_inspection',
    head: 'head',
    abdomen: 'abdomen',
    neck: 'neck',
    extremities: 'extremities',
    spine: 'spine',
    chest: 'chest',
    laboratory: 'laboratory',
    cabinet: 'cabinet',
    consultations: 'consultations',
    requestedStudies: 'requested_studies',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    anticoagulants: 'anticoagulants',
    cellphoneNumber: 'cellphone_number',
    chronics: 'chronics',
    fiscalSituation: 'fiscal_situation',
    email: 'email',
    zipCode: 'zip_code',
    rx: 'rx',
    cat: 'cat',
    mri: 'mri',
    us: 'us',
    do: 'do',
    emg: 'emg',
    spo2: 'spo2',
    increasesWith: 'increases_with',
    decreasesWith: 'decreases_with',
    cellphoneNumberTwo: 'cellphone_number_two',
    cellphoneNumberThree: 'cellphone_number_three',
  };

  const transformed: any = {};
  // Use the exact column order from reference CSV
  const columnOrder = [
    'id', 'name', 'birth_date', 'city', 'address', 'phone_number', 'medical_record',
    'registered_at', 'gender', 'marital_status', 'reference', 'occupations', 'primary_dx',
    'initial_dx', 'final_dx', 'medical_background', 'surgical_background', 'interventionism_tx',
    'pain_type', 'pain_localization', 'pain_evolution', 'pain_duration', 'pain_initial_state',
    'pain_current_state', 'alergies', 'irradiations', 'evaluation', 'evera', 'previous_tx',
    'blood_type', 'rh_factor', 'weight', 'height', 'blood_pressure', 'heart_rate', 'breath_rate',
    'general_inspection', 'head', 'abdomen', 'neck', 'extremities', 'spine', 'chest',
    'laboratory', 'cabinet', 'consultations', 'requested_studies', 'created_at', 'updated_at',
    'anticoagulants', 'cellphone_number', 'chronics', 'fiscal_situation', 'email', 'zip_code',
    'rx', 'cat', 'mri', 'us', 'do', 'emg', 'spo2', 'increases_with', 'decreases_with',
    'cellphone_number_two', 'cellphone_number_three'
  ];

  for (const snakeKey of columnOrder) {
    const camelKey = Object.keys(mapping).find(k => mapping[k] === snakeKey);
    if (camelKey && patient.hasOwnProperty(camelKey)) {
      transformed[snakeKey] = patient[camelKey];
    } else {
      transformed[snakeKey] = null;
    }
  }

  return transformed;
}

// Transform consultation data to snake_case matching reference CSV format
function transformConsultationForExport(consultation: any): any {
  return {
    id: consultation.id,
    patient_id: consultation.patientId,
    procedure: consultation.procedure,
    meds: consultation.meds,
    date: consultation.date,
    created_at: consultation.createdAt,
    updated_at: consultation.updatedAt,
  };
}

// Convert snake_case back to camelCase for import
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Transform patient data from snake_case to camelCase for import
function transformPatientForImport(patient: any): any {
  const mapping: Record<string, string> = {
    id: 'id',
    name: 'name',
    birth_date: 'birthDate',
    city: 'city',
    address: 'address',
    phone_number: 'phoneNumber',
    medical_record: 'medicalRecord',
    registered_at: 'registeredAt',
    gender: 'gender',
    marital_status: 'maritalStatus',
    reference: 'reference',
    occupations: 'occupations',
    primary_dx: 'primaryDx',
    initial_dx: 'initialDx',
    final_dx: 'finalDx',
    medical_background: 'medicalBackground',
    surgical_background: 'surgicalBackground',
    interventionism_tx: 'interventionismTx',
    pain_type: 'painType',
    pain_localization: 'painLocalization',
    pain_evolution: 'painEvolution',
    pain_duration: 'painDuration',
    pain_initial_state: 'painInitialState',
    pain_current_state: 'painCurrentState',
    alergies: 'alergies',
    irradiations: 'irradiations',
    evaluation: 'evaluation',
    evera: 'evera',
    previous_tx: 'previousTx',
    blood_type: 'bloodType',
    rh_factor: 'rhFactor',
    weight: 'weight',
    height: 'height',
    blood_pressure: 'bloodPressure',
    heart_rate: 'heartRate',
    breath_rate: 'breathRate',
    general_inspection: 'generalInspection',
    head: 'head',
    abdomen: 'abdomen',
    neck: 'neck',
    extremities: 'extremities',
    spine: 'spine',
    chest: 'chest',
    laboratory: 'laboratory',
    cabinet: 'cabinet',
    consultations: 'consultations',
    requested_studies: 'requestedStudies',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    anticoagulants: 'anticoagulants',
    cellphone_number: 'cellphoneNumber',
    chronics: 'chronics',
    fiscal_situation: 'fiscalSituation',
    email: 'email',
    zip_code: 'zipCode',
    rx: 'rx',
    cat: 'cat',
    mri: 'mri',
    us: 'us',
    do: 'do',
    emg: 'emg',
    spo2: 'spo2',
    increases_with: 'increasesWith',
    decreases_with: 'decreasesWith',
    cellphone_number_two: 'cellphoneNumberTwo',
    cellphone_number_three: 'cellphoneNumberThree',
  };

  const transformed: any = {};
  for (const [snakeKey, value] of Object.entries(patient)) {
    const camelKey = mapping[snakeKey] || snakeToCamel(snakeKey);
    transformed[camelKey] = value === '' ? null : value;
  }
  return transformed;
}

// Transform consultation data from snake_case to camelCase for import
function transformConsultationForImport(consultation: any): any {
  return {
    id: consultation.id,
    patientId: consultation.patient_id,
    procedure: consultation.procedure === '' ? null : consultation.procedure,
    meds: consultation.meds === '' ? null : consultation.meds,
    date: consultation.date,
    createdAt: consultation.created_at,
    updatedAt: consultation.updated_at,
  };
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
  ipcMain.handle('api:patients:import', async (_event) => {
    try {
      const { parse } = require('csv-parse/sync');
      const mainWindow = BrowserWindow.getAllWindows()[0];

      if (!mainWindow) {
        throw new Error('No main window available');
      }

      // Open file dialog to select CSV files
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Data',
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'Import cancelled' };
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
              const patientData = transformPatientForImport(record);
              
              // Get the original ID from CSV if present
              const csvId = patientData.id ? (typeof patientData.id === 'string' ? parseInt(patientData.id, 10) : patientData.id) : null;
              
              // Remove fields that shouldn't be in create/update
              const {
                id: _id,
                treatments: _treatments,
                age: _age,
                medical_record: _medical_record,
                ...dataToImport
              } = patientData;
              
              // Ensure required fields
              if (!dataToImport.name || !dataToImport.registeredAt || dataToImport.gender === undefined || dataToImport.gender === null || dataToImport.gender === '') {
                errors.push(`Skipping patient "${dataToImport.name || 'unknown'}": missing required fields (name, registeredAt, or gender)`);
                continue;
              }

              // Convert date strings to ISO format if needed
              if (dataToImport.registeredAt && typeof dataToImport.registeredAt === 'string' && !dataToImport.registeredAt.includes('T')) {
                try {
                  dataToImport.registeredAt = new Date(dataToImport.registeredAt).toISOString();
                } catch (e) {
                  errors.push(`Skipping patient "${dataToImport.name}": invalid registeredAt date format`);
                  continue;
                }
              }
              if (dataToImport.birthDate && typeof dataToImport.birthDate === 'string' && dataToImport.birthDate !== '' && !dataToImport.birthDate.includes('T')) {
                try {
                  dataToImport.birthDate = new Date(dataToImport.birthDate).toISOString();
                } catch (e) {
                  dataToImport.birthDate = null;
                }
              }

              // Convert boolean strings to actual booleans
              const booleanFields = ['rx', 'cat', 'mri', 'us', 'do', 'emg'];
              for (const field of booleanFields) {
                if (dataToImport[field] !== undefined && dataToImport[field] !== null) {
                  if (typeof dataToImport[field] === 'string') {
                    dataToImport[field] = dataToImport[field].toLowerCase() === 'true' || dataToImport[field] === '1';
                  }
                }
              }

              // Convert numeric fields
              const numericFields = ['maritalStatus', 'evaluation', 'evera', 'bloodType', 'rhFactor', 'weight', 'height', 'heartRate', 'breathRate'];
              for (const field of numericFields) {
                if (dataToImport[field] !== undefined && dataToImport[field] !== null && dataToImport[field] !== '') {
                  const num = typeof dataToImport[field] === 'string' ? parseFloat(dataToImport[field]) : dataToImport[field];
                  dataToImport[field] = isNaN(num) ? null : num;
                } else {
                  dataToImport[field] = null;
                }
              }

              // Clean the data using the same function as create
              const cleaned = cleanData(dataToImport);

              // Check if patient already exists (by ID and name match)
              let existingPatient = null;
              if (csvId && !isNaN(csvId)) {
                existingPatient = await patientQueries.findById(csvId);
                // Verify name also matches
                if (existingPatient && existingPatient.name !== dataToImport.name) {
                  existingPatient = null; // ID matches but name doesn't, treat as new
                }
              }
              
              // If not found by ID, check by name
              if (!existingPatient) {
                const patientsByName = await prisma.patient.findMany({
                  where: { name: dataToImport.name },
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

              if (existingPatient) {
                // Update existing patient
                await patientQueries.update(existingPatient.id, cleaned);
                importedPatients++;
              } else {
                // Create new patient
                await patientQueries.create(cleaned);
                importedPatients++;
              }
            } catch (error: any) {
              const patientName = record.name || record.id || 'unknown';
              const errorMsg = error.message || String(error);
              // Extract the field name from Prisma errors if possible
              const fieldMatch = errorMsg.match(/Argument `(\w+)`/);
              const fieldInfo = fieldMatch ? ` (field: ${fieldMatch[1]})` : '';
              errors.push(`Error importing patient "${patientName}"${fieldInfo}: ${errorMsg.substring(0, 200)}`);
            }
          }
        } catch (error: any) {
          errors.push(`Error reading patients file: ${error.message}`);
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
              const consultationData = transformConsultationForImport(record);
              
              // Remove fields that shouldn't be in create
              const {
                id: _id,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                ...dataToImport
              } = consultationData;

              // Ensure required fields
              if (!dataToImport.patientId || !dataToImport.date) {
                errors.push(`Skipping consultation: missing required fields (patient_id or date)`);
                continue;
              }

              // Convert patientId to number (CSV reads it as string)
              const patientId = typeof dataToImport.patientId === 'string' 
                ? parseInt(dataToImport.patientId, 10) 
                : dataToImport.patientId;
              
              if (isNaN(patientId)) {
                errors.push(`Skipping consultation: invalid patient_id "${dataToImport.patientId}"`);
                continue;
              }

              // Check if patient exists
              const patient = await patientQueries.findById(patientId);
              if (!patient) {
                errors.push(`Skipping consultation: patient ID ${patientId} not found`);
                continue;
              }

              // Update patientId to the converted number
              dataToImport.patientId = patientId;

              // Convert date string to ISO format if needed
              if (dataToImport.date && typeof dataToImport.date === 'string' && !dataToImport.date.includes('T')) {
                try {
                  dataToImport.date = new Date(dataToImport.date).toISOString();
                } catch (e) {
                  errors.push(`Skipping consultation: invalid date format for patient ID ${dataToImport.patientId}`);
                  continue;
                }
              }

              // Clean the data (consultationQueries.create uses cleanData internally, but let's be explicit)
              const cleaned = cleanData(dataToImport);

              await consultationQueries.create(cleaned);
              importedConsultations++;
            } catch (error: any) {
              const errorMsg = error.message || String(error);
              const fieldMatch = errorMsg.match(/Argument `(\w+)`/);
              const fieldInfo = fieldMatch ? ` (field: ${fieldMatch[1]})` : '';
              errors.push(`Error importing consultation${fieldInfo}: ${errorMsg.substring(0, 200)}`);
            }
          }
        } catch (error: any) {
          errors.push(`Error reading consultations file: ${error.message}`);
        }
      }

      return {
        success: true,
        importedPatients,
        importedConsultations,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error('Error importing data:', error);
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
