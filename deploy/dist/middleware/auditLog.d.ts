import { AuditLog, AuditAction, AuditEntityType } from '../entities/AuditLog';
import { AuthRequest } from './auth';
/**
 * Audit Log Service
 * Records finance-related operations for compliance and security
 */
export declare class AuditLogService {
    private static getRepository;
    /**
     * Log a finance operation
     */
    static log(params: {
        action: AuditAction;
        entityType: AuditEntityType;
        entityId: string;
        userId?: string | null;
        userName?: string | null;
        userEmail?: string | null;
        description?: string;
        changes?: {
            before?: Record<string, any>;
            after?: Record<string, any>;
        };
        ipAddress?: string | null;
        userAgent?: string | null;
    }): Promise<AuditLog | null>;
    /**
     * Get audit logs for a specific entity
     */
    static getLogsForEntity(entityType: AuditEntityType, entityId: string, limit?: number): Promise<AuditLog[]>;
    /**
     * Get audit logs by user
     */
    static getLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
    /**
     * Get recent audit logs
     */
    static getRecentLogs(limit?: number): Promise<AuditLog[]>;
}
/**
 * Helper function to extract client info from request
 */
export declare function getClientInfo(req: AuthRequest): {
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    ipAddress: string | null;
    userAgent: string | null;
};
/**
 * Create an audit log entry for a finance operation
 * Use this as a helper in route handlers
 */
export declare function auditFinanceOperation(req: AuthRequest, action: AuditAction, entityType: AuditEntityType, entityId: string, description?: string, changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
}): Promise<void>;
export { AuditAction, AuditEntityType };
//# sourceMappingURL=auditLog.d.ts.map