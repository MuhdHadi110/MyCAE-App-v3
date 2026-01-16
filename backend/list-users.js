const mysql = require('mysql2/promise');

async function listUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    const [users] = await connection.execute(
      'SELECT id, name, email, department, position FROM users'
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 All Users in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`\n👤 ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Position: ${user.position || 'N/A'}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Default Passwords:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin (hadi@mycae.com.my): Welcome@123456');
    console.log('Engineer (john@mycae.com): john123');
    console.log('Senior Engineer (sarah@mycae.com): sarah123');
    console.log('Principal Engineer (mike@mycae.com): mike123');
    console.log('Manager (lisa@mycae.com): lisa123');
    console.log('\n⚠️  If these passwords don\'t work, the user may not exist in the database.');
    console.log('   Run the seed scripts to create these users:');
    console.log('   - npm run seed-admin (creates admin only)');
    console.log('   - npm run seed-data (creates all test users)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } finally {
    await connection.end();
  }
}

listUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
