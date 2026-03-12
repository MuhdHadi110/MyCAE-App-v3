import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function fixColumnNames() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('Checking and fixing research_timesheets column names...');
    
    // Check if table exists
    const hasTable = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'research_timesheets'`
    );
    
    if (hasTable[0].count === 0) {
      console.log('❌ research_timesheets table does not exist');
      await AppDataSource.destroy();
      process.exit(1);
    }
    
    // Get current columns
    const columns = await AppDataSource.query(
      `SELECT COLUMN_NAME FROM information_schema.columns 
       WHERE table_schema = DATABASE() AND table_name = 'research_timesheets'`
    );
    
    const columnNames = columns.map((c: any) => c.COLUMN_NAME);
    console.log('Current columns:', columnNames);
    
    // Rename columns if needed
    if (columnNames.includes('projectId')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets CHANGE projectId research_project_id VARCHAR(36) NOT NULL`);
      console.log('✅ Renamed projectId to research_project_id');
    }
    
    if (columnNames.includes('teamMemberId')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets CHANGE teamMemberId engineer_id VARCHAR(36) NOT NULL`);
      console.log('✅ Renamed teamMemberId to engineer_id');
    }
    
    if (columnNames.includes('hoursLogged')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets CHANGE hoursLogged hours DECIMAL(5,2) NOT NULL`);
      console.log('✅ Renamed hoursLogged to hours');
    }
    
    if (columnNames.includes('researchCategory')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets CHANGE researchCategory research_category VARCHAR(100) NULL`);
      console.log('✅ Renamed researchCategory to research_category');
    }
    
    if (columnNames.includes('createdDate')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets CHANGE createdDate created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('✅ Renamed createdDate to created_at');
    }
    
    // Drop unnecessary columns
    if (columnNames.includes('teamMemberName')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets DROP COLUMN teamMemberName`);
      console.log('✅ Dropped teamMemberName column');
    }
    
    if (columnNames.includes('approvedBy')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets DROP COLUMN approvedBy`);
      console.log('✅ Dropped approvedBy column');
    }
    
    if (columnNames.includes('approvalDate')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets DROP COLUMN approvalDate`);
      console.log('✅ Dropped approvalDate column');
    }
    
    // Add updated_at column if not exists
    if (!columnNames.includes('updated_at')) {
      await AppDataSource.query(`ALTER TABLE research_timesheets ADD COLUMN updated_at DATETIME NULL`);
      console.log('✅ Added updated_at column');
    }
    
    // Make description nullable if not already
    const descColumn = columns.find((c: any) => c.COLUMN_NAME === 'description');
    if (descColumn && descColumn.IS_NULLABLE === 'NO') {
      await AppDataSource.query(`ALTER TABLE research_timesheets MODIFY description TEXT NULL`);
      console.log('✅ Made description nullable');
    }
    
    console.log('✅ Column names fixed successfully');

    await AppDataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixColumnNames();
