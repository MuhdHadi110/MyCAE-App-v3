import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

/**
 * Smart fix for reset token loop
 * - Clears reset_token for users who changed their password (stops loop)
 * - Keeps reset_token for users still using TempPassword123! (they need to change)
 */

const TEMP_PASSWORD = 'TempPassword123!';

async function fixResetTokenSmart() {
  try {
    console.log('🔧 Smart Reset Token Fix');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepo = AppDataSource.getRepository(User);

    // Get all users
    const allUsers = await userRepo.find();
    console.log(`📊 Found ${allUsers.length} users in database\n`);

    let clearedCount = 0;
    let keptCount = 0;
    let setCount = 0;

    console.log('🔍 Analyzing users...\n');

    // Process each user
    for (const user of allUsers) {
      // Check if user still has the temp password
      const hasTempPassword = await bcrypt.compare(TEMP_PASSWORD, user.password_hash);

      if (hasTempPassword) {
        // User still has temp password - ensure reset_token is set
        if (!user.reset_token) {
          user.reset_token = 'TEMP_PASSWORD_ASSIGNED';
          await userRepo.save(user);
          console.log(`✅ SET reset_token for: ${user.email} (${user.name}) - Still using temp password`);
          setCount++;
        } else {
          console.log(`⏭️  KEEP reset_token for: ${user.email} (${user.name}) - Still using temp password`);
          keptCount++;
        }
      } else {
        // User has changed their password - clear reset_token
        if (user.reset_token) {
          user.reset_token = undefined;
          user.reset_token_expires = undefined;
          await userRepo.save(user);
          console.log(`🔓 CLEAR reset_token for: ${user.email} (${user.name}) - Already changed password`);
          clearedCount++;
        } else {
          console.log(`✓  Already clear: ${user.email} (${user.name}) - Already changed password`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Smart Fix Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Total users: ${allUsers.length}`);
    console.log(`🔓 Cleared (changed password): ${clearedCount} users`);
    console.log(`✅ Set (needs to change): ${setCount} users`);
    console.log(`⏭️  Kept (needs to change): ${keptCount} users`);
    console.log('\n📋 Results:');
    console.log(`   - ${clearedCount} users will login normally (no prompt)`);
    console.log(`   - ${setCount + keptCount} users will be prompted to change password on next login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing reset tokens:', error);
    process.exit(1);
  }
}

fixResetTokenSmart();
