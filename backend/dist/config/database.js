"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
// Import all entities explicitly for TypeORM to recognize them
const Activity_1 = require("../entities/Activity");
const Checkout_1 = require("../entities/Checkout");
const Client_1 = require("../entities/Client");
const Company_1 = require("../entities/Company");
const CompanySettings_1 = require("../entities/CompanySettings");
const Computer_1 = require("../entities/Computer");
const Contact_1 = require("../entities/Contact");
const ExchangeRate_1 = require("../entities/ExchangeRate");
const InventoryItem_1 = require("../entities/InventoryItem");
const Invoice_1 = require("../entities/Invoice");
const IssuedPO_1 = require("../entities/IssuedPO");
const MaintenanceTicket_1 = require("../entities/MaintenanceTicket");
const ReceivedInvoice_1 = require("../entities/ReceivedInvoice");
const Project_1 = require("../entities/Project");
const ProjectHourlyRate_1 = require("../entities/ProjectHourlyRate");
const ProjectTeamMember_1 = require("../entities/ProjectTeamMember");
const PurchaseOrder_1 = require("../entities/PurchaseOrder");
const ResearchProject_1 = require("../entities/ResearchProject");
const ScheduledMaintenance_1 = require("../entities/ScheduledMaintenance");
const TeamMember_1 = require("../entities/TeamMember");
const Timesheet_1 = require("../entities/Timesheet");
const User_1 = require("../entities/User");
dotenv_1.default.config();
const entities = [
    Activity_1.Activity,
    Checkout_1.Checkout,
    Client_1.Client,
    Company_1.Company,
    CompanySettings_1.CompanySettings,
    Computer_1.Computer,
    Contact_1.Contact,
    ExchangeRate_1.ExchangeRate,
    InventoryItem_1.InventoryItem,
    Invoice_1.Invoice,
    IssuedPO_1.IssuedPO,
    MaintenanceTicket_1.MaintenanceTicket,
    ReceivedInvoice_1.ReceivedInvoice,
    Project_1.Project,
    ProjectHourlyRate_1.ProjectHourlyRate,
    ProjectTeamMember_1.ProjectTeamMember,
    PurchaseOrder_1.PurchaseOrder,
    ResearchProject_1.ResearchProject,
    ScheduledMaintenance_1.ScheduledMaintenance,
    TeamMember_1.TeamMember,
    Timesheet_1.Timesheet,
    User_1.User,
];
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    synchronize: false, // Disabled for performance
    logging: false, // Disabled for performance
    entities: entities,
    migrations: process.env.NODE_ENV === 'production'
        ? ['dist/migrations/**/*.js']
        : ['src/migrations/**/*.ts'],
    subscribers: [],
    charset: 'utf8mb4',
    timezone: 'Z',
    // Connection pooling configuration for production performance
    extra: {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
        queueLimit: 0, // Unlimited queue
        acquireTimeout: 60000, // 60 seconds
        timeout: 60000, // 60 seconds
        reconnect: true,
    },
});
const initializeDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        logger_1.logger.info('Database connection established successfully');
        // Run pending migrations
        try {
            logger_1.logger.info('Running pending migrations');
            await exports.AppDataSource.runMigrations();
            logger_1.logger.info('Migrations completed successfully');
        }
        catch (migrationError) {
            logger_1.logger.warn('Migration check/run note', { error: migrationError.message });
        }
        return exports.AppDataSource;
    }
    catch (error) {
        logger_1.logger.error('Error connecting to database', { error });
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=database.js.map