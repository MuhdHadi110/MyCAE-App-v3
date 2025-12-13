import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

// Import all entities explicitly for TypeORM to recognize them
import { Activity } from '../entities/Activity';
import { Checkout } from '../entities/Checkout';
import { Client } from '../entities/Client';
import { Computer } from '../entities/Computer';
import { InventoryItem } from '../entities/InventoryItem';
import { Invoice } from '../entities/Invoice';
import { IssuedPO } from '../entities/IssuedPO';
import { MaintenanceTicket } from '../entities/MaintenanceTicket';
import { Project } from '../entities/Project';
import { ProjectHourlyRate } from '../entities/ProjectHourlyRate';
import { PurchaseOrder } from '../entities/PurchaseOrder';
import { ResearchProject } from '../entities/ResearchProject';
import { TeamMember } from '../entities/TeamMember';
import { Timesheet } from '../entities/Timesheet';
import { User } from '../entities/User';

dotenv.config();

const entities = [
  Activity,
  Checkout,
  Client,
  Computer,
  InventoryItem,
  Invoice,
  IssuedPO,
  MaintenanceTicket,
  Project,
  ProjectHourlyRate,
  PurchaseOrder,
  ResearchProject,
  TeamMember,
  Timesheet,
  User,
];

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');

    // Run pending migrations
    try {
      console.log('Running pending migrations...');
      await AppDataSource.runMigrations();
      console.log('✅ Migrations completed successfully');
    } catch (migrationError) {
      console.warn('⚠️ Migration check/run note:', (migrationError as any).message);
    }

    return AppDataSource;
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    throw error;
  }
};
