const mysql = require('mysql2/promise');

async function updateUserRole() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    const email = 'maqilazad@mycae.com.my';
    const newRole = '["engineer"]';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Updating Aqil\'s Role');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check current role
    const [users] = await connection.execute(
      'SELECT id, name, email, roles FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ User not found: maqilazad@mycae.com.my');
      return;
    }

    const user = users[0];
    console.log(`📌 Current Details:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.roles}\n`);

    // Update roles
    const [result] = await connection.execute(
      'UPDATE users SET roles = ? WHERE email = ?',
      [newRole, email]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Role updated successfully!');
      console.log(`\n📌 New Details:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   New Role: ${newRole}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ Aqil is now an engineer!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ Failed to update role');
    }

  } finally {
    await connection.end();
  }
}

updateUserRole().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
