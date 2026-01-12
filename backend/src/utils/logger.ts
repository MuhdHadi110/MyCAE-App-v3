/**
 * Backend Logger Utility
 * Provides consistent logging with log levels and environment awareness
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
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
    console.log(...formatArgs('info', args));
  },

  warn: (...args: unknown[]) => {
    console.warn(...formatArgs('warn', args));
  },

  error: (...args: unknown[]) => {
    console.error(...formatArgs('error', args));
  },
};

export default logger;
