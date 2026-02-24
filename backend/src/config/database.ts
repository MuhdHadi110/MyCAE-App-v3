import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Import all entities explicitly for TypeORM to recognize them
import { Activity } from '../entities/Activity';
import { Checkout } from '../entities/Checkout';
import { Client } from '../entities/Client';
import { Company } from '../entities/Company';
import { CompanySettings } from '../entities/CompanySettings';
import { Computer } from '../entities/Computer';
import { Contact } from '../entities/Contact';
import { ExchangeRate } from '../entities/ExchangeRate';
import { InventoryItem } from '../entities/InventoryItem';
import { Invoice } from '../entities/Invoice';
import { IssuedPO } from '../entities/IssuedPO';
import { MaintenanceTicket } from '../entities/MaintenanceTicket';
import { ReceivedInvoice } from '../entities/ReceivedInvoice';
import { Project } from '../entities/Project';
import { ProjectHourlyRate } from '../entities/ProjectHourlyRate';
import { ProjectTeamMember } from '../entities/ProjectTeamMember';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { ResearchProject } from '../entities/ResearchProject';
import { ScheduledMaintenance } from '../entities/ScheduledMaintenance';
import { TeamMember } from '../entities/TeamMember';
import { Timesheet } from '../entities/Timesheet';
import { User } from '../entities/User';

dotenv.config();

const entities = [
  Activity,
  Checkout,
  Client,
  Company,
  CompanySettings,
  Computer,
  Contact,
  ExchangeRate,
  InventoryItem,
  Invoice,
  IssuedPO,
  MaintenanceTicket,
  ReceivedInvoice,
  Project,
  ProjectHourlyRate,
  ProjectTeamMember,
  PurchaseOrder,
  ResearchProject,
  ScheduledMaintenance,
  TeamMember,
  Timesheet,
  User,
];

export const AppDataSource = new DataSource({
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

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');

    // Run pending migrations
    try {
      logger.info('Running pending migrations');
      await AppDataSource.runMigrations();
      logger.info('Migrations completed successfully');
    } catch (migrationError) {
      logger.warn('Migration check/run note', { error: (migrationError as any).message });
    }

    return AppDataSource;
  } catch (error) {
    logger.error('Error connecting to database', { error });
    throw error;
  }
};
