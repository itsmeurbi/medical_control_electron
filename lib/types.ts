export enum Gender {
  Masculino = 0,
  Femenino = 1
}

export enum MaritalStatus {
  Casado = 0,
  Divorciado = 1,
  Soltero = 2,
  UnionLibre = 3,
  Viudo = 4
}

export enum Evera {
  Leve = 0,
  Moderado = 1,
  Fuerte = 2,
  MuyFuerte = 3,
  Insoportable = 4
}

export enum BloodType {
  A = 0,
  B = 1,
  AB = 2,
  O = 3
}

export enum RhFactor {
  Negativo = 0,
  Positivo = 1
}

// Database types - using camelCase to match Prisma schema
export interface Patient {
  id?: number;
  name: string;
  birthDate?: string | null;
  city?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  medicalRecord?: string | null;
  registeredAt: string;
  gender: Gender;
  maritalStatus?: MaritalStatus | null;
  reference?: string | null;
  occupations?: string | null;
  primaryDx?: string | null;
  initialDx?: string | null;
  finalDx?: string | null;
  medicalBackground?: string | null;
  surgicalBackground?: string | null;
  interventionismTx?: string | null;
  painType?: string | null;
  painLocalization?: string | null;
  painEvolution?: string | null;
  painDuration?: string | null;
  painInitialState?: string | null;
  painCurrentState?: string | null;
  alergies?: string | null;
  irradiations?: string | null;
  evaluation?: number | null;
  evera?: Evera | null;
  previousTx?: string | null;
  bloodType?: BloodType | null;
  rhFactor?: RhFactor | null;
  weight?: number | null;
  height?: number | null;
  bloodPressure?: string | null;
  heartRate?: number | null;
  breathRate?: number | null;
  generalInspection?: string | null;
  head?: string | null;
  abdomen?: string | null;
  neck?: string | null;
  extremities?: string | null;
  spine?: string | null;
  chest?: string | null;
  laboratory?: string | null;
  cabinet?: string | null;
  consultations?: string | null;
  requestedStudies?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  anticoagulants?: string | null;
  cellphoneNumber?: string | null;
  chronics?: string | null;
  fiscalSituation?: string | null;
  email?: string | null;
  zipCode?: string | null;
  rx?: boolean | null;
  cat?: boolean | null;
  mri?: boolean | null;
  us?: boolean | null;
  do?: boolean | null;
  emg?: boolean | null;
  spo2?: string | null;
  increasesWith?: string | null;
  decreasesWith?: string | null;
  cellphoneNumberTwo?: string | null;
  cellphoneNumberThree?: string | null;
  // Computed properties
  age?: number | null;
  treatments?: Consultation[];
}

export interface Consultation {
  id?: number;
  patientId: number;
  procedure?: string | null;
  meds?: string | null;
  date: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  patient?: Patient;
}
