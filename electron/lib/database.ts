import { PrismaClient } from '../../src/generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';
import { generateMedicalRecord } from './utils';

export function getDatabasePath(): string {
  const userDataPath = process.env.USER_DATA_PATH || path.join(process.cwd(), 'dev-data');
  return path.join(userDataPath, 'database', 'medical_control.db');
}

// Lazy initialization - will be set when initializeDatabase is called
let dbPath: string | null = null;
let dbDir: string | null = null;
let adapter: PrismaBetterSqlite3 | null = null;
let prisma: PrismaClient | null = null;

function initializeDatabase(force: boolean = false): void {
  const newPath = getDatabasePath();

  // If already initialized with the same path, skip (unless forced)
  if (!force && dbPath === newPath && adapter && prisma) {
    return; // Already initialized with correct path
  }

  // If path changed, disconnect old prisma instance
  if (prisma && dbPath !== newPath) {
    prisma.$disconnect().catch(console.error);
    prisma = null;
    adapter = null;
  }

  dbPath = newPath;
  dbDir = path.dirname(dbPath);

  // Only log if USER_DATA_PATH is set (not during build/dev server startup)
  if (process.env.USER_DATA_PATH) {
    console.log('Database path:', dbPath);
  }

  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Copy template database if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    const templateDb = path.join(process.cwd(), 'prisma', 'template.db');
    if (fs.existsSync(templateDb)) {
      console.log('Copying template database...');
      fs.copyFileSync(templateDb, dbPath);
      console.log('Database initialized from template');
    } else {
      console.warn('Template database not found, creating empty database');
    }
  }

  adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`
  });

  prisma = new PrismaClient({
    adapter,
  });
}

// Export function to ensure database is initialized with correct path
export function ensureDatabaseInitialized(): void {
  initializeDatabase(true); // Force reinitialization to use updated USER_DATA_PATH
}

// Don't initialize at module load - wait for ensureDatabaseInitialized() to be called
// This ensures USER_DATA_PATH is set before initialization

/**
 * Creates a backup copy of the database file with date format DD_MM_YYYY
 * @returns The path to the backup file, or null if backup failed
 */
export function createDatabaseBackup(): string | null {
  try {
    // Ensure database is initialized and get the actual path
    ensureDatabaseInitialized();
    const currentDbPath = dbPath!;

    console.log('[Backup] Attempting to create backup...');
    console.log('[Backup] Database path:', currentDbPath);

    // Check if database file exists
    if (!fs.existsSync(currentDbPath)) {
      console.warn(`[Backup] Database file does not exist at ${currentDbPath}, skipping backup`);
      return null;
    }

    // Format date as DD_MM_YYYY
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}_${month}_${year}`;

    // Create backup filename in the same directory as the database
    const backupDir = path.dirname(currentDbPath);
    const backupFileName = `medical_control_backup_${dateStr}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    console.log('[Backup] Backup will be saved to:', backupPath);

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy the database file
    fs.copyFileSync(currentDbPath, backupPath);

    // Verify backup was created
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      console.log(`✓ Database backup created successfully: ${backupPath} (${stats.size} bytes)`);
      return backupPath;
    } else {
      console.error('[Backup] Backup file was not created after copy operation');
      return null;
    }
  } catch (error) {
    console.error('[Backup] Error creating database backup:', error);
    if (error instanceof Error) {
      console.error('[Backup] Error details:', error.message, error.stack);
    }
    return null;
  }
}

// Get Prisma instance (lazy initialization)
function getPrisma(): PrismaClient {
  if (!prisma) {
    initializeDatabase();
  }
  return prisma!;
}

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
    return getPrisma().patient.findMany({
      orderBy: { name: 'asc' },
    });
  },

  findById: async (id: number) => {
    return getPrisma().patient.findUnique({
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

    const result = await getPrisma().patient.create({
      data: data as never,
    });

    // Update medical_record
    const medicalRecord = generateMedicalRecord(result.id);
    await getPrisma().patient.update({
      where: { id: result.id },
      data: { medicalRecord },
    });

    return getPrisma().patient.findUnique({
      where: { id: result.id },
      include: { treatments: true },
    });
  },

  update: async (id: number, patient: Partial<Record<string, unknown>>) => {
    // Remove relation fields and computed fields that shouldn't be updated
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      treatments,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      age,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      medical_record,
      ...patientData
    } = patient as Record<string, unknown>;

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

    return getPrisma().patient.update({
      where: { id },
      data: data as never,
      include: { treatments: true },
    });
  },

  delete: async (id: number) => {
    return getPrisma().patient.delete({
      where: { id },
    });
  },

  search: async (query: string) => {
    // SQLite doesn't support case-insensitive mode, so we use contains without mode
    return getPrisma().patient.findMany({
      where: {
        name: { contains: query },
      },
      orderBy: { name: 'asc' },
      take: 10,
    });
  },

  count: async () => {
    return getPrisma().patient.count();
  },

  recent: async (limit: number = 10) => {
    return getPrisma().patient.findMany({
      orderBy: { registeredAt: 'desc' },
      take: limit,
    });
  },

  countRecent: async (days: number = 30) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const startDate = date.toISOString();

    return getPrisma().patient.count({
      where: {
        registeredAt: {
          gte: startDate,
        },
      },
    });
  },
};

// Consultation queries
export const consultationQueries = {
  all: async () => {
    return getPrisma().consultation.findMany({
      orderBy: { date: 'desc' },
    });
  },

  findByPatientId: async (patientId: number) => {
    return getPrisma().consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByPatientIdPaginated: async (patientId: number, skip: number, take: number) => {
    return getPrisma().consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  countByPatientId: async (patientId: number) => {
    return getPrisma().consultation.count({
      where: { patientId },
    });
  },

  findById: async (id: number) => {
    return getPrisma().consultation.findUnique({
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

    return getPrisma().consultation.create({
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

    return getPrisma().consultation.update({
      where: { id },
      data: data as never,
      include: { patient: true },
    });
  },

  delete: async (id: number) => {
    return getPrisma().consultation.delete({
      where: { id },
    });
  },

  count: async () => {
    return getPrisma().consultation.count();
  },
};

// Lazy default export - use Proxy to defer initialization until actually accessed
const lazyPrisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const prismaInstance = getPrisma();
    const value = prismaInstance[prop as keyof PrismaClient];
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(prismaInstance);
    }
    return value;
  }
});

export default lazyPrisma;