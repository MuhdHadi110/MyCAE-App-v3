"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
/**
 * Fix the password change loop bug
 * Clears reset_token for all users to stop them being prompted every login
 */
async function fixResetTokenLoop() {
    try {
        console.log('🔧 Fix Reset Token Loop');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        // Initialize database connection
        await database_1.AppDataSource.initialize();
        console.log('✅ Connected to database\n');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Get all users
        const allUsers = await userRepo.find();
        console.log(`📊 Found ${allUsers.length} users in database\n`);
        let clearedCount = 0;
        let alreadyClearCount = 0;
        // Clear reset_token for all users
        for (const user of allUsers) {
            if (user.reset_token) {
                user.reset_token = undefined;
                user.reset_token_expires = undefined;
                await userRepo.save(user);
                console.log(`✅ Cleared reset_token for: ${user.email} (${user.name})`);
                clearedCount++;
            }
            else {
                console.log(`⏭️  Already clear: ${user.email} (${user.name})`);
                alreadyClearCount++;
            }
        }
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Fix Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📈 Total users: ${allUsers.length}`);
        console.log(`✅ Cleared: ${clearedCount} users`);
        console.log(`⏭️  Already clear: ${alreadyClearCount} users`);
        console.log('\n✅ Users will no longer be prompted to change password on every login');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error fixing reset token loop:', error);
        process.exit(1);
    }
}
fixResetTokenLoop();
//# sourceMappingURL=fix-reset-token-loop.js.map