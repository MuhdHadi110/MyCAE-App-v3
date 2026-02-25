"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function testTeamAPI() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('Database connected');
        const teamMembers = await database_1.AppDataSource.query(`
      SELECT tm.id, u.name, u.email, tm.status, tm.department
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.status = 'active'
      ORDER BY u.name
      LIMIT 5
    `);
        console.log('Team members from DB:');
        console.log(JSON.stringify(teamMembers, null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
}
testTeamAPI();
//# sourceMappingURL=test-team-api.js.map