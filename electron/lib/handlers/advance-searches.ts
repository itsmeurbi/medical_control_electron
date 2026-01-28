import { ipcMain } from 'electron';
import { advancedSearch } from './utils';
import type { DatabaseModule, AdvanceSearchResponse, AdvanceSearchParams } from './types';

export function setupAdvanceSearchHandlers(
  dbModule: DatabaseModule,
  calculateAge: (birthDate: string | null | undefined) => number | null,
  generateMedicalRecord: (id: number) => string
): void {
  const { default: prisma } = dbModule;

  // GET /api/advance-searches
  ipcMain.handle('api:advance-searches', async (_event, { attribute_name, attribute_value, match_type, page }: AdvanceSearchParams): Promise<AdvanceSearchResponse> => {
    try {
      if (!attribute_name || !attribute_value) {
        throw new Error('attribute_name and attribute_value are required');
      }

      const pageStr = typeof page === 'number' ? page.toString() : (page ?? '1');
      const pageNum = parseInt(pageStr, 10);
      const itemsPerPage = 5;
      const skip = (pageNum - 1) * itemsPerPage;

      const allPatients = await advancedSearch(prisma, attribute_name, attribute_value, match_type || 'exact');
      const total = allPatients.length;
      const patients = allPatients.slice(skip, skip + itemsPerPage);

      const patientsWithAge = patients.map((patient) => ({
        ...patient,
        age: calculateAge(patient.birthDate ?? null),
        medical_record: patient.medicalRecord || (patient.id ? generateMedicalRecord(patient.id) : null)
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
