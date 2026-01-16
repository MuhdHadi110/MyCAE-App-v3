import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog, AuditAction, AuditEntityType } from '../entities/AuditLog';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

/**
 * Audit Log Service
 * Records finance-related operations for compliance and security
 */
export class AuditLogService {
  private static getRepository() {
    return AppDataSource.getRepository(AuditLog);
  }

  /**
   * Log a finance operation
   */
  static async log(params: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    userId?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    description?: string;
    changes?: { before?: Record<string, any>; after?: Record<string, any> };
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog | null> {
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

      logger.debug('Audit log created', {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
      });

      return auditLog;
    } catch (error: any) {
      logger.error('Failed to create audit log:', error.message);
      // Don't throw - audit logging should not break the main operation
      return null;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getLogsForEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit = 50
  ): Promise<AuditLog[]> {
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
  static async getLogsByUser(userId: string, limit = 100): Promise<AuditLog[]> {
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
  static async getRecentLogs(limit = 100): Promise<AuditLog[]> {
    const repo = this.getRepository();
    return repo.find({
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}

/**
 * Helper function to extract client info from request
 */
export function getClientInfo(req: AuthRequest): {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
} {
  return {
    userId: req.user?.id || null,
    userName: req.user?.name || null,
    userEmail: req.user?.email || null,
    ipAddress: (req.ip || req.socket?.remoteAddress || null) as string | null,
    userAgent: (req.headers['user-agent'] || null) as string | null,
  };
}

/**
 * Create an audit log entry for a finance operation
 * Use this as a helper in route handlers
 */
export async function auditFinanceOperation(
  req: AuthRequest,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  description?: string,
  changes?: { before?: Record<string, any>; after?: Record<string, any> }
): Promise<void> {
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

export { AuditAction, AuditEntityType };
