"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEntityType = exports.AuditAction = exports.AuditLogService = void 0;
exports.getClientInfo = getClientInfo;
exports.auditFinanceOperation = auditFinanceOperation;
const database_1 = require("../config/database");
const AuditLog_1 = require("../entities/AuditLog");
Object.defineProperty(exports, "AuditAction", { enumerable: true, get: function () { return AuditLog_1.AuditAction; } });
Object.defineProperty(exports, "AuditEntityType", { enumerable: true, get: function () { return AuditLog_1.AuditEntityType; } });
const logger_1 = require("../utils/logger");
/**
 * Audit Log Service
 * Records finance-related operations for compliance and security
 */
class AuditLogService {
    static getRepository() {
        return database_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
    }
    /**
     * Log a finance operation
     */
    static async log(params) {
        try {
            const repo = this.getRepository();
            const auditLog = repo.create({
                action: params.action,
                entity_type: params.entityType,
                entity_id: params.entityId,
                user_id: params.userId || null,
                user_name: params.userName || null,
                user_email: params.userEmail || null,
                description: params.description || null,
                changes: params.changes || null,
                ip_address: params.ipAddress || null,
                user_agent: params.userAgent?.substring(0, 500) || null,
            });
            await repo.save(auditLog);
            logger_1.logger.debug('Audit log created', {
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                userId: params.userId,
            });
            return auditLog;
        }
        catch (error) {
            logger_1.logger.error('Failed to create audit log:', error.message);
            // Don't throw - audit logging should not break the main operation
            return null;
        }
    }
    /**
     * Get audit logs for a specific entity
     */
    static async getLogsForEntity(entityType, entityId, limit = 50) {
        const repo = this.getRepository();
        return repo.find({
            where: { entity_type: entityType, entity_id: entityId },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
    /**
     * Get audit logs by user
     */
    static async getLogsByUser(userId, limit = 100) {
        const repo = this.getRepository();
        return repo.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
    /**
     * Get recent audit logs
     */
    static async getRecentLogs(limit = 100) {
        const repo = this.getRepository();
        return repo.find({
            order: { created_at: 'DESC' },
            take: limit,
            relations: ['user'],
        });
    }
}
exports.AuditLogService = AuditLogService;
/**
 * Helper function to extract client info from request
 */
function getClientInfo(req) {
    return {
        userId: req.user?.id || null,
        userName: req.user?.name || null,
        userEmail: req.user?.email || null,
        ipAddress: (req.ip || req.socket?.remoteAddress || null),
        userAgent: (req.headers['user-agent'] || null),
    };
}
/**
 * Create an audit log entry for a finance operation
 * Use this as a helper in route handlers
 */
async function auditFinanceOperation(req, action, entityType, entityId, description, changes) {
    const clientInfo = getClientInfo(req);
    await AuditLogService.log({
        action,
        entityType,
        entityId,
        ...clientInfo,
        description,
        changes,
    });
}
//# sourceMappingURL=auditLog.js.map