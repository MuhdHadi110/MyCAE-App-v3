"use strict";
/**
 * Backend Logger Utility
 * Production-ready structured logging with Winston
 * Features:
 * - JSON format in production for log aggregation
 * - Sensitive data masking (passwords, tokens, secrets)
 * - Request correlation IDs
 * - Console output in development, file output in production
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
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
const maskSensitiveData = (obj, depth = 0) => {
    if (depth > 10)
        return obj; // Prevent infinite recursion
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveData(item, depth + 1));
    }
    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
            masked[key] = '[REDACTED]';
        }
        else if (typeof value === 'object') {
            masked[key] = maskSensitiveData(value, depth + 1);
        }
        else {
            masked[key] = value;
        }
    }
    return masked;
};
/**
 * Custom format for masking sensitive data
 */
const maskFormat = winston_1.default.format((info) => {
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
const devFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), maskFormat(), winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : message;
    return `[${timestamp}] ${level}: ${msgStr}${metaStr}`;
}));
/**
 * Format for production - JSON for log aggregation
 */
const prodFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), maskFormat(), winston_1.default.format.json());
/**
 * Create Winston logger instance
 */
const winstonLogger = winston_1.default.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'mycae-tracker-api' },
    transports: [
        new winston_1.default.transports.Console({
            silent: false,
        }),
    ],
});
// Add file transport in production
if (isProduction) {
    winstonLogger.add(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    }));
    winstonLogger.add(new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    }));
}
/**
 * Create a child logger with correlation ID
 */
const createChildLogger = (correlationId) => {
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
exports.logger = {
    debug: (...args) => {
        winstonLogger.debug(args.length === 1 ? args[0] : args);
    },
    info: (...args) => {
        winstonLogger.info(args.length === 1 ? args[0] : args);
    },
    warn: (...args) => {
        winstonLogger.warn(args.length === 1 ? args[0] : args);
    },
    error: (...args) => {
        winstonLogger.error(args.length === 1 ? args[0] : args);
    },
    http: (message, meta) => {
        winstonLogger.http(message, meta);
    },
    withCorrelationId: (correlationId) => createChildLogger(correlationId),
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map