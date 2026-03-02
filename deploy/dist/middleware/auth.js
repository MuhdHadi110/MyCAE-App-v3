"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../entities/User");
/**
 * Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Support both old tokens (single role) and new tokens (roles array)
        const roles = decoded.roles || (decoded.role ? [decoded.role] : [User_1.UserRole.ENGINEER]);
        const primaryRole = roles[0] || User_1.UserRole.ENGINEER;
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0], // Fallback to email username if name not in token
            role: primaryRole, // Primary role for backward compatibility
            roles: roles, // All roles
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
/**
 * Check if user has one of the required roles
 * Now supports multi-role: checks if user has ANY of the allowed roles
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
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
exports.authorize = authorize;
/**
 * Generate JWT token
 * @param userId - User ID
 * @param email - User email
 * @param name - User name
 * @param roles - User roles array
 */
const generateToken = (userId, email, name, roles) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    const primaryRole = roles[0] || User_1.UserRole.ENGINEER;
    // Use shorter expiration in production for security
    const expiresIn = process.env.NODE_ENV === 'production' ? '24h' : '7d';
    return jsonwebtoken_1.default.sign({
        id: userId,
        email,
        name,
        role: primaryRole, // For backward compatibility
        roles, // All roles
    }, secret, { expiresIn });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map