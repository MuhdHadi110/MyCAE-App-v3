/**
 * Backend Logger Utility
 * Production-ready structured logging with Winston
 * Features:
 * - JSON format in production for log aggregation
 * - Sensitive data masking (passwords, tokens, secrets)
 * - Request correlation IDs
 * - Console output in development, file output in production
 */

import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Sensitive fields to mask in logs
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'newPassword',
  'currentPassword',
  'token',
  'jwt',
  'authorization',
  'secret',
  'apiKey',
  'api_key',
  'credit_card',
  'creditCard',
  'ssn',
  'reset_token',
  'resetToken',
];

/**
 * Mask sensitive data in objects recursively
 */
const maskSensitiveData = (obj: any, depth = 0): any => {
  if (depth > 10) return obj; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item, depth + 1));
  }

  const masked: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

/**
 * Custom format for masking sensitive data
 */
const maskFormat = winston.format((info) => {
  // Mask sensitive data in the message if it's an object
  if (info.message && typeof info.message === 'object') {
    info.message = maskSensitiveData(info.message);
  }
  // Mask sensitive data in any additional metadata
  if (info.meta && typeof info.meta === 'object') {
    info.meta = maskSensitiveData(info.meta);
  }
  return info;
});

/**
 * Format for development - human readable
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  maskFormat(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : message;
    return `[${timestamp}] ${level}: ${msgStr}${metaStr}`;
  })
);

/**
 * Format for production - JSON for log aggregation
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  maskFormat(),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
const winstonLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'mycae-tracker-api' },
  transports: [
    new winston.transports.Console({
      silent: false,
    }),
  ],
});

// Add file transport in production
if (isProduction) {
  winstonLogger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
  winstonLogger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

/**
 * Logger interface matching existing usage
 */
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  // Additional methods for structured logging
  http: (message: string, meta?: object) => void;
  withCorrelationId: (correlationId: string) => Logger;
}

/**
 * Create a child logger with correlation ID
 */
const createChildLogger = (correlationId: string): Logger => {
  const child = winstonLogger.child({ correlationId });
  return {
    debug: (...args) => child.debug(args.length === 1 ? args[0] : args),
    info: (...args) => child.info(args.length === 1 ? args[0] : args),
    warn: (...args) => child.warn(args.length === 1 ? args[0] : args),
    error: (...args) => child.error(args.length === 1 ? args[0] : args),
    http: (message, meta) => child.http(message, meta),
    withCorrelationId: (newId) => createChildLogger(newId),
  };
};

/**
 * Main logger export - compatible with existing usage
 */
export const logger: Logger = {
  debug: (...args: unknown[]) => {
    winstonLogger.debug(args.length === 1 ? args[0] as any : args as any);
  },

  info: (...args: unknown[]) => {
    winstonLogger.info(args.length === 1 ? args[0] as any : args as any);
  },

  warn: (...args: unknown[]) => {
    winstonLogger.warn(args.length === 1 ? args[0] as any : args as any);
  },

  error: (...args: unknown[]) => {
    winstonLogger.error(args.length === 1 ? args[0] as any : args as any);
  },

  http: (message: string, meta?: object) => {
    winstonLogger.http(message, meta);
  },

  withCorrelationId: (correlationId: string) => createChildLogger(correlationId),
};

export default logger;
