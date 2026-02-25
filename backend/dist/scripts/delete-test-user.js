"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const TeamMember_1 = require("../entities/TeamMember");
async function deleteTestUser() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('Database connected');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const teamRepo = database_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
        // Find user
        const user = await userRepo.findOne({ where: { email: 'mirzamuhd12@gmail.com' } });
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('Found user:', user.id, user.name);
        // Find and delete team member first (due to foreign key)
        const teamMember = await teamRepo.findOne({ where: { user_id: user.id } });
        if (teamMember) {
            await teamRepo.remove(teamMember);
            console.log('✅ Team member deleted');
        }
        // Delete user
        await userRepo.remove(user);
        console.log('✅ User deleted');
        console.log('\n✅ Test user mirzamuhd12@gmail.com has been removed successfully!');
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
}
deleteTestUser();
//# sourceMappingURL=delete-test-user.js.map