"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExchangeRateScheduler = startExchangeRateScheduler;
exports.stopExchangeRateScheduler = stopExchangeRateScheduler;
exports.triggerManualImport = triggerManualImport;
exports.isSchedulerActive = isSchedulerActive;
const node_cron_1 = __importDefault(require("node-cron"));
const exchangeRateApi_service_1 = require("./exchangeRateApi.service");
const logger_1 = require("../utils/logger");
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
let scheduledTask = null;
/**
 * Start the exchange rate scheduler
 * Call this function once after database is initialized
 */
function startExchangeRateScheduler() {
    if (isSchedulerRunning) {
        logger_1.logger.warn('Exchange rate scheduler is already running');
        return;
    }
    // Cron expression: minute hour day-of-month month day-of-week
    // '0 17 * * 1-5' = At 5:00 PM (17:00), Monday through Friday
    const cronExpression = '0 17 * * 1-5';
    // Validate cron expression
    if (!node_cron_1.default.validate(cronExpression)) {
        logger_1.logger.error('Invalid cron expression for exchange rate scheduler');
        return;
    }
    scheduledTask = node_cron_1.default.schedule(cronExpression, async () => {
        logger_1.logger.info('Starting scheduled exchange rate import...');
        try {
            await exchangeRateApi_service_1.ExchangeRateApiService.importRates();
            logger_1.logger.info('Exchange rates imported successfully via scheduled job');
        }
        catch (error) {
            logger_1.logger.error('Failed to import exchange rates via scheduled job:', error.message);
        }
    }, {
        timezone: 'Asia/Kuala_Lumpur', // MYT timezone
    });
    isSchedulerRunning = true;
    logger_1.logger.info('Exchange rate scheduler started (daily at 5:00 PM MYT, Mon-Fri)');
}
/**
 * Stop the exchange rate scheduler
 * Call this during graceful shutdown
 */
function stopExchangeRateScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        isSchedulerRunning = false;
        logger_1.logger.info('Exchange rate scheduler stopped');
    }
}
/**
 * Manually trigger an exchange rate import
 * Useful for testing or on-demand updates
 */
async function triggerManualImport() {
    logger_1.logger.info('Manual exchange rate import triggered');
    try {
        await exchangeRateApi_service_1.ExchangeRateApiService.importRates();
        logger_1.logger.info('Exchange rates imported successfully via manual trigger');
    }
    catch (error) {
        logger_1.logger.error('Failed to import exchange rates via manual trigger:', error.message);
        throw error;
    }
}
/**
 * Check if the scheduler is currently running
 */
function isSchedulerActive() {
    return isSchedulerRunning;
}
exports.default = {
    startExchangeRateScheduler,
    stopExchangeRateScheduler,
    triggerManualImport,
    isSchedulerActive,
};
//# sourceMappingURL=exchangeRateScheduler.service.js.map