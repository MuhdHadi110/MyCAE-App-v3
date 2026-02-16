import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add temp password fields for new user onboarding
 * - temp_password_expires: When the temporary password expires (7 days after creation)
 * - is_temp_password: Flag to indicate if user is using a temporary password
 */
export class AddTempPasswordFields1770700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist
    const table = await queryRunner.getTable('users');
    const hasTempPasswordExpires = table?.findColumnByName('temp_password_expires');
    const hasIsTempPassword = table?.findColumnByName('is_temp_password');

    if (!hasTempPasswordExpires) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN temp_password_expires TIMESTAMP NULL
      `);
      console.log('✅ Added temp_password_expires column to users table');
    }

    if (!hasIsTempPassword) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN is_temp_password BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('✅ Added is_temp_password column to users table');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
