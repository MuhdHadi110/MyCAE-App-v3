const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    // Get the user
    const [users] = await connection.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      ['hadi@mycae.com.my']
    );

    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log('✅ User found:', user.email);
    console.log('Password hash stored:', user.password_hash.substring(0, 20) + '...');

    // Test if password matches
    const testPassword = 'Welcome@123456';
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log('\n🔐 Password verification: ' + (isMatch ? '✅ MATCH' : '❌ NO MATCH'));

    // Also test the temp password in case it was reset
    const isTempMatch = await bcrypt.compare('TempPassword123!', user.password_hash);
    console.log('🔐 Temp password verification: ' + (isTempMatch ? '✅ MATCH' : '❌ NO MATCH'));

  } finally {
    await connection.end();
  }
}

verifyPassword().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
