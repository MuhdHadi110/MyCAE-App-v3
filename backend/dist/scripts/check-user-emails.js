"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
async function checkUserEmails() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Connected to database\n');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Get all users
        const users = await userRepo.query('SELECT id, name, email FROM users ORDER BY name ASC');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 ALL USERS IN DATABASE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        users.forEach((user) => {
            const email = user.email || 'N/A';
            const match = email.includes('naaimhafiz') ? '🎯 MATCH!' : '';
            console.log(`${match} ${user.name} (${email})`);
        });
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Total users: ${users.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await database_1.AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
checkUserEmails();
//# sourceMappingURL=check-user-emails.js.map