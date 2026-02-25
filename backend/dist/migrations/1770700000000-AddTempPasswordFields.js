"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTempPasswordFields1770700000000 = void 0;
const logger_1 = require("../utils/logger");
/**
 * Migration to add temp password fields for new user onboarding
 * - temp_password_expires: When the temporary password expires (7 days after creation)
 * - is_temp_password: Flag to indicate if user is using a temporary password
 */
class AddTempPasswordFields1770700000000 {
    async up(queryRunner) {
        // Check if columns already exist
        const table = await queryRunner.getTable('users');
        const hasTempPasswordExpires = table?.findColumnByName('temp_password_expires');
        const hasIsTempPassword = table?.findColumnByName('is_temp_password');
        if (!hasTempPasswordExpires) {
            await queryRunner.query(`
        ALTER TABLE users
        ADD COLUMN temp_password_expires TIMESTAMP NULL
      `);
            logger_1.logger.info('Added temp_password_expires column to users table');
        }
        if (!hasIsTempPassword) {
            await queryRunner.query(`
        ALTER TABLE users
        ADD COLUMN is_temp_password BOOLEAN NOT NULL DEFAULT FALSE
      `);
            logger_1.logger.info('Added is_temp_password column to users table');
        }
    }
    async down(queryRunner) {
        // Remove columns if they exist
        const table = await queryRunner.getTable('users');
        const hasTempPasswordExpires = table?.findColumnByName('temp_password_expires');
        const hasIsTempPassword = table?.findColumnByName('is_temp_password');
        if (hasIsTempPassword) {
            await queryRunner.query(`
        ALTER TABLE users 
        DROP COLUMN is_temp_password
      `);
        }
        if (hasTempPasswordExpires) {
            await queryRunner.query(`
        ALTER TABLE users 
        DROP COLUMN temp_password_expires
      `);
        }
    }
}
exports.AddTempPasswordFields1770700000000 = AddTempPasswordFields1770700000000;
//# sourceMappingURL=1770700000000-AddTempPasswordFields.js.map