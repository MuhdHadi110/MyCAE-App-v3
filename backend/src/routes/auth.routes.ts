import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { generateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { verifyRecaptcha } from '../utils/recaptcha';

const router = Router();

/**
 * Password complexity validation
 * Requires: min 12 chars, uppercase, lowercase, number, special char
 */
const passwordComplexityValidator = (value: string) => {
  const minLength = 12;
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
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').custom(passwordComplexityValidator),
    body('role').optional().isIn(Object.values(UserRole)),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role, department, position } = req.body;
      const userRepo = AppDataSource.getRepository(User);

      // Check if user already exists
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const user = userRepo.create({
        name,
        email,
        password_hash,
        role: (role || UserRole.ENGINEER) as UserRole,
        department,
        position,
      });

      await userRepo.save(user);

      // Generate token
      const token = generateToken(user.id, user.email, user.name, user.role);

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
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('captchaToken').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      // Security: Don't log email addresses - use anonymized identifier
      console.log('🔐 Login attempt received');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors in login request');
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, captchaToken } = req.body;

      // Verify reCAPTCHA if token is provided
      if (captchaToken) {
        const remoteIp = req.ip || req.connection.remoteAddress;
        const isValidCaptcha = await verifyRecaptcha(captchaToken, remoteIp);

        if (!isValidCaptcha) {
          return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
        }
      }

      const userRepo = AppDataSource.getRepository(User);

      // Find user - use constant-time comparison to prevent timing attacks
      const user = await userRepo.findOne({ where: { email } });

      // Security: Always run password check to prevent timing-based user enumeration
      const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV';
      const hashToCheck = user ? user.password_hash : dummyHash;
      const isValidPassword = await bcrypt.compare(password, hashToCheck);

      if (!user || !isValidPassword) {
        console.log('❌ Failed login attempt');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log('✅ Login successful');

      // Check if this is first-time login (password is still the default temp password)
      const isFirstTimeLogin = await bcrypt.compare('TempPassword123!', user.password_hash);

      // Generate token
      const token = generateToken(user.id, user.email, user.name, user.role);

      res.json({
        message: 'Login successful',
        token,
        isFirstTimeLogin,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          avatar: user.avatar,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('currentPassword').optional().isString(),
    body('newPassword').custom(passwordComplexityValidator),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(e => e.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
      }

      const { email, currentPassword, newPassword } = req.body;
      const userRepo = AppDataSource.getRepository(User);

      // Find user
      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Always require current password for security
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password_hash = newPasswordHash;
      await userRepo.save(user);

      res.json({
        message: 'Password changed successfully',
        success: true,
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  }
);

export default router;
