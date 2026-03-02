import { ScheduledMaintenance, MaintenanceType, InventoryAction } from '../entities/ScheduledMaintenance';
import { MaintenanceTicket } from '../entities/MaintenanceTicket';
interface CreateScheduleDTO {
    item_id: string;
    maintenance_type: MaintenanceType;
    description?: string;
    scheduled_date: Date;
    inventory_action: InventoryAction;
    quantity_affected?: number;
    created_by?: string;
}
interface UpdateScheduleDTO {
    maintenance_type?: MaintenanceType;
    description?: string;
    scheduled_date?: Date;
    inventory_action?: InventoryAction;
    quantity_affected?: number;
}
export declare class MaintenanceSchedulerService {
    private static scheduleRepo;
    private static ticketRepo;
    private static inventoryRepo;
    /**
     * Create a new scheduled maintenance
     */
    static createSchedule(data: CreateScheduleDTO): Promise<ScheduledMaintenance>;
    /**
     * Update a scheduled maintenance
     */
    static updateSchedule(id: string, data: UpdateScheduleDTO): Promise<ScheduledMaintenance>;
    /**
     * Delete a scheduled maintenance
     */
    static deleteSchedule(id: string): Promise<void>;
    /**
     * Get all scheduled maintenance with optional filters
     */
    static getSchedules(filters?: {
        item_id?: string;
        is_completed?: boolean;
        maintenance_type?: MaintenanceType;
        from_date?: Date;
        to_date?: Date;
    }): Promise<ScheduledMaintenance[]>;
    /**
     * Get upcoming maintenance (next 30 days, not completed)
     */
    static getUpcoming(): Promise<ScheduledMaintenance[]>;
    /**
     * Get overdue maintenance (past date, not completed)
     */
    static getOverdue(): Promise<ScheduledMaintenance[]>;
    /**
     * Get schedules that need reminders sent
     */
    static getSchedulesNeedingReminders(): Promise<ScheduledMaintenance[]>;
    /**
     * Mark reminder as sent
     */
    static markReminderSent(id: string, days: 14 | 7 | 1): Promise<void>;
    /**
     * Mark schedule as completed
     */
    static markCompleted(id: string, userId: string): Promise<ScheduledMaintenance>;
    /**
     * Create a maintenance ticket from scheduled maintenance
     */
    static createTicketFromSchedule(scheduleId: string, userId: string): Promise<MaintenanceTicket>;
    /**
     * Apply inventory action when maintenance starts
     */
    static applyInventoryAction(ticketId: string): Promise<void>;
    /**
     * Restore inventory when maintenance completes
     */
    static restoreInventory(ticketId: string): Promise<void>;
    /**
     * Update item's next maintenance date based on upcoming schedules
     */
    private static updateItemNextMaintenanceDate;
    /**
     * Format maintenance type for display
     */
    private static formatMaintenanceType;
    /**
     * Get statistics for scheduled maintenance
     */
    static getStats(): Promise<{
        total: number;
        upcoming: number;
        overdue: number;
        completedThisMonth: number;
    }>;
}
export {};
//# sourceMappingURL=maintenanceScheduler.service.d.ts.map