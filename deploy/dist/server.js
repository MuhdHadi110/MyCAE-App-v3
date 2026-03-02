"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const timesheet_routes_1 = __importDefault(require("./routes/timesheet.routes"));
const checkout_routes_1 = __importDefault(require("./routes/checkout.routes"));
const maintenance_routes_1 = __importDefault(require("./routes/maintenance.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const computer_routes_1 = __importDefault(require("./routes/computer.routes"));
const research_routes_1 = __importDefault(require("./routes/research.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const projectHourlyRate_routes_1 = __importDefault(require("./routes/projectHourlyRate.routes"));
const purchaseOrder_routes_1 = __importDefault(require("./routes/purchaseOrder.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const issuedPO_routes_1 = __importDefault(require("./routes/issuedPO.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const exchangeRate_routes_1 = __importDefault(require("./routes/exchangeRate.routes"));
const companySettings_routes_1 = __importDefault(require("./routes/companySettings.routes"));
const scheduledMaintenance_routes_1 = __importDefault(require("./routes/scheduledMaintenance.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const receivedInvoice_routes_1 = __importDefault(require("./routes/receivedInvoice.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const exchangeRateScheduler_service_1 = require("./services/exchangeRateScheduler.service");
const maintenanceReminderScheduler_service_1 = require("./services/maintenanceReminderScheduler.service");
const database_2 = require("./config/database");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables in production
const validateProductionEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction)
        return;
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
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Middleware with security limits
app.use(express_1.default.json({ limit: '10kb' })); // Limit JSON body to 10KB to prevent DoS
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// CORS configuration - use environment variable or localhost-only for development
const getAllowedOrigins = () => {
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
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin)
            return callback(null, true);
        // Only allow explicitly whitelisted origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, helmet_1.default)());
// Rate limiting - strict for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later',
});
// Rate limiting - normal for API endpoints
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // increased from 100 to 200 requests per minute
    message: 'Too many requests from this IP, please try again later.',
});
// Serve static files (for uploaded PO files) - no rate limiting
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check routes (no rate limiting, no auth)
app.use('/api/health', health_routes_1.default);
// API Routes with appropriate rate limiting
app.use('/api/auth', auth_routes_1.default);
app.use('/api/', apiLimiter); // Apply to all other API routes
app.use('/api/users', users_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/checkouts', checkout_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/timesheets', timesheet_routes_1.default);
app.use('/api/maintenance', maintenance_routes_1.default);
app.use('/api/activity', activity_routes_1.default);
app.use('/api/clients', client_routes_1.default);
app.use('/api/team', team_routes_1.default);
app.use('/api/computers', computer_routes_1.default);
app.use('/api/research', research_routes_1.default);
app.use('/api/project-hourly-rates', projectHourlyRate_routes_1.default);
app.use('/api/purchase-orders', purchaseOrder_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/issued-pos', issuedPO_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/exchange-rates', exchangeRate_routes_1.default);
app.use('/api/company-settings', companySettings_routes_1.default);
app.use('/api/scheduled-maintenance', scheduledMaintenance_routes_1.default);
app.use('/api/companies', company_routes_1.default);
app.use('/api/contacts', contact_routes_1.default);
app.use('/api/received-invoices', receivedInvoice_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database connection
        await (0, database_1.initializeDatabase)();
        console.log('✅ Database initialized successfully');
        // Start exchange rate scheduler (auto-imports rates daily at 5 PM MYT)
        (0, exchangeRateScheduler_service_1.startExchangeRateScheduler)();
        // Start maintenance reminder scheduler (sends reminders daily at 8 AM MYT)
        (0, maintenanceReminderScheduler_service_1.startMaintenanceReminderScheduler)();
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
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Store server instance for graceful shutdown
let server = null;
/**
 * Graceful shutdown handler
 * Properly closes all connections and stops schedulers
 */
const gracefulShutdown = async (signal) => {
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
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            console.log('HTTP server closed');
        }
        // 2. Stop scheduled tasks
        console.log('Stopping scheduled tasks...');
        (0, exchangeRateScheduler_service_1.stopExchangeRateScheduler)();
        (0, maintenanceReminderScheduler_service_1.stopMaintenanceReminderScheduler)();
        // 3. Close database connections
        if (database_2.AppDataSource.isInitialized) {
            console.log('Closing database connections...');
            await database_2.AppDataSource.destroy();
            console.log('Database connections closed');
        }
        clearTimeout(forceExitTimeout);
        console.log('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
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
exports.default = app;
//
//# sourceMappingURL=server.js.map