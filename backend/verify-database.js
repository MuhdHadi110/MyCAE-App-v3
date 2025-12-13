const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mycae_tracker',
    });

    console.log('✅ Database connection successful');

    // Check if clients table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients'
    `, [process.env.DB_NAME]);

    if (tables.length === 0) {
      console.log('❌ Clients table does not exist!');
    } else {
      console.log('✅ Clients table exists');

      // Get table structure
      const [columns] = await connection.execute(`
        DESCRIBE clients
      `);

      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'nullable'}`);
      });

      // Count clients
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM clients');
      console.log(`\n✅ Total clients: ${count[0].total}`);

      // Show sample
      if (count[0].total > 0) {
        const [samples] = await connection.execute('SELECT id, name, email, status FROM clients LIMIT 3');
        console.log('\nSample clients:');
        samples.forEach(client => {
          console.log(`  - ${client.name} (${client.status}) - ${client.email}`);
        });
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

verifyDatabase();
