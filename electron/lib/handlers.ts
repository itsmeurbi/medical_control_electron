// IPC Handlers Entrypoint
// This file sets up all IPC handlers by importing and configuring handler modules

import { setupPatientHandlers } from './handlers/patients';
import { setupConsultationHandlers } from './handlers/consultations';
import { setupAdvanceSearchHandlers } from './handlers/advance-searches';
import { setupStatisticsHandlers } from './handlers/statistics';
import type { DatabaseModule } from './handlers/types';

export async function setupIpcHandlers(dbModule: DatabaseModule): Promise<void> {
  // Get utils functions - vite-plugin-electron bundles them
  const utils = await import('./utils');
  const { calculateAge, generateMedicalRecord } = utils;

  // Setup all handler modules
  setupPatientHandlers(dbModule, calculateAge, generateMedicalRecord);
  setupConsultationHandlers(dbModule);
  setupAdvanceSearchHandlers(dbModule, calculateAge, generateMedicalRecord);
  setupStatisticsHandlers(dbModule);
}
