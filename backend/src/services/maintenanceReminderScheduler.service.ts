import cron, { ScheduledTask } from 'node-cron';
import { ScheduledMaintenance } from '../entities/ScheduledMaintenance';
import { MaintenanceSchedulerService } from './maintenanceScheduler.service';
import emailService from './email.service';
import { logger } from '../utils/logger';

/**
 * Calculate days until a date from today
 */
function getDaysUntil(date: Date): number {
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
function formatMaintenanceType(type: string): string {
  const labels: Record<string, string> = {
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
function getMaintenanceReminderRecipient(): { email: string; name: string } {
  return {
    email: process.env.MAINTENANCE_REMINDER_EMAIL || 'mycaeengineer@mycae.com.my',
    name: 'MyCAE Engineer'
  };
}

/**
 * Send reminder for a scheduled maintenance
 */
async function sendReminder(
  schedule: ScheduledMaintenance,
  timeframe: string
): Promise<void> {
  const itemName = schedule.item?.title || 'Unknown Item';
  const maintenanceType = formatMaintenanceType(schedule.maintenance_type);
  const recipient = getMaintenanceReminderRecipient();

  try {
    await emailService.sendMaintenanceReminder(
      recipient.email,
      recipient.name,
      itemName,
      maintenanceType,
      schedule.scheduled_date,
      timeframe
    );
    logger.info(`Sent ${timeframe} reminder to ${recipient.email} for schedule ${schedule.id}`);
  } catch (error: any) {
    logger.error(`Failed to send reminder to ${recipient.email}:`, error.message);
  }
}

/**
 * Send overdue alert for a scheduled maintenance
 */
async function sendOverdueAlert(
  schedule: ScheduledMaintenance,
  daysOverdue: number
): Promise<void> {
  const itemName = schedule.item?.title || 'Unknown Item';
  const maintenanceType = formatMaintenanceType(schedule.maintenance_type);
  const recipient = getMaintenanceReminderRecipient();

  try {
    await emailService.sendMaintenanceOverdueAlert(
      recipient.email,
      recipient.name,
      itemName,
      maintenanceType,
      schedule.scheduled_date,
      daysOverdue
    );
    logger.info(`Sent overdue alert to ${recipient.email} for schedule ${schedule.id}`);
  } catch (error: any) {
    logger.error(`Failed to send overdue alert to ${recipient.email}:`, error.message);
  }
}

/**
 * Process scheduled maintenance reminders
 */
async function processReminders(): Promise<void> {
  logger.info('Starting maintenance reminder check...');

  try {
    const recipient = getMaintenanceReminderRecipient();
    logger.info(`Maintenance reminders will be sent to: ${recipient.email}`);

    // Get schedules needing reminders
    const schedules = await MaintenanceSchedulerService.getSchedulesNeedingReminders();

    logger.info(`Found ${schedules.length} schedules to check for reminders`);

    for (const schedule of schedules) {
      const daysUntil = getDaysUntil(schedule.scheduled_date);

      // 14-day reminder
      if (daysUntil === 14 && !schedule.reminder_14_sent) {
        await sendReminder(schedule, '14 days');
        await MaintenanceSchedulerService.markReminderSent(schedule.id, 14);
      }

      // 7-day reminder
      if (daysUntil === 7 && !schedule.reminder_7_sent) {
        await sendReminder(schedule, '7 days');
        await MaintenanceSchedulerService.markReminderSent(schedule.id, 7);
      }

      // 1-day reminder
      if (daysUntil === 1 && !schedule.reminder_1_sent) {
        await sendReminder(schedule, '1 day');
        await MaintenanceSchedulerService.markReminderSent(schedule.id, 1);
      }
    }

    // Process overdue schedules
    const overdueSchedules = await MaintenanceSchedulerService.getOverdue();

    logger.info(`Found ${overdueSchedules.length} overdue schedules`);

    for (const schedule of overdueSchedules) {
      const daysOverdue = Math.abs(getDaysUntil(schedule.scheduled_date));

      // Send overdue alert (once a week for ongoing overdue items)
      if (daysOverdue === 1 || daysOverdue % 7 === 0) {
        await sendOverdueAlert(schedule, daysOverdue);
      }
    }

    logger.info('Maintenance reminder check completed');
  } catch (error: any) {
    logger.error('Error processing maintenance reminders:', error.message);
  }
}

let scheduledTask: ScheduledTask | null = null;

/**
 * Start the maintenance reminder scheduler
 * Runs daily at 8:00 AM MYT
 */
export function startMaintenanceReminderScheduler(): void {
  // Run daily at 8:00 AM MYT (UTC+8)
  scheduledTask = cron.schedule(
    '0 8 * * *',
    async () => {
      await processReminders();
    },
    {
      timezone: 'Asia/Kuala_Lumpur',
    }
  );

  logger.info('Maintenance reminder scheduler started (daily at 8:00 AM MYT)');
}

/**
 * Stop the maintenance reminder scheduler
 * Call this during graceful shutdown
 */
export function stopMaintenanceReminderScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Maintenance reminder scheduler stopped');
  }
}

/**
 * Manually trigger reminder processing (for testing)
 */
export async function triggerManualReminderCheck(): Promise<void> {
  await processReminders();
}

/**
 * Get scheduler status
 */
export function isSchedulerActive(): boolean {
  return scheduledTask !== null;
}
