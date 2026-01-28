import fs from 'fs';
import path from 'path';

let logFilePath: string | null = null;

/**
 * Initialize the logger and clear the log file
 */
export function initializeLogger(): void {
  const userDataPath = process.env.USER_DATA_PATH || path.join(process.cwd(), 'dev-data');
  const logDir = path.join(userDataPath, 'logs');

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  logFilePath = path.join(logDir, 'app.log');

  // Clear the log file on startup
  try {
    fs.writeFileSync(logFilePath, '');
    console.log(`Log file initialized: ${logFilePath}`);
  } catch (error) {
    console.error('Failed to initialize log file:', error);
  }
}

/**
 * Write a log entry with timestamp
 */
function writeLog(level: string, message: string, data?: unknown): void {
  if (!logFilePath) {
    // Logger not initialized, try to initialize now
    initializeLogger();
    if (!logFilePath) {
      console.error('Logger not initialized, cannot write log');
      return;
    }
  }

  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    const dataStr = data ? `\n  Data: ${JSON.stringify(data, null, 2)}` : '';
    const fullEntry = `${logEntry}${dataStr}\n`;

    // Append to log file
    fs.appendFileSync(logFilePath, fullEntry, 'utf-8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, data?: unknown): void {
  writeLog('INFO', message, data);
  console.log(`[INFO] ${message}`, data || '');
}

/**
 * Log a navigation event
 */
export function logNavigation(from: string, to: string, data?: unknown): void {
  writeLog('NAVIGATION', `Navigation: ${from} -> ${to}`, data);
  console.log(`[NAVIGATION] ${from} -> ${to}`, data || '');
}

/**
 * Log a CRUD operation
 */
export function logCRUD(operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', entity: string, id?: string | number, data?: unknown): void {
  const idStr = id ? ` (ID: ${id})` : '';
  writeLog('CRUD', `${operation} ${entity}${idStr}`, data);
  console.log(`[CRUD] ${operation} ${entity}${idStr}`, data || '');
}

/**
 * Log an error/exception
 */
export function logError(message: string, error: unknown, context?: string): void {
  const errorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  };
  writeLog('ERROR', message, errorData);
  console.error(`[ERROR] ${message}`, errorData);
}

/**
 * Log a warning
 */
export function logWarning(message: string, data?: unknown): void {
  writeLog('WARN', message, data);
  console.warn(`[WARN] ${message}`, data || '');
}

/**
 * Get the log file path
 */
export function getLogFilePath(): string | null {
  return logFilePath;
}
