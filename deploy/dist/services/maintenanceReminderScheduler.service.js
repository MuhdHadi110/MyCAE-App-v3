"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMaintenanceReminderScheduler = startMaintenanceReminderScheduler;
exports.stopMaintenanceReminderScheduler = stopMaintenanceReminderScheduler;
exports.triggerManualReminderCheck = triggerManualReminderCheck;
exports.isSchedulerActive = isSchedulerActive;
const node_cron_1 = __importDefault(require("node-cron"));
const maintenanceScheduler_service_1 = require("./maintenanceScheduler.service");
const email_service_1 = __importDefault(require("./email.service"));
const logger_1 = require("../utils/logger");
/**
 * Calculate days until a date from today
 */
function getDaysUntil(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
/**
 * Format maintenance type for display
 */
function formatMaintenanceType(type) {
    const labels = {
        calibration: 'Calibration',
        inspection: 'Inspection',
        servicing: 'Servicing',
        replacement: 'Replacement',
        other: 'Maintenance',
    };
    return labels[type] || 'Maintenance';
}
/**
 * Get maintenance reminder recipient
 * Sends to dedicated maintenance email address
 */
function getMaintenanceReminderRecipient() {
    return {
        email: process.env.MAINTENANCE_REMINDER_EMAIL || 'mycaeengineer@mycae.com.my',
        name: 'MyCAE Engineer'
    };
}
/**
 * Send reminder for a scheduled maintenance
 */
async function sendReminder(schedule, timeframe) {
    const itemName = schedule.item?.title || 'Unknown Item';
    const maintenanceType = formatMaintenanceType(schedule.maintenance_type);
    const recipient = getMaintenanceReminderRecipient();
    try {
        await email_service_1.default.sendMaintenanceReminder(recipient.email, recipient.name, itemName, maintenanceType, schedule.scheduled_date, timeframe);
        logger_1.logger.info(`Sent ${timeframe} reminder to ${recipient.email} for schedule ${schedule.id}`);
    }
    catch (error) {
        logger_1.logger.error(`Failed to send reminder to ${recipient.email}:`, error.message);
    }
}
/**
 * Send overdue alert for a scheduled maintenance
 */
async function sendOverdueAlert(schedule, daysOverdue) {
    const itemName = schedule.item?.title || 'Unknown Item';
    const maintenanceType = formatMaintenanceType(schedule.maintenance_type);
    const recipient = getMaintenanceReminderRecipient();
    try {
        await email_service_1.default.sendMaintenanceOverdueAlert(recipient.email, recipient.name, itemName, maintenanceType, schedule.scheduled_date, daysOverdue);
        logger_1.logger.info(`Sent overdue alert to ${recipient.email} for schedule ${schedule.id}`);
    }
    catch (error) {
        logger_1.logger.error(`Failed to send overdue alert to ${recipient.email}:`, error.message);
    }
}
/**
 * Process scheduled maintenance reminders
 */
async function processReminders() {
    logger_1.logger.info('Starting maintenance reminder check...');
    try {
        const recipient = getMaintenanceReminderRecipient();
        logger_1.logger.info(`Maintenance reminders will be sent to: ${recipient.email}`);
        // Get schedules needing reminders
        const schedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getSchedulesNeedingReminders();
        logger_1.logger.info(`Found ${schedules.length} schedules to check for reminders`);
        for (const schedule of schedules) {
            const daysUntil = getDaysUntil(schedule.scheduled_date);
            // 14-day reminder
            if (daysUntil === 14 && !schedule.reminder_14_sent) {
                await sendReminder(schedule, '14 days');
                await maintenanceScheduler_service_1.MaintenanceSchedulerService.markReminderSent(schedule.id, 14);
            }
            // 7-day reminder
            if (daysUntil === 7 && !schedule.reminder_7_sent) {
                await sendReminder(schedule, '7 days');
                await maintenanceScheduler_service_1.MaintenanceSchedulerService.markReminderSent(schedule.id, 7);
            }
            // 1-day reminder
            if (daysUntil === 1 && !schedule.reminder_1_sent) {
                await sendReminder(schedule, '1 day');
                await maintenanceScheduler_service_1.MaintenanceSchedulerService.markReminderSent(schedule.id, 1);
            }
        }
        // Process overdue schedules
        const overdueSchedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getOverdue();
        logger_1.logger.info(`Found ${overdueSchedules.length} overdue schedules`);
        for (const schedule of overdueSchedules) {
            const daysOverdue = Math.abs(getDaysUntil(schedule.scheduled_date));
            // Send overdue alert (once a week for ongoing overdue items)
            if (daysOverdue === 1 || daysOverdue % 7 === 0) {
                await sendOverdueAlert(schedule, daysOverdue);
            }
        }
        logger_1.logger.info('Maintenance reminder check completed');
    }
    catch (error) {
        logger_1.logger.error('Error processing maintenance reminders:', error.message);
    }
}
let scheduledTask = null;
/**
 * Start the maintenance reminder scheduler
 * Runs daily at 8:00 AM MYT
 */
function startMaintenanceReminderScheduler() {
    // Run daily at 8:00 AM MYT (UTC+8)
    scheduledTask = node_cron_1.default.schedule('0 8 * * *', async () => {
        await processReminders();
    }, {
        timezone: 'Asia/Kuala_Lumpur',
    });
    logger_1.logger.info('Maintenance reminder scheduler started (daily at 8:00 AM MYT)');
}
/**
 * Stop the maintenance reminder scheduler
 * Call this during graceful shutdown
 */
function stopMaintenanceReminderScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        logger_1.logger.info('Maintenance reminder scheduler stopped');
    }
}
/**
 * Manually trigger reminder processing (for testing)
 */
async function triggerManualReminderCheck() {
    await processReminders();
}
/**
 * Get scheduler status
 */
function isSchedulerActive() {
    return scheduledTask !== null;
}
//# sourceMappingURL=maintenanceReminderScheduler.service.js.map