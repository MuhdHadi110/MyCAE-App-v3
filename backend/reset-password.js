const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const tempPassword = 'Welcome@123456';

async function resetPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    // First, list all tables to find the user table
    const [tables] = await connection.execute("SHOW TABLES");
    console.log('Available tables:', tables);

    // Hash the temporary password
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Try to find the correct table name
    let tableFound = false;
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      if (tableName.toLowerCase().includes('user')) {
        console.log(`Found user table: ${tableName}`);
        
        const [result] = await connection.execute(
          `UPDATE \`${tableName}\` SET password_hash = ? WHERE email = ?`,
          [passwordHash, 'hadi@mycae.com.my']
        );

        if (result.affectedRows === 0) {
          console.log('❌ User not found: hadi@mycae.com.my');
        } else {
          console.log('✅ Password reset successful!');
          console.log('\n📧 Login Credentials:');
          console.log('   Email: hadi@mycae.com.my');
          console.log(`   Password: ${tempPassword}`);
          console.log('\n⚠️  Please change this password after first login.');
        }
        tableFound = true;
        break;
      }
    }

    if (!tableFound) {
      console.log('❌ No user table found in database');
    }
  } finally {
    await connection.end();
  }
}

resetPassword().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
