const bcrypt = require('bcryptjs');
const { AppDataSource } = require('./src/config/database');

AppDataSource.initialize().then(async () => {
  const result = await AppDataSource.query('SELECT email, password_hash FROM users WHERE email = ?', ['admin@mycae.com']);

  console.log('Current user:', result[0].email);

  const testPassword = 'AdminPassword123!';
  const isMatch = await bcrypt.compare(testPassword, result[0].password_hash);
  console.log('Password currently matches:', isMatch);

  if (!isMatch) {
    console.log('Updating password...');
    const newHash = await bcrypt.hash(testPassword, 10);
    await AppDataSource.query('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, 'admin@mycae.com']);
    console.log('✅ Password updated');

    // Verify it worked
    const verify = await AppDataSource.query('SELECT password_hash FROM users WHERE email = ?', ['admin@mycae.com']);
    const finalTest = await bcrypt.compare(testPassword, verify[0].password_hash);
    console.log('Verification after update:', finalTest);
  }

  console.log('');
  console.log('Login with:');
  console.log('Email: admin@mycae.com');
  console.log('Password: AdminPassword123!');

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
