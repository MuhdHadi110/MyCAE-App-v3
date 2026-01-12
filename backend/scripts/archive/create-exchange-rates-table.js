const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mycae_tracker',
  });

  try {
    // Check if table exists
    const [rows] = await connection.query(
      "SHOW TABLES LIKE 'exchange_rates'"
    );

    if (rows.length === 0) {
      console.log('Creating exchange_rates table...');
      await connection.query(`
        CREATE TABLE exchange_rates (
          id VARCHAR(36) PRIMARY KEY,
          fromCurrency VARCHAR(3) NOT NULL,
          toCurrency VARCHAR(3) NOT NULL DEFAULT 'MYR',
          rate DECIMAL(10, 6) NOT NULL,
          effectiveDate DATE NOT NULL,
          source ENUM('manual', 'api') NOT NULL DEFAULT 'manual',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ exchange_rates table created successfully!');
    } else {
      console.log('✅ exchange_rates table already exists');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

createTable();
