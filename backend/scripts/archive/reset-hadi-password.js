const bcrypt = require('bcryptjs');
const { AppDataSource } = require('./src/config/database');

AppDataSource.initialize().then(async () => {
  const email = 'hadi@mycae.com.my';
  const newPassword = 'HadiPassword123!';

  const result = await AppDataSource.query('SELECT email FROM users WHERE email = ?', [email]);

  if (result.length === 0) {
    console.log('❌ User not found:', email);
    process.exit(1);
  }

  console.log('✅ User found:', email);

  const hash = await bcrypt.hash(newPassword, 10);
  await AppDataSource.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);

  console.log('✅ Password updated successfully!');
  console.log('');
  console.log('=================================');
  console.log('Login credentials:');
  console.log('Email:', email);
  console.log('Password:', newPassword);
  console.log('=================================');

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
