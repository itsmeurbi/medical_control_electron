import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';
import { generateMedicalRecord } from './utils';

const dbPath = path.join(process.cwd(), 'database', 'medical_control.db');
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Use relative path for adapter (as per Prisma 7 docs)
const relativeDbPath = path.relative(process.cwd(), dbPath);
const adapter = new PrismaBetterSqlite3({
  url: `file:${relativeDbPath}`
});

const prisma = new PrismaClient({
  adapter,
});

// Clean data for Prisma - remove undefined and ensure proper types
function cleanData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    // Convert empty strings to null for optional string fields
    if (value === '' && key !== 'name' && key !== 'registeredAt' && key !== 'gender') {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Patient queries
export const patientQueries = {
  all: async () => {
    return prisma.patient.findMany({
      orderBy: { name: 'asc' },
    });
  },

  findById: async (id: number) => {
    return prisma.patient.findUnique({
      where: { id },
      include: { treatments: true },
    });
  },

  create: async (patient: Omit<Record<string, unknown>, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const data = cleanData({
      ...patient,
      registeredAt: patient.registeredAt || now,
      createdAt: now,
      updatedAt: now,
    });

    // Ensure birthDate is properly formatted or null
    if (data.birthDate) {
      if (typeof data.birthDate === 'string' && !data.birthDate.includes('T')) {
        data.birthDate = new Date(data.birthDate).toISOString();
      }
    } else {
      data.birthDate = null;
    }

    const result = await prisma.patient.create({
      data: data as never,
    });

    // Update medical_record
    const medicalRecord = generateMedicalRecord(result.id);
    await prisma.patient.update({
      where: { id: result.id },
      data: { medicalRecord },
    });

    return prisma.patient.findUnique({
      where: { id: result.id },
      include: { treatments: true },
    });
  },

  update: async (id: number, patient: Partial<Record<string, unknown>>) => {
    // Remove relation fields and computed fields that shouldn't be updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _treatments, _age, _medical_record, ...patientData } = patient as Record<string, unknown>;

    const data = cleanData({
      ...patientData,
      updatedAt: new Date().toISOString(),
    });

    // Ensure birthDate is properly formatted
    if (data.birthDate) {
      if (typeof data.birthDate === 'string' && !data.birthDate.includes('T')) {
        data.birthDate = new Date(data.birthDate).toISOString();
      }
    }

    return prisma.patient.update({
      where: { id },
      data: data as never,
      include: { treatments: true },
    });
  },

  delete: async (id: number) => {
    return prisma.patient.delete({
      where: { id },
    });
  },

  search: async (query: string) => {
    // SQLite doesn't support case-insensitive mode, so we use contains without mode
    return prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { medicalRecord: { contains: query } },
          { city: { contains: query } },
          { phoneNumber: { contains: query } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 10,
    });
  },
};

// Consultation queries
export const consultationQueries = {
  findByPatientId: async (patientId: number) => {
    return prisma.consultation.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  },

  findById: async (id: number) => {
    return prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });
  },

  create: async (consultation: Omit<Record<string, unknown>, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const data = cleanData({
      ...consultation,
      createdAt: now,
      updatedAt: now,
    });

    // Ensure date is properly formatted
    if (data.date && typeof data.date === 'string' && !data.date.includes('T')) {
      data.date = new Date(data.date).toISOString();
    }

    return prisma.consultation.create({
      data: data as never,
      include: { patient: true },
    });
  },

  update: async (id: number, consultation: Partial<Record<string, unknown>>) => {
    const data = cleanData({
      ...consultation,
      updatedAt: new Date().toISOString(),
    });

    // Ensure date is properly formatted
    if (data.date && typeof data.date === 'string' && !data.date.includes('T')) {
      data.date = new Date(data.date).toISOString();
    }

    return prisma.consultation.update({
      where: { id },
      data: data as never,
      include: { patient: true },
    });
  },

  delete: async (id: number) => {
    return prisma.consultation.delete({
      where: { id },
    });
  },
};

export default prisma;