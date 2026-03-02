"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertRoleToRoles1730307900000 = void 0;
class ConvertRoleToRoles1730307900000 {
    constructor() {
        this.name = 'ConvertRoleToRoles1730307900000';
    }
    async up(queryRunner) {
        // Add new 'roles' column if it doesn't exist
        const hasRolesColumn = await queryRunner.hasColumn('users', 'roles');
        if (!hasRolesColumn) {
            await queryRunner.query(`ALTER TABLE users ADD COLUMN roles VARCHAR(255) NOT NULL DEFAULT 'engineer'`);
        }
        // Copy data from 'role' to 'roles' - wrap single role in array
        await queryRunner.query(`UPDATE users SET roles = CONCAT(role) WHERE roles = 'engineer'`);
        // Drop the old 'role' column if it exists
        const hasRoleColumn = await queryRunner.hasColumn('users', 'role');
        if (hasRoleColumn) {
            await queryRunner.query(`ALTER TABLE users DROP COLUMN role`);
        }
    }
    async down(queryRunner) {
        // Revert: Add back the old 'role' column
        const hasRoleColumn = await queryRunner.hasColumn('users', 'role');
        if (!hasRoleColumn) {
            await queryRunner.query(`ALTER TABLE users ADD COLUMN role VARCHAR(255) NOT NULL DEFAULT 'engineer'`);
        }
        // Copy data back from 'roles' to 'role' (extract first role or use 'engineer')
        await queryRunner.query(`UPDATE users SET role = SUBSTRING_INDEX(roles, ',', 1) WHERE role = 'engineer'`);
        // Drop the new 'roles' column
        const hasRolesColumn = await queryRunner.hasColumn('users', 'roles');
        if (hasRolesColumn) {
            await queryRunner.query(`ALTER TABLE users DROP COLUMN roles`);
        }
    }
}
exports.ConvertRoleToRoles1730307900000 = ConvertRoleToRoles1730307900000;
//# sourceMappingURL=1730307900000-ConvertRoleToRoles.js.map