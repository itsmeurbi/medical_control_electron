import { ipcMain } from 'electron';
import type { DatabaseModule, StatisticsResponse } from './types';

export function setupStatisticsHandlers(dbModule: DatabaseModule): void {
  const { patientQueries, consultationQueries } = dbModule;

  // GET /api/statistics
  ipcMain.handle('api:statistics', async (): Promise<StatisticsResponse> => {
    try {
      const [totalPatients, totalConsultations, recentRegistrations] = await Promise.all([
        patientQueries.count(),
        consultationQueries.count(),
        patientQueries.countRecent(30), // Last 30 days
      ]);

      return {
        totalPatients,
        totalConsultations,
        recentRegistrations,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  });
}
