import type { Patient, Consultation } from '../../../lib/types';
import type { PatientCsvRow, ConsultationCsvRow, MatchType } from './types';

// Helper to clean data
export function cleanData<T extends Record<string, unknown>>(data: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value === '' && key !== 'name' && key !== 'registeredAt' && key !== 'gender') {
      cleaned[key as keyof T] = null as T[keyof T];
    } else {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }
  return cleaned;
}

// Normalize date to ISO format - handles all date formats consistently
export function normalizeDateToISO(dateValue: unknown): string | null {
  if (!dateValue || dateValue === '') return null;
  if (typeof dateValue !== 'string') return null;
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// Transform patient data to snake_case for backward compatibility
export function transformPatientForExport(patient: Patient): PatientCsvRow {
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

  const transformed: PatientCsvRow = {} as PatientCsvRow;
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

  const transformedRecord = transformed as unknown as Record<string, unknown>;
  for (const snakeKey of columnOrder) {
    const camelKey = Object.keys(mapping).find(k => mapping[k] === snakeKey);
    if (camelKey && Object.prototype.hasOwnProperty.call(patient, camelKey)) {
      const patientRecord = patient as unknown as Record<string, unknown>;
      const value = patientRecord[camelKey];
      transformedRecord[snakeKey] = value;
    } else {
      transformedRecord[snakeKey] = null;
    }
  }

  return transformed;
}

// Transform consultation data to snake_case matching reference CSV format
export function transformConsultationForExport(consultation: Consultation): ConsultationCsvRow {
  return {
    id: consultation.id ?? null,
    patient_id: consultation.patientId ?? null,
    procedure: consultation.procedure ?? null,
    meds: consultation.meds ?? null,
    date: consultation.date ?? null,
    created_at: typeof consultation.createdAt === 'string' ? consultation.createdAt : (consultation.createdAt instanceof Date ? consultation.createdAt.toISOString() : null),
    updated_at: typeof consultation.updatedAt === 'string' ? consultation.updatedAt : (consultation.updatedAt instanceof Date ? consultation.updatedAt.toISOString() : null),
  };
}

// Convert snake_case back to camelCase for import
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Transform patient data from snake_case to camelCase for import
export function transformPatientForImport(patient: PatientCsvRow): Partial<Patient> {
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

  const transformed: Partial<Patient> = {};
  for (const [snakeKey, value] of Object.entries(patient)) {
    const camelKey = mapping[snakeKey] || snakeToCamel(snakeKey);
    (transformed as Record<string, unknown>)[camelKey] = value === '' ? null : value;
  }
  return transformed;
}

// Transform consultation data from snake_case to camelCase for import
export function transformConsultationForImport(consultation: ConsultationCsvRow): Partial<Consultation> {
  return {
    id: consultation.id ?? undefined,
    patientId: consultation.patient_id ?? undefined,
    procedure: consultation.procedure === '' ? null : (consultation.procedure ?? null),
    meds: consultation.meds === '' ? null : (consultation.meds ?? null),
    date: consultation.date ?? undefined,
    createdAt: consultation.created_at ?? undefined,
    updatedAt: consultation.updated_at ?? undefined,
  };
}

// Advanced search helper
import type { PrismaClient } from '../../../src/generated/client';

export async function advancedSearch(
  prisma: PrismaClient,
  attributeName: string,
  attributeValue: string,
  matchType: MatchType
): Promise<Patient[]> {
  if (!attributeName || !attributeValue) {
    return [];
  }

  const searchValue = attributeValue.toLowerCase();
  const whereClause: Record<string, unknown> = {};

  if (['gender', 'maritalStatus', 'evera', 'bloodType', 'rhFactor'].includes(attributeName)) {
    const enumMap: Record<string, Record<string, number>> = {
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
    where: whereClause as never,
    orderBy: { name: 'asc' },
  }) as Patient[];
}
