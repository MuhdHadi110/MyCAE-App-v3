import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { logger } from '../utils/logger';

export class AddMissingTeamMemberColumns1770900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist and add them if they don't
    const table = await queryRunner.getTable('team_members');
    
    if (!table) {
      logger.warn('team_members table does not exist');
      return;
    }

    // Add employee_id column if it doesn't exist
    if (!table.findColumnByName('employee_id')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'employee_id',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }));
      logger.info('Added employee_id column to team_members');
    }

    // Add employment_type column if it doesn't exist
    if (!table.findColumnByName('employment_type')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'employment_type',
        type: 'enum',
        enum: ['full-time', 'part-time', 'contract', 'intern'],
        default: "'full-time'",
      }));
      logger.info('Added employment_type column to team_members');
    }

    // Add job_title column if it doesn't exist
    if (!table.findColumnByName('job_title')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'job_title',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }));
      logger.info('Added job_title column to team_members');
    }

    // Add manager_id column if it doesn't exist
    if (!table.findColumnByName('manager_id')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'manager_id',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }));
      logger.info('Added manager_id column to team_members');
    }

    // Add office_location column if it doesn't exist
    if (!table.findColumnByName('office_location')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'office_location',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }));
      logger.info('Added office_location column to team_members');
    }

    // Add hire_date column if it doesn't exist
    if (!table.findColumnByName('hire_date')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'hire_date',
        type: 'datetime',
        isNullable: true,
      }));
      logger.info('Added hire_date column to team_members');
    }

    // Add termination_date column if it doesn't exist
    if (!table.findColumnByName('termination_date')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'termination_date',
        type: 'datetime',
        isNullable: true,
      }));
      logger.info('Added termination_date column to team_members');
    }

    // Add hourly_rate column if it doesn't exist
    if (!table.findColumnByName('hourly_rate')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'hourly_rate',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }));
      logger.info('Added hourly_rate column to team_members');
    }

    // Add skills column if it doesn't exist
    if (!table.findColumnByName('skills')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'skills',
        type: 'text',
        isNullable: true,
      }));
      logger.info('Added skills column to team_members');
    }

    // Add certifications column if it doesn't exist
    if (!table.findColumnByName('certifications')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'certifications',
        type: 'text',
        isNullable: true,
      }));
      logger.info('Added certifications column to team_members');
    }

    // Add notes column if it doesn't exist
    if (!table.findColumnByName('notes')) {
      await queryRunner.addColumn('team_members', new TableColumn({
        name: 'notes',
        type: 'text',
        isNullable: true,
      }));
      logger.info('Added notes column to team_members');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns in reverse order
    await queryRunner.dropColumn('team_members', 'notes');
    await queryRunner.dropColumn('team_members', 'certifications');
    await queryRunner.dropColumn('team_members', 'skills');
    await queryRunner.dropColumn('team_members', 'hourly_rate');
    await queryRunner.dropColumn('team_members', 'termination_date');
    await queryRunner.dropColumn('team_members', 'hire_date');
    await queryRunner.dropColumn('team_members', 'office_location');
    await queryRunner.dropColumn('team_members', 'manager_id');
    await queryRunner.dropColumn('team_members', 'job_title');
    await queryRunner.dropColumn('team_members', 'employment_type');
    await queryRunner.dropColumn('team_members', 'employee_id');
  }
}
