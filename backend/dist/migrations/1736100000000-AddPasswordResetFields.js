"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPasswordResetFields1736100000000 = void 0;
const typeorm_1 = require("typeorm");
class AddPasswordResetFields1736100000000 {
    async up(queryRunner) {
        // Add password reset token columns to users table
        await queryRunner.addColumns('users', [
            new typeorm_1.TableColumn({
                name: 'reset_token',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }),
            new typeorm_1.TableColumn({
                name: 'reset_token_expires',
                type: 'timestamp',
                isNullable: true,
            }),
        ]);
        // Add index for faster token lookup
        await queryRunner.query(`
      CREATE INDEX idx_users_reset_token ON users(reset_token);
    `);
    }
    async down(queryRunner) {
        // Drop index
        await queryRunner.query(`
      DROP INDEX idx_users_reset_token ON users;
    `);
        // Remove columns
        await queryRunner.dropColumns('users', ['reset_token', 'reset_token_expires']);
    }
}
exports.AddPasswordResetFields1736100000000 = AddPasswordResetFields1736100000000;
//# sourceMappingURL=1736100000000-AddPasswordResetFields.js.map