"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameDailyRateToHourlyRate1770800000001 = void 0;
/**
 * Migration: Rename daily_rate to hourly_rate
 *
 * The daily_rate column was actually storing hourly rates, not daily rates.
 * This migration corrects the naming for clarity.
 */
class RenameDailyRateToHourlyRate1770800000001 {
    async up(queryRunner) {
        // Rename the column from daily_rate to hourly_rate
        await queryRunner.renameColumn('projects', 'daily_rate', 'hourly_rate');
    }
    async down(queryRunner) {
        // Revert: rename back to daily_rate
        await queryRunner.renameColumn('projects', 'hourly_rate', 'daily_rate');
    }
}
exports.RenameDailyRateToHourlyRate1770800000001 = RenameDailyRateToHourlyRate1770800000001;
//# sourceMappingURL=1770800000001-RenameDailyRateToHourlyRate.js.map