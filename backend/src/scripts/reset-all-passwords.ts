import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

/**
 * Reset all user passwords to a standardized first-time login password
 * Excludes: hadi@mycae.com.my
 */

const EXCLUDED_EMAIL = 'hadi@mycae.com.my';
const STANDARD_PASSWORD = 'TempPassword123!';

async function resetAllPasswords() {
  try {
    console.log('🔧 Password Reset Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepo = AppDataSource.getRepository(User);

    // Get all users
    const allUsers = await userRepo.find();
    console.log(`📊 Found ${allUsers.length} users in database\n`);

    // Hash standard password
    const hashedPassword = await bcrypt.hash(STANDARD_PASSWORD, 10);
    console.log(`🔑 Standard password: ${STANDARD_PASSWORD}`);
    console.log(`🔒 Password hash created\n`);

    let resetCount = 0;
    let skippedCount = 0;

    // Reset passwords
    for (const user of allUsers) {
      if (user.email === EXCLUDED_EMAIL) {
        console.log(`⏭️  Skipping excluded user: ${user.email}`);
        skippedCount++;
        continue;
      }

      user.password_hash = hashedPassword;
      user.reset_token = 'TEMP_PASSWORD_ASSIGNED'; // Mark as first-time login required
      await userRepo.save(user);
      console.log(`✅ Reset password for: ${user.email} (${user.name})`);
      resetCount++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Password Reset Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Total users: ${allUsers.length}`);
    console.log(`✅ Reset: ${resetCount} users`);
    console.log(`⏭️  Skipped: ${skippedCount} users (excluded)`);
    console.log('\n📋 Standard Login Credentials:');
    console.log(`   Password: ${STANDARD_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Users will be required to change password on first login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting passwords:', error);
    process.exit(1);
  }
}

resetAllPasswords();
