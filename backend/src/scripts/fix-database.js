// Standalone script to fix missing columns
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
    console.log(`✓ Column ${columnName} already exists`);
    return;
  }

  try {
    await AppDataSource.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`✓ Added ${columnName} column`);
  } catch (e) {
    console.error(`✗ Error adding ${columnName}:`, e.message);
  }
}

async function fixDatabase() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!\n');

    // Add missing columns to users table
    await addColumn('users', 'is_active', 'BOOLEAN DEFAULT TRUE');
    await addColumn('users', 'reset_token', 'VARCHAR(255) NULL');
    await addColumn('users', 'reset_token_expires', 'TIMESTAMP NULL');
    await addColumn('users', 'temp_password_expires', 'TIMESTAMP NULL');
    await addColumn('users', 'is_temp_password', 'BOOLEAN DEFAULT FALSE');

    console.log('\n✅ Database schema updated successfully!');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDatabase();
