import cron, { ScheduledTask } from 'node-cron';
import { ExchangeRateApiService } from './exchangeRateApi.service';
import { logger } from '../utils/logger';

/**
 * Exchange Rate Scheduler Service
 *
 * Automatically imports exchange rates from Frankfurter API (ECB data)
 * Schedule: Daily at 5:00 PM MYT (UTC+8), Monday to Friday
 *
 * ECB updates rates around 4:00 PM CET (11:00 PM MYT) on business days,
 * but Frankfurter API may have some delay. Running at 5:00 PM MYT
 * ensures we catch any rate updates from the previous business day.
 */

let isSchedulerRunning = false;
let scheduledTask: ScheduledTask | null = null;

/**
 * Start the exchange rate scheduler
 * Call this function once after database is initialized
 */
export function startExchangeRateScheduler(): void {
  if (isSchedulerRunning) {
    logger.warn('Exchange rate scheduler is already running');
    return;
  }

  // Cron expression: minute hour day-of-month month day-of-week
  // '0 17 * * 1-5' = At 5:00 PM (17:00), Monday through Friday
  const cronExpression = '0 17 * * 1-5';

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    logger.error('Invalid cron expression for exchange rate scheduler');
    return;
  }

  scheduledTask = cron.schedule(
    cronExpression,
    async () => {
      logger.info('Starting scheduled exchange rate import...');

      try {
        await ExchangeRateApiService.importRates();
        logger.info('Exchange rates imported successfully via scheduled job');
      } catch (error: any) {
        logger.error('Failed to import exchange rates via scheduled job:', error.message);
      }
    },
    {
      timezone: 'Asia/Kuala_Lumpur', // MYT timezone
    }
  );

  isSchedulerRunning = true;
  logger.info('Exchange rate scheduler started (daily at 5:00 PM MYT, Mon-Fri)');
}

/**
 * Stop the exchange rate scheduler
 * Call this during graceful shutdown
 */
export function stopExchangeRateScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    isSchedulerRunning = false;
    logger.info('Exchange rate scheduler stopped');
  }
}

/**
 * Manually trigger an exchange rate import
 * Useful for testing or on-demand updates
 */
export async function triggerManualImport(): Promise<void> {
  logger.info('Manual exchange rate import triggered');

  try {
    await ExchangeRateApiService.importRates();
    logger.info('Exchange rates imported successfully via manual trigger');
  } catch (error: any) {
    logger.error('Failed to import exchange rates via manual trigger:', error.message);
    throw error;
  }
}

/**
 * Check if the scheduler is currently running
 */
export function isSchedulerActive(): boolean {
  return isSchedulerRunning;
}

export default {
  startExchangeRateScheduler,
  stopExchangeRateScheduler,
  triggerManualImport,
  isSchedulerActive,
};
