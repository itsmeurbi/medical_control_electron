import type { PrismaClient } from '../../../src/generated/client';
import type { Patient, Consultation } from '../../../lib/types';

// Database module types
export interface DatabaseModule {
  patientQueries: {
    all: () => Promise<Patient[]>;
    findById: (id: number) => Promise<Patient | null>;
    create: (patient: Partial<Patient>) => Promise<Patient>;
    update: (id: number, patient: Partial<Patient>) => Promise<Patient>;
    delete: (id: number) => Promise<void>;
    search: (query: string) => Promise<Patient[]>;
    count: () => Promise<number>;
    recent: (limit?: number) => Promise<Patient[]>;
    countRecent: (days: number) => Promise<number>;
  };
  consultationQueries: {
    all: () => Promise<Consultation[]>;
    findByPatientId: (patientId: number) => Promise<Consultation[]>;
    findByPatientIdPaginated: (patientId: number, skip: number, take: number) => Promise<Consultation[]>;
    countByPatientId: (patientId: number) => Promise<number>;
    findById: (id: number) => Promise<Consultation | null>;
    create: (consultation: Partial<Consultation>) => Promise<Consultation>;
    update: (id: number, consultation: Partial<Consultation>) => Promise<Consultation>;
    delete: (id: number) => Promise<void>;
    count: () => Promise<number>;
  };
  default: PrismaClient;
}

// CSV export/import types (snake_case for CSV compatibility)
export interface PatientCsvRow {
  id: number | null;
  name: string | null;
  birth_date: string | null;
  city: string | null;
  address: string | null;
  phone_number: string | null;
  medical_record: string | null;
  registered_at: string | null;
  gender: string | null;
  marital_status: number | null;
  reference: string | null;
  occupations: string | null;
  primary_dx: string | null;
  initial_dx: string | null;
  final_dx: string | null;
  medical_background: string | null;
  surgical_background: string | null;
  interventionism_tx: string | null;
  pain_type: string | null;
  pain_localization: string | null;
  pain_evolution: string | null;
  pain_duration: string | null;
  pain_initial_state: string | null;
  pain_current_state: string | null;
  alergies: string | null;
  irradiations: string | null;
  evaluation: number | null;
  evera: number | null;
  previous_tx: string | null;
  blood_type: number | null;
  rh_factor: number | null;
  weight: number | null;
  height: number | null;
  blood_pressure: string | null;
  heart_rate: number | null;
  breath_rate: number | null;
  general_inspection: string | null;
  head: string | null;
  abdomen: string | null;
  neck: string | null;
  extremities: string | null;
  spine: string | null;
  chest: string | null;
  laboratory: string | null;
  cabinet: string | null;
  consultations: string | null;
  requested_studies: string | null;
  created_at: string | null;
  updated_at: string | null;
  anticoagulants: string | null;
  cellphone_number: string | null;
  chronics: string | null;
  fiscal_situation: string | null;
  email: string | null;
  zip_code: string | null;
  rx: boolean | null;
  cat: boolean | null;
  mri: boolean | null;
  us: boolean | null;
  do: boolean | null;
  emg: boolean | null;
  spo2: string | null;
  increases_with: string | null;
  decreases_with: string | null;
  cellphone_number_two: string | null;
  cellphone_number_three: string | null;
}

export interface ConsultationCsvRow {
  id: number | null;
  patient_id: number | null;
  procedure: string | null;
  meds: string | null;
  date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Patient with computed fields
export interface PatientWithComputed extends Patient {
  age: number | null;
  medical_record: string | null;
}

// Consultation list response
export interface ConsultationListResponse {
  consultations: Consultation[];
  pagination: {
    page: number;
    itemsPerPage: number;
    totalCount: number;
    totalPages: number;
  };
}

// Advance search response
export interface AdvanceSearchResponse {
  patients: PatientWithComputed[];
  total: number;
  page: number;
  totalPages: number;
}

// Statistics response
export interface StatisticsResponse {
  totalPatients: number;
  totalConsultations: number;
  recentRegistrations: number;
}

// Import response
export interface ImportResponse {
  success: boolean;
  importedPatients?: number;
  importedConsultations?: number;
  errors?: string[];
  message?: string;
}

// Patient create/update data (with optional treatment)
export interface PatientCreateData extends Omit<Partial<Patient>, 'gender'> {
  name: string;
  registeredAt: string;
  gender: string | number;
  treatment?: {
    procedure?: string | null;
    meds?: string | null;
    date?: string;
  };
}

export interface PatientUpdateData extends Omit<Partial<Patient>, 'gender'> {
  gender?: string | number;
  treatment?: {
    procedure?: string | null;
    meds?: string | null;
    date?: string;
  };
  medical_record?: string | null;
}

// Consultation create/update data
export interface ConsultationCreateData {
  patient_id: string | number;
  date: string;
  procedure?: string | null;
  meds?: string | null;
}

export interface ConsultationUpdateData {
  date?: string;
  procedure?: string | null;
  meds?: string | null;
}

// Advance search params
export interface AdvanceSearchParams {
  attribute_name: string;
  attribute_value: string;
  match_type?: 'exact' | 'starts_with' | 'ends_with' | 'contains';
  page?: string | number;
}

// Match type for advanced search
export type MatchType = 'exact' | 'starts_with' | 'ends_with' | 'contains';
