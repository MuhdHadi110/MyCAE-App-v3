const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mycae_tracker',
    });

    const [users] = await connection.execute('SELECT id, name, email, role FROM users');
    console.log('\n📋 All Users in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach(user => {
      console.log(`  ${user.name.padEnd(20)} | ${user.email.padEnd(25)} | Role: ${user.role}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
