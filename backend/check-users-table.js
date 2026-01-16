const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mycae_tracker'
  });

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Users Table Structure');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [columns] = await connection.execute('DESCRIBE users');
    
    columns.forEach(col => {
      console.log(`📌 ${col.Field}`);
      console.log(`   Type: ${col.Type}`);
      console.log(`   Null: ${col.Null}`);
      console.log(`   Key: ${col.Key || 'N/A'}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 All Users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [users] = await connection.execute('SELECT * FROM users LIMIT 3');
    users.forEach(user => {
      console.log(`User: ${JSON.stringify(user, null, 2)}\n`);
    });

  } finally {
    await connection.end();
  }
}

checkTableStructure().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
