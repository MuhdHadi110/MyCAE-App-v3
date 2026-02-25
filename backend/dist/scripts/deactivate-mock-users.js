"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function deactivateMockUsers() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('\n=== Deactivating Mock/Test Users ===\n');
        // List of mock users to deactivate
        const mockUsers = [
            'john@mycae.com',
            'lisa@mycae.com',
            'mike@mycae.com',
            'sarah@mycae.com',
            'mirzamuhd12@gmail.com'
        ];
        for (const email of mockUsers) {
            const result = await database_1.AppDataSource.query(`
        UPDATE team_members tm
        JOIN users u ON tm.user_id = u.id
        SET tm.status = 'inactive'
        WHERE u.email = ?
      `, [email]);
            if (result.affectedRows > 0) {
                console.log(`✅ Deactivated: ${email}`);
            }
            else {
                console.log(`⚠️ Not found: ${email}`);
            }
        }
        console.log('\n=== Mock users deactivated successfully! ===');
        // Show remaining active users
        console.log('\n=== Remaining Active Team Members ===\n');
        const activeMembers = await database_1.AppDataSource.query(`
      SELECT u.name, u.email, tm.status
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.status = 'active'
      ORDER BY u.name
    `);
        activeMembers.forEach((m, i) => {
            console.log(`${i + 1}. ${m.name} (${m.email})`);
        });
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
}
deactivateMockUsers();
//# sourceMappingURL=deactivate-mock-users.js.map