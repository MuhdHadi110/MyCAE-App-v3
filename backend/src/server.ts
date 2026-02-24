import 'reflect-metadata';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import inventoryRoutes from './routes/inventory.routes';
import timesheetRoutes from './routes/timesheet.routes';
import checkoutRoutes from './routes/checkout.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import activityRoutes from './routes/activity.routes';
import clientRoutes from './routes/client.routes';
import teamRoutes from './routes/team.routes';
import computerRoutes from './routes/computer.routes';
import researchRoutes from './routes/research.routes';
import usersRoutes from './routes/users.routes';
import projectHourlyRateRoutes from './routes/projectHourlyRate.routes';
import purchaseOrderRoutes from './routes/purchaseOrder.routes';
import invoiceRoutes from './routes/invoice.routes';
import issuedPORoutes from './routes/issuedPO.routes';
import categoryRoutes from './routes/category.routes';
import exchangeRateRoutes from './routes/exchangeRate.routes';
import companySettingsRoutes from './routes/companySettings.routes';
import scheduledMaintenanceRoutes from './routes/scheduledMaintenance.routes';
import projectTeamRoutes from './routes/projectTeam.routes';
import companyRoutes from './routes/company.routes';
import contactRoutes from './routes/contact.routes';
import receivedInvoiceRoutes from './routes/receivedInvoice.routes';
import healthRoutes from './routes/health.routes';
import { startExchangeRateScheduler, stopExchangeRateScheduler } from './services/exchangeRateScheduler.service';
import { startMaintenanceReminderScheduler, stopMaintenanceReminderScheduler } from './services/maintenanceReminderScheduler.service';
import { AppDataSource } from './config/database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Validate required environment variables in production
const validateProductionEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  const requiredVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'CORS_ORIGINS',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    logger.error('FATAL: Missing required environment variables in production', { missing });
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    logger.error('FATAL: JWT_SECRET must be at least 32 characters long for security', { length: jwtSecret.length });
    process.exit(1);
  }

  // Warn about optional but recommended vars
  const recommended = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SUPPORT_EMAIL', 'RECAPTCHA_SECRET_KEY'];
  const missingRecommended = recommended.filter(v => !process.env[v]);
  if (missingRecommended.length > 0) {
    logger.warn('Missing recommended environment variables', { missing: missingRecommended });
  }
};

validateProductionEnv();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware with security limits
app.use(express.json({ limit: '10kb' })); // Limit JSON body to 10KB to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS configuration - use environment variable or localhost-only for development
const getAllowedOrigins = (): string[] => {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, CORS_ORIGINS is required
  if (isProduction) {
    if (!process.env.CORS_ORIGINS) {
      logger.error('FATAL: CORS_ORIGINS environment variable is required in production');
      process.exit(1);
    }
    return process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  }

  // Check for environment variable first (comma-separated list)
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  }

  // Development-only: localhost origins (no network IPs for security)
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);

    // Only allow explicitly whitelisted origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet());

// Rate limiting - strict for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
});

// Rate limiting - normal for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // increased from 100 to 200 requests per minute
  message: 'Too many requests from this IP, please try again later.',
});

// Serve static files (for uploaded PO files) - no rate limiting
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check routes (no rate limiting, no auth)
app.use('/api/health', healthRoutes);

// API Routes with appropriate rate limiting

app.use('/api/auth', authLimiter, authRoutes); // Apply strict rate limiting to auth routes
app.use('/api/', apiLimiter); // Apply to all other API routes
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/projects', projectTeamRoutes); // Project team management routes - MUST be before projectRoutes
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/computers', computerRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/project-hourly-rates', projectHourlyRateRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/issued-pos', issuedPORoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/company-settings', companySettingsRoutes);
app.use('/api/scheduled-maintenance', scheduledMaintenanceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/received-invoices', receivedInvoiceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, path: req.path });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Start exchange rate scheduler (auto-imports rates daily at 5 PM MYT)
    startExchangeRateScheduler();

    // Start maintenance reminder scheduler (sends reminders daily at 8 AM MYT)
    startMaintenanceReminderScheduler();

    // Start server and store reference for graceful shutdown
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        database: 'MySQL',
        healthCheck: '/api/health'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Store server instance for graceful shutdown
let server: http.Server | null = null;

/**
 * Graceful shutdown handler
 * Properly closes all connections and stops schedulers
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received: Starting graceful shutdown...`);

  // Set a timeout for force exit
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds timeout

  try {
    // 1. Stop accepting new connections
    if (server) {
      logger.info('Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        server!.close((err: Error | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    // 2. Stop scheduled tasks
    logger.info('Stopping scheduled tasks...');
    stopExchangeRateScheduler();
    stopMaintenanceReminderScheduler();

    // 3. Close database connections
    if (AppDataSource.isInitialized) {
      logger.info('Closing database connections...');
      await AppDataSource.destroy();
      logger.info('Database connections closed');
    }

    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason });
});

// Start the server
startServer();

export default app;

//


 
