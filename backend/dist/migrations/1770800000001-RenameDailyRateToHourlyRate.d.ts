import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Migration: Rename daily_rate to hourly_rate
 *
 * The daily_rate column was actually storing hourly rates, not daily rates.
 * This migration corrects the naming for clarity.
 */
export declare class RenameDailyRateToHourlyRate1770800000001 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1770800000001-RenameDailyRateToHourlyRate.d.ts.map