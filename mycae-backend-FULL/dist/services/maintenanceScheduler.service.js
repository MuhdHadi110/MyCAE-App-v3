"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceSchedulerService = void 0;
const database_1 = require("../config/database");
const ScheduledMaintenance_1 = require("../entities/ScheduledMaintenance");
const MaintenanceTicket_1 = require("../entities/MaintenanceTicket");
const InventoryItem_1 = require("../entities/InventoryItem");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const typeorm_1 = require("typeorm");
class MaintenanceSchedulerService {
    /**
     * Create a new scheduled maintenance
     */
    static async createSchedule(data) {
        const scheduleRepo = this.scheduleRepo();
        const inventoryRepo = this.inventoryRepo();
        // Verify item exists
        const item = await inventoryRepo.findOne({ where: { id: data.item_id } });
        if (!item) {
            throw new Error('Inventory item not found');
        }
        const schedule = scheduleRepo.create({
            id: (0, uuid_1.v4)(),
            item_id: data.item_id,
            maintenance_type: data.maintenance_type,
            description: data.description,
            scheduled_date: data.scheduled_date,
            inventory_action: data.inventory_action,
            quantity_affected: data.quantity_affected || 1,
            created_by: data.created_by,
            is_completed: false,
            reminder_14_sent: false,
            reminder_7_sent: false,
            reminder_1_sent: false,
        });
        const savedSchedule = await scheduleRepo.save(schedule);
        // Update item's next maintenance date if this is sooner
        await this.updateItemNextMaintenanceDate(data.item_id);
        logger_1.logger.info(`Created scheduled maintenance ${savedSchedule.id} for item ${data.item_id}`);
        return savedSchedule;
    }
    /**
     * Update a scheduled maintenance
     */
    static async updateSchedule(id, data) {
        const scheduleRepo = this.scheduleRepo();
        const schedule = await scheduleRepo.findOne({ where: { id } });
        if (!schedule) {
            throw new Error('Scheduled maintenance not found');
        }
        if (schedule.is_completed) {
            throw new Error('Cannot update completed maintenance schedule');
        }
        Object.assign(schedule, data);
        const savedSchedule = await scheduleRepo.save(schedule);
        // Update item's next maintenance date
        await this.updateItemNextMaintenanceDate(schedule.item_id);
        return savedSchedule;
    }
    /**
     * Delete a scheduled maintenance
     */
    static async deleteSchedule(id) {
        const scheduleRepo = this.scheduleRepo();
        const schedule = await scheduleRepo.findOne({ where: { id } });
        if (!schedule) {
            throw new Error('Scheduled maintenance not found');
        }
        const itemId = schedule.item_id;
        await scheduleRepo.remove(schedule);
        // Update item's next maintenance date
        await this.updateItemNextMaintenanceDate(itemId);
        logger_1.logger.info(`Deleted scheduled maintenance ${id}`);
    }
    /**
     * Get all scheduled maintenance with optional filters
     */
    static async getSchedules(filters) {
        const scheduleRepo = this.scheduleRepo();
        const queryBuilder = scheduleRepo
            .createQueryBuilder('schedule')
            .leftJoinAndSelect('schedule.item', 'item')
            .leftJoinAndSelect('schedule.createdByUser', 'creator')
            .leftJoinAndSelect('schedule.completedByUser', 'completer');
        if (filters?.item_id) {
            queryBuilder.andWhere('schedule.item_id = :item_id', { item_id: filters.item_id });
        }
        if (filters?.is_completed !== undefined) {
            queryBuilder.andWhere('schedule.is_completed = :is_completed', { is_completed: filters.is_completed });
        }
        if (filters?.maintenance_type) {
            queryBuilder.andWhere('schedule.maintenance_type = :maintenance_type', { maintenance_type: filters.maintenance_type });
        }
        if (filters?.from_date) {
            queryBuilder.andWhere('schedule.scheduled_date >= :from_date', { from_date: filters.from_date });
        }
        if (filters?.to_date) {
            queryBuilder.andWhere('schedule.scheduled_date <= :to_date', { to_date: filters.to_date });
        }
        queryBuilder.orderBy('schedule.scheduled_date', 'ASC');
        return queryBuilder.getMany();
    }
    /**
     * Get upcoming maintenance (next 30 days, not completed)
     */
    static async getUpcoming() {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return this.getSchedules({
            is_completed: false,
            from_date: now,
            to_date: thirtyDaysFromNow,
        });
    }
    /**
     * Get overdue maintenance (past date, not completed)
     */
    static async getOverdue() {
        const scheduleRepo = this.scheduleRepo();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return scheduleRepo.find({
            where: {
                is_completed: false,
                scheduled_date: (0, typeorm_1.LessThanOrEqual)(now),
            },
            relations: ['item', 'createdByUser'],
            order: { scheduled_date: 'ASC' },
        });
    }
    /**
     * Get schedules that need reminders sent
     */
    static async getSchedulesNeedingReminders() {
        const scheduleRepo = this.scheduleRepo();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        // Get schedules within 14 days that haven't had all reminders sent
        const fourteenDaysFromNow = new Date(now);
        fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
        return scheduleRepo
            .createQueryBuilder('schedule')
            .leftJoinAndSelect('schedule.item', 'item')
            .where('schedule.is_completed = :completed', { completed: false })
            .andWhere('schedule.scheduled_date <= :maxDate', { maxDate: fourteenDaysFromNow })
            .andWhere('schedule.scheduled_date >= :minDate', { minDate: now })
            .andWhere('(schedule.reminder_14_sent = false OR schedule.reminder_7_sent = false OR schedule.reminder_1_sent = false)')
            .getMany();
    }
    /**
     * Mark reminder as sent
     */
    static async markReminderSent(id, days) {
        const scheduleRepo = this.scheduleRepo();
        const update = {};
        if (days === 14)
            update.reminder_14_sent = true;
        if (days === 7)
            update.reminder_7_sent = true;
        if (days === 1)
            update.reminder_1_sent = true;
        await scheduleRepo.update(id, update);
        logger_1.logger.info(`Marked ${days}-day reminder sent for schedule ${id}`);
    }
    /**
     * Mark schedule as completed
     */
    static async markCompleted(id, userId) {
        const scheduleRepo = this.scheduleRepo();
        const schedule = await scheduleRepo.findOne({
            where: { id },
            relations: ['item'],
        });
        if (!schedule) {
            throw new Error('Scheduled maintenance not found');
        }
        schedule.is_completed = true;
        schedule.completed_date = new Date();
        schedule.completed_by = userId;
        const savedSchedule = await scheduleRepo.save(schedule);
        // Update item's next maintenance date
        await this.updateItemNextMaintenanceDate(schedule.item_id);
        logger_1.logger.info(`Marked scheduled maintenance ${id} as completed`);
        return savedSchedule;
    }
    /**
     * Create a maintenance ticket from scheduled maintenance
     */
    static async createTicketFromSchedule(scheduleId, userId) {
        const scheduleRepo = this.scheduleRepo();
        const ticketRepo = this.ticketRepo();
        const schedule = await scheduleRepo.findOne({
            where: { id: scheduleId },
            relations: ['item'],
        });
        if (!schedule) {
            throw new Error('Scheduled maintenance not found');
        }
        if (schedule.ticket_id) {
            throw new Error('Ticket already created for this schedule');
        }
        // Create the ticket
        const ticket = ticketRepo.create({
            id: (0, uuid_1.v4)(),
            item_id: schedule.item_id,
            reported_by: userId,
            title: `${this.formatMaintenanceType(schedule.maintenance_type)} - ${schedule.item?.title || 'Unknown Item'}`,
            description: schedule.description || `Scheduled ${schedule.maintenance_type} maintenance`,
            priority: MaintenanceTicket_1.TicketPriority.MEDIUM,
            status: MaintenanceTicket_1.TicketStatus.OPEN,
            reported_date: new Date(),
            category: schedule.maintenance_type,
            scheduled_maintenance_id: schedule.id,
            inventory_action: schedule.inventory_action,
            quantity_deducted: 0,
            inventory_restored: false,
        });
        const savedTicket = await ticketRepo.save(ticket);
        // Update the schedule with ticket ID
        schedule.ticket_id = savedTicket.id;
        await scheduleRepo.save(schedule);
        // Apply inventory action if needed
        if (schedule.inventory_action !== ScheduledMaintenance_1.InventoryAction.NONE) {
            await this.applyInventoryAction(savedTicket.id);
        }
        logger_1.logger.info(`Created ticket ${savedTicket.id} from schedule ${scheduleId}`);
        return savedTicket;
    }
    /**
     * Apply inventory action when maintenance starts
     */
    static async applyInventoryAction(ticketId) {
        const ticketRepo = this.ticketRepo();
        const inventoryRepo = this.inventoryRepo();
        const ticket = await ticketRepo.findOne({
            where: { id: ticketId },
            relations: ['item', 'scheduledMaintenance'],
        });
        if (!ticket || !ticket.inventory_action || ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.NONE) {
            return;
        }
        const item = await inventoryRepo.findOne({ where: { id: ticket.item_id } });
        if (!item) {
            throw new Error('Inventory item not found');
        }
        const quantity = ticket.scheduledMaintenance?.quantity_affected || 1;
        if (ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.DEDUCT) {
            // Deduct from quantity
            if (item.quantity < quantity) {
                throw new Error('Insufficient quantity to deduct');
            }
            item.quantity -= quantity;
            ticket.quantity_deducted = quantity;
            // Update status based on new quantity
            if (item.quantity === 0) {
                item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
            }
            else if (item.quantity <= item.minimumStock) {
                item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
            }
        }
        else if (ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.STATUS_ONLY) {
            // Just update in_maintenance_quantity
            item.in_maintenance_quantity += quantity;
            ticket.quantity_deducted = quantity;
            // Update status if all quantity is in maintenance
            if (item.in_maintenance_quantity >= item.quantity) {
                item.status = InventoryItem_1.InventoryStatus.IN_MAINTENANCE;
            }
        }
        await inventoryRepo.save(item);
        await ticketRepo.save(ticket);
        logger_1.logger.info(`Applied inventory action for ticket ${ticketId}: ${ticket.inventory_action}, quantity: ${quantity}`);
    }
    /**
     * Restore inventory when maintenance completes
     */
    static async restoreInventory(ticketId) {
        const ticketRepo = this.ticketRepo();
        const inventoryRepo = this.inventoryRepo();
        const ticket = await ticketRepo.findOne({
            where: { id: ticketId },
            relations: ['item'],
        });
        if (!ticket || ticket.inventory_restored || !ticket.inventory_action || ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.NONE) {
            return;
        }
        const item = await inventoryRepo.findOne({ where: { id: ticket.item_id } });
        if (!item) {
            throw new Error('Inventory item not found');
        }
        const quantity = ticket.quantity_deducted;
        if (ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.DEDUCT) {
            // Restore quantity
            item.quantity += quantity;
        }
        else if (ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.STATUS_ONLY) {
            // Decrease in_maintenance_quantity
            item.in_maintenance_quantity = Math.max(0, item.in_maintenance_quantity - quantity);
        }
        // Update status based on new quantity
        if (item.quantity === 0) {
            item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
        }
        else if (item.in_maintenance_quantity > 0 && item.in_maintenance_quantity >= item.quantity) {
            item.status = InventoryItem_1.InventoryStatus.IN_MAINTENANCE;
        }
        else if (item.quantity <= item.minimumStock) {
            item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
        }
        else {
            item.status = InventoryItem_1.InventoryStatus.AVAILABLE;
        }
        ticket.inventory_restored = true;
        await inventoryRepo.save(item);
        await ticketRepo.save(ticket);
        logger_1.logger.info(`Restored inventory for ticket ${ticketId}: action was ${ticket.inventory_action}, quantity: ${quantity}`);
    }
    /**
     * Update item's next maintenance date based on upcoming schedules
     */
    static async updateItemNextMaintenanceDate(itemId) {
        const scheduleRepo = this.scheduleRepo();
        const inventoryRepo = this.inventoryRepo();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        // Find the next upcoming uncompleted schedule for this item
        const nextSchedule = await scheduleRepo.findOne({
            where: {
                item_id: itemId,
                is_completed: false,
                scheduled_date: (0, typeorm_1.MoreThanOrEqual)(now),
            },
            order: { scheduled_date: 'ASC' },
        });
        await inventoryRepo.update(itemId, {
            next_maintenance_date: nextSchedule?.scheduled_date ?? undefined,
        });
    }
    /**
     * Format maintenance type for display
     */
    static formatMaintenanceType(type) {
        const labels = {
            [ScheduledMaintenance_1.MaintenanceType.CALIBRATION]: 'Calibration',
            [ScheduledMaintenance_1.MaintenanceType.INSPECTION]: 'Inspection',
            [ScheduledMaintenance_1.MaintenanceType.SERVICING]: 'Servicing',
            [ScheduledMaintenance_1.MaintenanceType.REPLACEMENT]: 'Replacement',
            [ScheduledMaintenance_1.MaintenanceType.OTHER]: 'Maintenance',
        };
        return labels[type] || 'Maintenance';
    }
    /**
     * Get statistics for scheduled maintenance
     */
    static async getStats() {
        const scheduleRepo = this.scheduleRepo();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const [total, upcoming, overdue, completedThisMonth] = await Promise.all([
            scheduleRepo.count(),
            scheduleRepo.count({
                where: {
                    is_completed: false,
                    scheduled_date: (0, typeorm_1.MoreThanOrEqual)(now),
                },
            }),
            scheduleRepo.count({
                where: {
                    is_completed: false,
                    scheduled_date: (0, typeorm_1.LessThanOrEqual)(now),
                },
            }),
            scheduleRepo.count({
                where: {
                    is_completed: true,
                    completed_date: (0, typeorm_1.MoreThanOrEqual)(firstOfMonth),
                },
            }),
        ]);
        return { total, upcoming, overdue, completedThisMonth };
    }
}
exports.MaintenanceSchedulerService = MaintenanceSchedulerService;
MaintenanceSchedulerService.scheduleRepo = () => database_1.AppDataSource.getRepository(ScheduledMaintenance_1.ScheduledMaintenance);
MaintenanceSchedulerService.ticketRepo = () => database_1.AppDataSource.getRepository(MaintenanceTicket_1.MaintenanceTicket);
MaintenanceSchedulerService.inventoryRepo = () => database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
//# sourceMappingURL=maintenanceScheduler.service.js.map