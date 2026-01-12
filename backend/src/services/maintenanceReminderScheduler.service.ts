import cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { ScheduledMaintenance } from '../entities/ScheduledMaintenance';
import { User } from '../entities/User';
import { MaintenanceSchedulerService } from './maintenanceScheduler.service';
import emailService from './email.service';
import { logger } from '../utils/logger';
import { LessThanOrEqual, MoreThanOrEqual, LessThan } from 'typeorm';

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
 * Get admin users to receive notifications
 */
async function getAdminUsers(): Promise<User[]> {
  const userRepo = AppDataSource.getRepository(User);

  // Get users with admin or manager roles
  const users = await userRepo
    .createQueryBuilder('user')
    .where("user.roles LIKE '%admin%'")
    .orWhere("user.roles LIKE '%manager%'")
    .orWhere("user.roles LIKE '%managing-director%'")
    .getMany();

  return users.filter(u => u.email);
}

/**
 * Send reminder for a scheduled maintenance
 */
async function sendReminder(
  schedule: ScheduledMaintenance,
  timeframe: string,
  adminUsers: User[]
): Promise<void> {
  const itemName = schedule.item?.title || 'Unknown Item';
  const maintenanceType = formatMaintenanceType(schedule.maintenance_type);

  // Send email to all admin users
  for (const admin of adminUsers) {
    try {
      await emailService.sendMaintenanceReminder(
        admin.email,
        admin.name,
        itemName,
        maintenanceType,
        schedule.scheduled_date,
        timeframe
      );
      logger.info(`Sent ${timeframe} reminder to ${admin.email} for schedule ${schedule.id}`);
    } catch (error: any) {
      logger.error(`Failed to send reminder to ${admin.email}:`, error.message);
    }
  }
}

/**
 * Send overdue alert for a scheduled maintenance
 */
async function sendOverdueAlert(
  schedule: ScheduledMaintenance,
  daysOverdue: number,
  adminUsers: User[]
): Promise<void> {
  const itemName = schedule.item?.title || 'Unknown Item';
  const maintenanceType = formatMaintenanceType(schedule.maintenance_type);

  // Send email to all admin users
  for (const admin of adminUsers) {
    try {
      await emailService.sendMaintenanceOverdueAlert(
        admin.email,
        admin.name,
        itemName,
        maintenanceType,
        schedule.scheduled_date,
        daysOverdue
      );
      logger.info(`Sent overdue alert to ${admin.email} for schedule ${schedule.id}`);
    } catch (error: any) {
      logger.error(`Failed to send overdue alert to ${admin.email}:`, error.message);
    }
  }
}

/**
 * Process scheduled maintenance reminders
 */
async function processReminders(): Promise<void> {
  logger.info('Starting maintenance reminder check...');

  try {
    // Get admin users to notify
    const adminUsers = await getAdminUsers();

    if (adminUsers.length === 0) {
      logger.warn('No admin users found to receive maintenance reminders');
      return;
    }

    // Get schedules needing reminders
    const schedules = await MaintenanceSchedulerService.getSchedulesNeedingReminders();

    logger.info(`Found ${schedules.length} schedules to check for reminders`);

    for (const schedule of schedules) {
      const daysUntil = getDaysUntil(schedule.scheduled_date);

      // 14-day reminder
      if (daysUntil === 14 && !schedule.reminder_14_sent) {
        await sendReminder(schedule, '14 days', adminUsers);
        await MaintenanceSchedulerService.markReminderSent(schedule.id, 14);
      }

      // 7-day reminder
      if (daysUntil === 7 && !schedule.reminder_7_sent) {
        await sendReminder(schedule, '7 days', adminUsers);
        await MaintenanceSchedulerService.markReminderSent(schedule.id, 7);
      }

      // 1-day reminder
      if (daysUntil === 1 && !schedule.reminder_1_sent) {
        await sendReminder(schedule, '1 day', adminUsers);
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
        await sendOverdueAlert(schedule, daysOverdue, adminUsers);
      }
    }

    logger.info('Maintenance reminder check completed');
  } catch (error: any) {
    logger.error('Error processing maintenance reminders:', error.message);
  }
}

/**
 * Start the maintenance reminder scheduler
 * Runs daily at 8:00 AM MYT
 */
export function startMaintenanceReminderScheduler(): void {
  // Run daily at 8:00 AM MYT (UTC+8)
  cron.schedule(
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
 * Manually trigger reminder processing (for testing)
 */
export async function triggerManualReminderCheck(): Promise<void> {
  await processReminders();
}

/**
 * Get scheduler status
 */
export function isSchedulerActive(): boolean {
  return true; // node-cron jobs are always active once started
}
