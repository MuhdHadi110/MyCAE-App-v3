import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        roles: UserRole[];
    };
}
/**
 * Verify JWT token and attach user to request
 */
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Check if user has one of the required roles
 * Now supports multi-role: checks if user has ANY of the allowed roles
 */
export declare const authorize: (...allowedRoles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Generate JWT token
 * @param userId - User ID
 * @param email - User email
 * @param name - User name
 * @param roles - User roles array
 */
export declare const generateToken: (userId: string, email: string, name: string, roles: UserRole[]) => string;
//# sourceMappingURL=auth.d.ts.map