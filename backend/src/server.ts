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
import companyRoutes from './routes/company.routes';
import contactRoutes from './routes/contact.routes';
import receivedInvoiceRoutes from './routes/receivedInvoice.routes';
import healthRoutes from './routes/health.routes';
import { startExchangeRateScheduler, stopExchangeRateScheduler } from './services/exchangeRateScheduler.service';
import { startMaintenanceReminderScheduler, stopMaintenanceReminderScheduler } from './services/maintenanceReminderScheduler.service';
import { AppDataSource } from './config/database';

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
    console.error('FATAL: Missing required environment variables in production:');
    missing.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  // Warn about optional but recommended vars
  const recommended = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'RECAPTCHA_SECRET_KEY'];
  const missingRecommended = recommended.filter(v => !process.env[v]);
  if (missingRecommended.length > 0) {
    console.warn('WARNING: Missing recommended environment variables:');
    missingRecommended.forEach(v => console.warn(`  - ${v}`));
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
      console.error('FATAL: CORS_ORIGINS environment variable is required in production');
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

app.use('/api/auth', authRoutes);
app.use('/api/', apiLimiter); // Apply to all other API routes
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/checkouts', checkoutRoutes);
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
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Start exchange rate scheduler (auto-imports rates daily at 5 PM MYT)
    startExchangeRateScheduler();

    // Start maintenance reminder scheduler (sends reminders daily at 8 AM MYT)
    startMaintenanceReminderScheduler();

    // Start server and store reference for graceful shutdown
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 MyCAE Equipment Tracker API Server              ║
║                                                       ║
║   Server running on: http://localhost:${PORT}       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Database: MySQL                                     ║
║   Health check: /api/health                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
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
  console.log(`\n${signal} received: Starting graceful shutdown...`);

  // Set a timeout for force exit
  const forceExitTimeout = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds timeout

  try {
    // 1. Stop accepting new connections
    if (server) {
      console.log('Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        server!.close((err: Error | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('HTTP server closed');
    }

    // 2. Stop scheduled tasks
    console.log('Stopping scheduled tasks...');
    stopExchangeRateScheduler();
    stopMaintenanceReminderScheduler();

    // 3. Close database connections
    if (AppDataSource.isInitialized) {
      console.log('Closing database connections...');
      await AppDataSource.destroy();
      console.log('Database connections closed');
    }

    clearTimeout(forceExitTimeout);
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export default app;

//


 
