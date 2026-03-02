/**
 * Backend Logger Utility
 * Production-ready structured logging with Winston
 * Features:
 * - JSON format in production for log aggregation
 * - Sensitive data masking (passwords, tokens, secrets)
 * - Request correlation IDs
 * - Console output in development, file output in production
 */
/**
 * Logger interface matching existing usage
 */
export interface Logger {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    http: (message: string, meta?: object) => void;
    withCorrelationId: (correlationId: string) => Logger;
}
/**
 * Main logger export - compatible with existing usage
 */
export declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map