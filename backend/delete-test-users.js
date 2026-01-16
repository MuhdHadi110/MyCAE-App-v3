const mysql = require('mysql2/promise');

async function deleteTestUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    // Test users to delete (from seed data and explicitly marked as test)
    const testUsers = [
      'admin@mycae.com',
      'john@mycae.com',
      'sarah@mycae.com',
      'mike@mycae.com',
      'lisa@mycae.com',
      'test@mycae.com',
      'firsttime@mycae.com',
      'haziq@mycae.com' // if this is a test user
    ];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  Deleting Test Users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // First get user IDs for these emails
    const userIds = [];
    for (const email of testUsers) {
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      if (users.length > 0) {
        userIds.push(users[0].id);
      }
    }

    // Delete from team_members first (foreign key constraint)
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      const [resultTM] = await connection.execute(
        `DELETE FROM team_members WHERE user_id IN (${placeholders})`,
        userIds
      );
      console.log(`✅ Deleted ${resultTM.affectedRows} records from team_members`);
    }

    // Delete users
    let deletedCount = 0;
    for (const email of testUsers) {
      const [result] = await connection.execute(
        'DELETE FROM users WHERE email = ?',
        [email]
      );

      if (result.affectedRows > 0) {
        console.log(`✅ Deleted user: ${email}`);
        deletedCount++;
      } else {
        console.log(`⚠️  Not found: ${email}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Deleted ${deletedCount} test users!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show remaining users
    const [remainingUsers] = await connection.execute(
      'SELECT name, email, department FROM users'
    );

    console.log('📋 Remaining Users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (remainingUsers.length === 0) {
      console.log('❌ No users remaining');
    } else {
      remainingUsers.forEach(user => {
        console.log(`👤 ${user.name} (${user.email})`);
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } finally {
    await connection.end();
  }
}

deleteTestUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
