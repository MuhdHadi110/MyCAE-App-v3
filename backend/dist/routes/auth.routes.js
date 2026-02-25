"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const TeamMember_1 = require("../entities/TeamMember");
const auth_1 = require("../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const recaptcha_1 = require("../utils/recaptcha");
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = __importDefault(require("../services/email.service"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Rate limiting - strict for login/register (5 attempts per 15 minutes)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5 : 100, // Strict in production, lenient in dev
    message: 'Too many authentication attempts, please try again after 15 minutes',
});
// Rate limiting - strict for password changes (3 attempts per minute)
const changePasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 3 : 100, // Strict in production, lenient in dev
    message: 'Too many password change attempts, please try again later',
});
/**
 * Password complexity validation
 * Requires: min 12 chars, uppercase, lowercase, number, special char
 */
const passwordComplexityValidator = (value) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    if (value.length < minLength) {
        throw new Error(`Password must be at least ${minLength} characters`);
    }
    if (!hasUppercase) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
        throw new Error('Password must contain at least one number');
    }
    if (!hasSpecial) {
        throw new Error('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    }
    return true;
};
/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', authLimiter, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').custom(passwordComplexityValidator),
    (0, express_validator_1.body)('role').optional().isIn(Object.values(User_1.UserRole)),
    (0, express_validator_1.body)('captchaToken')
        .if(() => process.env.NODE_ENV === 'production')
        .notEmpty()
        .withMessage('CAPTCHA verification is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password, role, department, position, captchaToken } = req.body;
        // Verify reCAPTCHA in production
        if (process.env.NODE_ENV === 'production') {
            if (!captchaToken) {
                return res.status(400).json({ error: 'CAPTCHA verification is required.' });
            }
            const remoteIp = req.ip || req.socket.remoteAddress;
            const isValidCaptcha = await (0, recaptcha_1.verifyRecaptcha)(captchaToken, remoteIp);
            if (!isValidCaptcha) {
                return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
            }
        }
        else if (captchaToken) {
            // In development, verify only if provided
            const remoteIp = req.ip || req.socket.remoteAddress;
            const isValidCaptcha = await (0, recaptcha_1.verifyRecaptcha)(captchaToken, remoteIp);
            if (!isValidCaptcha) {
                return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
            }
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Check if user already exists
        const existingUser = await userRepo.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        // Hash password
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = userRepo.create({
            name,
            email,
            password_hash,
            role: (role || User_1.UserRole.ENGINEER),
            department,
            position,
        });
        await userRepo.save(user);
        // Generate token
        const token = (0, auth_1.generateToken)(user.id, user.email, user.name, user.roles);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error', { error });
        res.status(500).json({ error: 'Registration failed' });
    }
});
/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    (0, express_validator_1.body)('captchaToken')
        .if(() => process.env.NODE_ENV === 'production')
        .notEmpty()
        .withMessage('CAPTCHA verification is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, captchaToken } = req.body;
        // Verify reCAPTCHA (required in production)
        if (process.env.NODE_ENV === 'production') {
            if (!captchaToken) {
                return res.status(400).json({ error: 'CAPTCHA verification is required.' });
            }
            const remoteIp = req.ip || req.socket.remoteAddress;
            const isValidCaptcha = await (0, recaptcha_1.verifyRecaptcha)(captchaToken, remoteIp);
            if (!isValidCaptcha) {
                return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
            }
        }
        else if (captchaToken) {
            // In development, verify only if provided
            const remoteIp = req.ip || req.socket.remoteAddress;
            const isValidCaptcha = await (0, recaptcha_1.verifyRecaptcha)(captchaToken, remoteIp);
            if (!isValidCaptcha) {
                return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
            }
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Find user - use constant-time comparison to prevent timing attacks
        const user = await userRepo.findOne({ where: { email } });
        // Security: Always run password check to prevent timing-based user enumeration
        const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV';
        const hashToCheck = user ? user.password_hash : dummyHash;
        const isValidPassword = await bcryptjs_1.default.compare(password, hashToCheck);
        if (!user || !isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check team member status - block terminated/inactive users
        const teamMemberRepo = database_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
        const teamMember = await teamMemberRepo.findOne({ where: { user_id: user.id } });
        if (teamMember) {
            // Block login for terminated or inactive employees
            if (teamMember.status === 'terminated') {
                return res.status(403).json({
                    error: 'Your account has been terminated. Please contact HR if you believe this is an error.'
                });
            }
            if (teamMember.status === 'inactive') {
                return res.status(403).json({
                    error: 'Your account is currently inactive. Please contact your administrator.'
                });
            }
            // 'active' and 'on-leave' are allowed to log in
        }
        // Check if password has expired (for temp passwords)
        if (user.is_temp_password && user.temp_password_expires) {
            const now = new Date();
            if (now > user.temp_password_expires) {
                return res.status(403).json({
                    error: 'Your temporary password has expired. Please contact your administrator to reset your password.'
                });
            }
        }
        // Check if this is first-time login (user has never changed password)
        // We check if the user has a reset_token set or is_temp_password flag (indicates temp password was assigned)
        const isFirstTimeLogin = user.is_temp_password || (user.reset_token !== null && user.reset_token !== undefined);
        // Generate token
        const token = (0, auth_1.generateToken)(user.id, user.email, user.name, user.roles);
        const responseData = {
            message: 'Login successful',
            token,
            isFirstTimeLogin,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                roles: user.roles,
                department: user.department,
                position: user.position,
                avatar: user.avatar,
            },
        };
        res.json(responseData);
    }
    catch (error) {
        logger_1.logger.error('Login error', { error });
        res.status(500).json({ error: 'Login failed' });
    }
});
/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', changePasswordLimiter, [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('currentPassword').optional().isString(),
    (0, express_validator_1.body)('newPassword').custom(passwordComplexityValidator),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => e.msg).join(', ');
            return res.status(400).json({ error: errorMessages });
        }
        const { email, currentPassword, newPassword } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Find user
        const user = await userRepo.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if current password is provided
        if (!currentPassword) {
            // Allow empty current password only for first-time login
            // (indicated by reset_token being set from user creation)
            const isFirstTimeUser = user.reset_token !== null && user.reset_token !== undefined;
            if (!isFirstTimeUser) {
                return res.status(400).json({ error: 'Current password is required' });
            }
        }
        else {
            // Verify current password
            const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
        }
        // Hash new password
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password and clear first-time login marker
        user.password_hash = newPasswordHash;
        user.reset_token = undefined; // Clear to mark user as having changed password
        user.reset_token_expires = undefined;
        user.is_temp_password = false; // Clear temp password flag
        user.temp_password_expires = undefined; // Clear temp password expiry
        await userRepo.save(user);
        res.json({
            message: 'Password changed successfully',
            success: true,
        });
    }
    catch (error) {
        logger_1.logger.error('Password change error', { error });
        res.status(500).json({ error: 'Password change failed' });
    }
});
/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', authLimiter, [(0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required')], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Find user
        const user = await userRepo.findOne({ where: { email } });
        // Security: Always return success even if user not found (prevent user enumeration)
        if (!user) {
            return res.json({
                message: 'If an account exists with that email, a password reset link has been sent.',
                success: true,
            });
        }
        // Generate secure random token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        // Set token expiry (1 hour from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);
        // Save token to database
        user.reset_token = hashedToken;
        user.reset_token_expires = expiryDate;
        await userRepo.save(user);
        // Send email with reset link
        try {
            await email_service_1.default.sendPasswordResetEmail(user.email, user.name, resetToken);
            logger_1.logger.info('Password reset email sent', { email: user.email });
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send password reset email', { email: user.email, error: emailError.message });
            // Don't expose email sending failure to user
        }
        res.json({
            message: 'If an account exists with that email, a password reset link has been sent.',
            success: true,
        });
    }
    catch (error) {
        logger_1.logger.error('Forgot password error', { error });
        res.status(500).json({ error: 'Password reset request failed' });
    }
});
/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', authLimiter, [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
    (0, express_validator_1.body)('newPassword').custom(passwordComplexityValidator),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => e.msg).join(', ');
            return res.status(400).json({ error: errorMessages });
        }
        const { token, newPassword } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Hash the token to compare with database
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        // Find user with valid token
        const user = await userRepo
            .createQueryBuilder('user')
            .where('user.reset_token = :token', { token: hashedToken })
            .andWhere('user.reset_token_expires > :now', { now: new Date() })
            .getOne();
        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }
        // Hash new password
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password and clear reset token
        user.password_hash = newPasswordHash;
        user.reset_token = undefined;
        user.reset_token_expires = undefined;
        await userRepo.save(user);
        // Send confirmation email
        try {
            await email_service_1.default.sendPasswordResetConfirmation(user.email, user.name);
            logger_1.logger.info('Password reset confirmation sent', { email: user.email });
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send confirmation email', { email: user.email, error: emailError.message });
            // Don't fail the reset if email fails
        }
        res.json({
            message: 'Password reset successful. You can now log in with your new password.',
            success: true,
        });
    }
    catch (error) {
        logger_1.logger.error('Password reset error', { error });
        res.status(500).json({ error: 'Password reset failed' });
    }
});
/**
 * POST /api/auth/verify-reset-token
 * Verify if reset token is valid
 */
router.post('/verify-reset-token', [(0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required')], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { token } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Hash the token
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        // Check if token exists and is not expired
        const user = await userRepo
            .createQueryBuilder('user')
            .where('user.reset_token = :token', { token: hashedToken })
            .andWhere('user.reset_token_expires > :now', { now: new Date() })
            .getOne();
        if (!user) {
            return res.status(400).json({
                valid: false,
                error: 'Invalid or expired reset token'
            });
        }
        res.json({
            valid: true,
            email: user.email,
        });
    }
    catch (error) {
        logger_1.logger.error('Token verification error', { error });
        res.status(500).json({ error: 'Token verification failed' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map