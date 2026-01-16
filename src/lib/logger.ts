/**
 * Frontend Logger Utility
 * Only logs in development mode to keep production clean
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  axiosError: (message: string, error: any) => void;
}

const formatArgs = (level: LogLevel, args: unknown[]): unknown[] => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return [prefix, ...args];
};

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log(...formatArgs('debug', args));
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...formatArgs('info', args));
    }
  },

  warn: (...args: unknown[]) => {
    // Warnings are shown in both dev and prod
    console.warn(...formatArgs('warn', args));
  },

  error: (...args: unknown[]) => {
    // Errors are always logged
    console.error(...formatArgs('error', args));
  },

  // Helper to log AxiosError with details
  axiosError: (message: string, error: any) => {
    if (isDev) {
      console.error(...formatArgs('error', [message]));
      if (error?.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error?.message) {
        console.error('Error message:', error.message);
      }
    }
  },
};

export default logger;
