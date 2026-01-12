import 'reflect-metadata';
import express from 'express';
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
import { startExchangeRateScheduler } from './services/exchangeRateScheduler.service';
import { startMaintenanceReminderScheduler } from './services/maintenanceReminderScheduler.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware with security limits
app.use(express.json({ limit: '10kb' })); // Limit JSON body to 10KB to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS configuration - use environment variable or explicit whitelist
const getAllowedOrigins = (): string[] => {
  // Check for environment variable first (comma-separated list)
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  }

  // Default allowed origins (explicit whitelist, no wildcards)
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.100.3:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://192.168.100.3:3001',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://192.168.100.3:3003',
    'http://localhost:3005',
    'http://127.0.0.1:3005',
    'http://192.168.100.3:3005',
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
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - normal for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static files (for uploaded PO files) - no rate limiting
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 MyCAE Equipment Tracker API Server              ║
║                                                       ║
║   Server running on: http://localhost:${PORT}       ║
║   Network access: http://192.168.100.3:${PORT}      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Database: MySQL                                     ║
║   Automation: n8n Integration Enabled                ║
║                                                       ║
║   API Endpoints:                                      ║
║   • POST /api/auth/register                           ║
║   • POST /api/auth/login                              ║
║   • GET  /api/inventory                               ║
║   • POST /api/inventory                               ║
║   • GET  /health                                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

//


 
