import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Migration to add temp password fields for new user onboarding
 * - temp_password_expires: When the temporary password expires (7 days after creation)
 * - is_temp_password: Flag to indicate if user is using a temporary password
 */
export declare class AddTempPasswordFields1770700000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1770700000000-AddTempPasswordFields.d.ts.map