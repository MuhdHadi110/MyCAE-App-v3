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

    console.log('🔄 Updating admin user role...\n');

    // Update the admin user's role to 'admin'
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', 'admin@test.com']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin user role updated successfully!\n');

      // Verify the change
      const [users] = await connection.execute(
        'SELECT id, name, email, role FROM users WHERE email = ?',
        ['admin@test.com']
      );

      if (users.length > 0) {
        const user = users[0];
        console.log('📋 Updated User:');
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role} ✅`);
        console.log('\n🎉 Admin now has full access to all features!');
      }
    } else {
      console.log('⚠️  No admin user found with email admin@test.com');
      console.log('Available users:');
      const [allUsers] = await connection.execute(
        'SELECT id, name, email, role FROM users'
      );
      allUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}): ${user.role}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
