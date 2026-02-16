import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../entities/User';

// Extended JWT payload interface with our custom fields
interface CustomJWTPayload extends JwtPayload {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  roles?: UserRole[];
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole; // Primary role (for backward compatibility)
    roles: UserRole[]; // All roles
  };
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret) as CustomJWTPayload;

    // Validate required fields in token
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ error: 'Invalid token: missing required fields' });
    }

    // Support both old tokens (single role) and new tokens (roles array)
    const roles = decoded.roles || (decoded.role ? [decoded.role] : [UserRole.ENGINEER]);
    const primaryRole = roles[0] || UserRole.ENGINEER;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0], // Fallback to email username if name not in token
      role: primaryRole, // Primary role for backward compatibility
      roles: roles, // All roles
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Check if user has one of the required roles
 * Now supports multi-role: checks if user has ANY of the allowed roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has ANY of the allowed roles (supports multi-role)
    const userRoles = req.user.roles || [req.user.role];
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Generate JWT token
 * @param userId - User ID
 * @param email - User email
 * @param name - User name
 * @param roles - User roles array
 */
export const generateToken = (userId: string, email: string, name: string, roles: UserRole[]): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const primaryRole = roles[0] || UserRole.ENGINEER;

  // Use shorter expiration in production for security
  const expiresIn = process.env.NODE_ENV === 'production' ? '24h' : '7d';

  return jwt.sign(
    {
      id: userId,
      email,
      name,
      role: primaryRole, // For backward compatibility
      roles, // All roles
    },
    secret,
    { expiresIn }
  );
};
