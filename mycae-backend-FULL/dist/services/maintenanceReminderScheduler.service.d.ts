/**
 * Start the maintenance reminder scheduler
 * Runs daily at 8:00 AM MYT
 */
export declare function startMaintenanceReminderScheduler(): void;
/**
 * Stop the maintenance reminder scheduler
 * Call this during graceful shutdown
 */
export declare function stopMaintenanceReminderScheduler(): void;
/**
 * Manually trigger reminder processing (for testing)
 */
export declare function triggerManualReminderCheck(): Promise<void>;
/**
 * Get scheduler status
 */
export declare function isSchedulerActive(): boolean;
//# sourceMappingURL=maintenanceReminderScheduler.service.d.ts.map