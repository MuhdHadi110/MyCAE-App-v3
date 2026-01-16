const mysql = require('mysql2/promise');

async function makeHadiAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    const email = 'hadi@mycae.com.my';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Updating Hadi\'s Role to Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check current role
    const [users] = await connection.execute(
      'SELECT id, name, email, roles FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ User not found: hadi@mycae.com.my');
      return;
    }

    const user = users[0];
    console.log(`📌 Current Details:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.roles}\n`);

    // Update roles to admin (JSON array format)
    const [result] = await connection.execute(
      'UPDATE users SET roles = ? WHERE email = ?',
      ['["admin"]', email]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Role updated successfully!');
      console.log(`\n📌 New Details:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   New Role: ["admin"]`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ Hadi now has admin privileges!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ Failed to update role');
    }

  } finally {
    await connection.end();
  }
}

makeHadiAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
