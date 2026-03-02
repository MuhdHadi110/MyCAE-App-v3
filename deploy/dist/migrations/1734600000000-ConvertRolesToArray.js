"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertRolesToArray1734600000000 = void 0;
class ConvertRolesToArray1734600000000 {
    async up(queryRunner) {
        console.log('🔄 Converting single roles to array format...');
        // Get all users with their current roles
        const users = await queryRunner.query('SELECT id, roles FROM users');
        for (const user of users) {
            // If roles is already a JSON array, skip
            if (user.roles && user.roles.startsWith('[')) {
                continue;
            }
            // Convert single role to array format
            const roleArray = user.roles ? JSON.stringify([user.roles]) : JSON.stringify(['engineer']);
            await queryRunner.query('UPDATE users SET roles = ? WHERE id = ?', [roleArray, user.id]);
        }
        console.log(`✅ Converted ${users.length} users to array-based roles`);
    }
    async down(queryRunner) {
        console.log('🔄 Converting array roles back to single role...');
        // Get all users with their current roles
        const users = await queryRunner.query('SELECT id, roles FROM users');
        for (const user of users) {
            // If roles is a JSON array, convert to first role
            if (user.roles && user.roles.startsWith('[')) {
                try {
                    const rolesArray = JSON.parse(user.roles);
                    const firstRole = rolesArray[0] || 'engineer';
                    await queryRunner.query('UPDATE users SET roles = ? WHERE id = ?', [firstRole, user.id]);
                }
                catch (error) {
                    console.error(`Failed to parse roles for user ${user.id}:`, error);
                }
            }
        }
        console.log('✅ Converted roles back to single role format');
    }
}
exports.ConvertRolesToArray1734600000000 = ConvertRolesToArray1734600000000;
//# sourceMappingURL=1734600000000-ConvertRolesToArray.js.map