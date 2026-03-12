// Comprehensive Database Schema Fix Script
const { DataSource } = require('typeorm');
const dotenv = require('dotenv');

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [],
});

async function tableExists(tableName) {
  const result = await AppDataSource.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = ?`,
    [tableName]
  );
  return result.length > 0;
}

async function columnExists(tableName, columnName) {
  const result = await AppDataSource.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = ? 
     AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return result.length > 0;
}

async function addColumn(tableName, columnName, definition) {
  const exists = await columnExists(tableName, columnName);
  if (exists) {
    console.log(`  ✓ ${tableName}.${columnName} exists`);
    return false;
  }

  try {
    await AppDataSource.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`  ✓ Added ${tableName}.${columnName}`);
    return true;
  } catch (e) {
    console.error(`  ✗ Error adding ${tableName}.${columnName}:`, e.message);
    return false;
  }
}

async function createAuditLogsTable() {
  const exists = await tableExists('audit_logs');
  if (exists) {
    console.log('✓ audit_logs table exists');
    return;
  }

  try {
    await AppDataSource.query(`
      CREATE TABLE audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        action ENUM('create', 'update', 'delete', 'view', 'export', 'approve', 'reject') NOT NULL,
        entity_type ENUM('invoice', 'issued_po', 'received_po', 'project', 'payment', 'exchange_rate') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NULL,
        user_name VARCHAR(255) NULL,
        user_email VARCHAR(255) NULL,
        description TEXT NULL,
        changes JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_user (user_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created audit_logs table');
  } catch (e) {
    console.error('✗ Error creating audit_logs table:', e.message);
  }
}

async function insertDefaultCompanySettings() {
  try {
    const exists = await tableExists('company_settings');
    if (!exists) {
      console.log('✗ company_settings table does not exist');
      return;
    }

    const result = await AppDataSource.query('SELECT COUNT(*) as count FROM company_settings');
    if (result[0].count > 0) {
      console.log('✓ Company settings already exist');
      return;
    }

    await AppDataSource.query(`
      INSERT INTO company_settings (
        id, company_name, registration_number, address, phone, email, 
        primary_color, header_position, logo_size, show_sst_id, show_bank_details, page_margin
      ) VALUES (
        UUID(), 'MyCAE Technologies', '', '', '', '',
        '#2563eb', 'top-center', 'medium', true, true, 50
      )
    `);
    console.log('✓ Inserted default company settings');
  } catch (e) {
    console.error('✗ Error inserting company settings:', e.message);
  }
}

async function fixAllTables() {
  console.log('\n🔍 Checking and fixing database schema...\n');
  
  // Create missing tables
  console.log('📋 Creating missing tables...');
  await createAuditLogsTable();
  
  // Check and add missing columns to all tables
  console.log('\n📋 Checking users table...');
  await addColumn('users', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumn('users', 'reset_token', 'VARCHAR(255) NULL');
  await addColumn('users', 'reset_token_expires', 'TIMESTAMP NULL');
  await addColumn('users', 'temp_password_expires', 'TIMESTAMP NULL');
  await addColumn('users', 'is_temp_password', 'BOOLEAN DEFAULT FALSE');
  
  console.log('\n📋 Checking team_members table...');
  await addColumn('team_members', 'employee_id', 'VARCHAR(100) NULL');
  await addColumn('team_members', 'employment_type', "ENUM('full-time','part-time','contract','intern') DEFAULT 'full-time'");
  await addColumn('team_members', 'job_title', 'VARCHAR(255) NULL');
  await addColumn('team_members', 'manager_id', 'VARCHAR(100) NULL');
  await addColumn('team_members', 'office_location', 'VARCHAR(255) NULL');
  await addColumn('team_members', 'hire_date', 'DATETIME NULL');
  await addColumn('team_members', 'termination_date', 'DATETIME NULL');
  await addColumn('team_members', 'hourly_rate', 'DECIMAL(10,2) NULL');
  await addColumn('team_members', 'skills', 'TEXT NULL');
  await addColumn('team_members', 'certifications', 'TEXT NULL');
  await addColumn('team_members', 'notes', 'TEXT NULL');
  
  console.log('\n📋 Checking projects table...');
  await addColumn('projects', 'billing_type', "ENUM('hourly','lump_sum') DEFAULT 'hourly'");
  await addColumn('projects', 'hourly_rate', 'DECIMAL(10,2) NULL');
  await addColumn('projects', 'is_structure_container', 'BOOLEAN DEFAULT FALSE');
  
  console.log('\n📋 Checking inventory_items table...');
  await addColumn('inventory_items', 'last_calibrated', 'DATETIME NULL');
  
  console.log('\n📋 Checking checkouts table...');
  await addColumn('checkouts', 'received_at', 'DATETIME NULL');
  await addColumn('checkouts', 'received_by', 'VARCHAR(36) NULL');
  await addColumn('checkouts', 'received_condition', "ENUM('excellent','good','fair','damaged','incomplete') NULL");
  await addColumn('checkouts', 'received_notes', 'TEXT NULL');
  
  console.log('\n📋 Checking invoices table...');
  await addColumn('invoices', 'file_url', 'VARCHAR(500) NULL');
  await addColumn('invoices', 'company_id', 'VARCHAR(36) NULL');
  await addColumn('invoices', 'approved_by', 'VARCHAR(36) NULL');
  await addColumn('invoices', 'approved_at', 'DATETIME NULL');
  await addColumn('invoices', 'approval_status', "ENUM('pending','approved','rejected') DEFAULT 'pending'");
  
  console.log('\n📋 Checking issued_pos table...');
  await addColumn('issued_pos', 'file_url', 'VARCHAR(500) NULL');
  await addColumn('issued_pos', 'company_id', 'VARCHAR(36) NULL');
  
  console.log('\n📋 Checking timesheets table...');
  await addColumn('timesheets', 'work_category', "ENUM('standard','overtime','weekend','holiday') DEFAULT 'standard'");
  
  console.log('\n📋 Checking exchange_rates table...');
  await addColumn('exchange_rates', 'source', 'VARCHAR(50) DEFAULT "manual"');
  await addColumn('exchange_rates', 'last_updated', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  
  // Insert default data
  console.log('\n📋 Inserting default data...');
  await insertDefaultCompanySettings();
  
  console.log('\n✅ Database schema check complete!');
}

async function main() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!\n');
    
    await fixAllTables();
    
    await AppDataSource.destroy();
    console.log('\n🎉 All fixes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
