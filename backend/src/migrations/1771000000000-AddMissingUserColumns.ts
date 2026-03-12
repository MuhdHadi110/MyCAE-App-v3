import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { logger } from '../utils/logger';

export class AddMissingUserColumns1771000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    
    if (!table) {
      logger.warn('users table does not exist');
      return;
    }

    // Add is_active column if it doesn't exist
    if (!table.findColumnByName('is_active')) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }));
      logger.info('Added is_active column to users');
    }

    // Add reset_token column if it doesn't exist
    if (!table.findColumnByName('reset_token')) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'reset_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }));
      logger.info('Added reset_token column to users');
    }

    // Add reset_token_expires column if it doesn't exist
    if (!table.findColumnByName('reset_token_expires')) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'reset_token_expires',
        type: 'timestamp',
        isNullable: true,
      }));
      logger.info('Added reset_token_expires column to users');
    }

    // Add temp_password_expires column if it doesn't exist
    if (!table.findColumnByName('temp_password_expires')) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'temp_password_expires',
        type: 'timestamp',
        isNullable: true,
      }));
      logger.info('Added temp_password_expires column to users');
    }

    // Add is_temp_password column if it doesn't exist
    if (!table.findColumnByName('is_temp_password')) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'is_temp_password',
        type: 'boolean',
        default: false,
      }));
      logger.info('Added is_temp_password column to users');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'is_temp_password');
    await queryRunner.dropColumn('users', 'temp_password_expires');
    await queryRunner.dropColumn('users', 'reset_token_expires');
    await queryRunner.dropColumn('users', 'reset_token');
    await queryRunner.dropColumn('users', 'is_active');
  }
}
