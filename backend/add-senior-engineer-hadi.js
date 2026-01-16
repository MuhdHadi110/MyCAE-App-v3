const mysql = require('mysql2/promise');

async function addSeniorEngineerToHadi() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    const email = 'hadi@mycae.com.my';
    const newRoles = '["admin","senior-engineer"]';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Adding Senior Engineer Role to Hadi');
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

    // Update roles to include both admin and senior-engineer
    const [result] = await connection.execute(
      'UPDATE users SET roles = ? WHERE email = ?',
      [newRoles, email]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Role updated successfully!');
      console.log(`\n📌 New Details:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   New Role: ${newRoles}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ Hadi now has both admin and senior-engineer roles!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ Failed to update role');
    }

  } finally {
    await connection.end();
  }
}

addSeniorEngineerToHadi().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
