import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function createResearchTables() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Create research_projects table
    console.log('Creating research_projects table...');
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS research_projects (
        id VARCHAR(36) PRIMARY KEY,
        research_code VARCHAR(50) NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(20) DEFAULT 'planning',
        start_date DATETIME NULL,
        planned_end_date DATETIME NULL,
        actual_end_date DATETIME NULL,
        lead_researcher_id VARCHAR(36) NULL,
        budget DECIMAL(10,2) NULL,
        funding_source VARCHAR(255) NULL,
        category VARCHAR(100) NULL,
        objectives TEXT NULL,
        methodology TEXT NULL,
        findings TEXT NULL,
        publications TEXT NULL,
        team_members TEXT NULL,
        collaborators TEXT NULL,
        equipment_used TEXT NULL,
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ research_projects table created');

    // Create research_timesheets table
    console.log('Creating research_timesheets table...');
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS research_timesheets (
        id VARCHAR(36) PRIMARY KEY,
        research_project_id VARCHAR(36) NOT NULL,
        engineer_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        hours DECIMAL(5,2) NOT NULL,
        description TEXT NULL,
        research_category VARCHAR(100) NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL,
        INDEX idx_research_project_id (research_project_id),
        INDEX idx_engineer_id (engineer_id),
        INDEX idx_date (date)
      )
    `);
    console.log('✅ research_timesheets table created');

    await AppDataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createResearchTables();
