"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function listMockUsers() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('\n=== All Team Members in Database ===\n');
        const teamMembers = await database_1.AppDataSource.query(`
      SELECT tm.id, u.name, u.email, tm.status, tm.department, u.roles
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      ORDER BY u.name
    `);
        console.log(`Found ${teamMembers.length} team members:\n`);
        teamMembers.forEach((tm, index) => {
            console.log(`${index + 1}. ${tm.name} (${tm.email})`);
            console.log(`   Status: ${tm.status} | Department: ${tm.department}`);
            console.log(`   Roles: ${tm.roles}`);
            console.log(`   ID: ${tm.id}\n`);
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
listMockUsers();
//# sourceMappingURL=list-mock-users.js.map