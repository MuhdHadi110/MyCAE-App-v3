const mysql = require('mysql2/promise');
require('dotenv').config();

async function addWebsiteColumn() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mycae_tracker',
    });

    console.log('✅ Database connection successful');

    // Check if website column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'clients' AND COLUMN_NAME = 'website' AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    if (columns.length > 0) {
      console.log('✅ Website column already exists');
    } else {
      console.log('❌ Website column missing, adding it...');

      // Add website column
      await connection.execute(`
        ALTER TABLE clients ADD COLUMN website varchar(255) NULL
      `);

      console.log('✅ Website column added successfully');
    }

    // Verify it exists now
    const [verify] = await connection.execute(`
      DESCRIBE clients
    `);

    console.log('\nUpdated table structure (website field):');
    const websiteCol = verify.find(col => col.Field === 'website');
    if (websiteCol) {
      console.log(`  ✅ website: ${websiteCol.Type} ${websiteCol.Null === 'NO' ? 'NOT NULL' : 'nullable'}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Website column already exists');
    }
  }
}

addWebsiteColumn();
