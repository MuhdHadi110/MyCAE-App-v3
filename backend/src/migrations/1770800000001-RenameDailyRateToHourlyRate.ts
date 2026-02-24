import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Rename daily_rate to hourly_rate
 * 
 * The daily_rate column was actually storing hourly rates, not daily rates.
 * This migration corrects the naming for clarity.
 */
export class RenameDailyRateToHourlyRate1770800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the column from daily_rate to hourly_rate
    await queryRunner.renameColumn('projects', 'daily_rate', 'hourly_rate');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: rename back to daily_rate
    await queryRunner.renameColumn('projects', 'hourly_rate', 'daily_rate');
  }
}
