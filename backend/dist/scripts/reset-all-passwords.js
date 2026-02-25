"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
        await database_1.AppDataSource.initialize();
        console.log('✅ Connected to database\n');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Get all users
        const allUsers = await userRepo.find();
        console.log(`📊 Found ${allUsers.length} users in database\n`);
        // Hash standard password
        const hashedPassword = await bcryptjs_1.default.hash(STANDARD_PASSWORD, 10);
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
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error resetting passwords:', error);
        process.exit(1);
    }
}
resetAllPasswords();
//# sourceMappingURL=reset-all-passwords.js.map