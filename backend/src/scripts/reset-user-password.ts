import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import bcrypt from 'bcryptjs';

async function resetUserPassword() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Get email from command line args
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'TempPass123!';

    if (!email) {
      console.log('Usage: npx ts-node src/scripts/reset-user-password.ts <email> [new-password]');
      console.log('Example: npx ts-node src/scripts/reset-user-password.ts hadi@mycae.com MyNewPass123');
      process.exit(1);
    }

    // Find user
    const user = await AppDataSource.query(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const userId = user[0].id;
    const userName = user[0].name;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await AppDataSource.query(
      `UPDATE users 
       SET password_hash = ?, 
           is_temp_password = true,
           temp_password_expires = DATE_ADD(NOW(), INTERVAL 7 DAY)
       WHERE id = ?`,
      [hashedPassword, userId]
    );

    console.log('✅ Password reset successfully!\n');
    console.log('User Details:');
    console.log(`  Name: ${userName}`);
    console.log(`  Email: ${email}`);
    console.log(`  New Password: ${newPassword}`);
    console.log(`  Expires: 7 days from now`);
    console.log('\n⚠️  Share this password securely with the user.');
    console.log('   They will be prompted to change it on first login.');

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetUserPassword();
