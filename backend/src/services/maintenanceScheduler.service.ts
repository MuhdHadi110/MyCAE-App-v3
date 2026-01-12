import { AppDataSource } from '../config/database';
import { ScheduledMaintenance, MaintenanceType, InventoryAction } from '../entities/ScheduledMaintenance';
import { MaintenanceTicket, TicketStatus, TicketPriority } from '../entities/MaintenanceTicket';
import { InventoryItem, InventoryStatus } from '../entities/InventoryItem';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { LessThanOrEqual, MoreThanOrEqual, IsNull, Not } from 'typeorm';

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

export class MaintenanceSchedulerService {
  private static scheduleRepo = () => AppDataSource.getRepository(ScheduledMaintenance);
  private static ticketRepo = () => AppDataSource.getRepository(MaintenanceTicket);
  private static inventoryRepo = () => AppDataSource.getRepository(InventoryItem);

  /**
   * Create a new scheduled maintenance
   */
  static async createSchedule(data: CreateScheduleDTO): Promise<ScheduledMaintenance> {
    const scheduleRepo = this.scheduleRepo();
    const inventoryRepo = this.inventoryRepo();

    // Verify item exists
    const item = await inventoryRepo.findOne({ where: { id: data.item_id } });
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const schedule = scheduleRepo.create({
      id: uuidv4(),
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

    logger.info(`Created scheduled maintenance ${savedSchedule.id} for item ${data.item_id}`);
    return savedSchedule;
  }

  /**
   * Update a scheduled maintenance
   */
  static async updateSchedule(id: string, data: UpdateScheduleDTO): Promise<ScheduledMaintenance> {
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
  static async deleteSchedule(id: string): Promise<void> {
    const scheduleRepo = this.scheduleRepo();

    const schedule = await scheduleRepo.findOne({ where: { id } });
    if (!schedule) {
      throw new Error('Scheduled maintenance not found');
    }

    const itemId = schedule.item_id;
    await scheduleRepo.remove(schedule);

    // Update item's next maintenance date
    await this.updateItemNextMaintenanceDate(itemId);

    logger.info(`Deleted scheduled maintenance ${id}`);
  }

  /**
   * Get all scheduled maintenance with optional filters
   */
  static async getSchedules(filters?: {
    item_id?: string;
    is_completed?: boolean;
    maintenance_type?: MaintenanceType;
    from_date?: Date;
    to_date?: Date;
  }): Promise<ScheduledMaintenance[]> {
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
  static async getUpcoming(): Promise<ScheduledMaintenance[]> {
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
  static async getOverdue(): Promise<ScheduledMaintenance[]> {
    const scheduleRepo = this.scheduleRepo();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return scheduleRepo.find({
      where: {
        is_completed: false,
        scheduled_date: LessThanOrEqual(now),
      },
      relations: ['item', 'createdByUser'],
      order: { scheduled_date: 'ASC' },
    });
  }

  /**
   * Get schedules that need reminders sent
   */
  static async getSchedulesNeedingReminders(): Promise<ScheduledMaintenance[]> {
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
      .andWhere(
        '(schedule.reminder_14_sent = false OR schedule.reminder_7_sent = false OR schedule.reminder_1_sent = false)'
      )
      .getMany();
  }

  /**
   * Mark reminder as sent
   */
  static async markReminderSent(id: string, days: 14 | 7 | 1): Promise<void> {
    const scheduleRepo = this.scheduleRepo();

    const update: Partial<ScheduledMaintenance> = {};
    if (days === 14) update.reminder_14_sent = true;
    if (days === 7) update.reminder_7_sent = true;
    if (days === 1) update.reminder_1_sent = true;

    await scheduleRepo.update(id, update);
    logger.info(`Marked ${days}-day reminder sent for schedule ${id}`);
  }

  /**
   * Mark schedule as completed
   */
  static async markCompleted(id: string, userId: string): Promise<ScheduledMaintenance> {
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

    logger.info(`Marked scheduled maintenance ${id} as completed`);
    return savedSchedule;
  }

  /**
   * Create a maintenance ticket from scheduled maintenance
   */
  static async createTicketFromSchedule(
    scheduleId: string,
    userId: string
  ): Promise<MaintenanceTicket> {
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
      id: uuidv4(),
      item_id: schedule.item_id,
      reported_by: userId,
      title: `${this.formatMaintenanceType(schedule.maintenance_type)} - ${schedule.item?.title || 'Unknown Item'}`,
      description: schedule.description || `Scheduled ${schedule.maintenance_type} maintenance`,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
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
    if (schedule.inventory_action !== InventoryAction.NONE) {
      await this.applyInventoryAction(savedTicket.id);
    }

    logger.info(`Created ticket ${savedTicket.id} from schedule ${scheduleId}`);
    return savedTicket;
  }

  /**
   * Apply inventory action when maintenance starts
   */
  static async applyInventoryAction(ticketId: string): Promise<void> {
    const ticketRepo = this.ticketRepo();
    const inventoryRepo = this.inventoryRepo();

    const ticket = await ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['item', 'scheduledMaintenance'],
    });

    if (!ticket || !ticket.inventory_action || ticket.inventory_action === InventoryAction.NONE) {
      return;
    }

    const item = await inventoryRepo.findOne({ where: { id: ticket.item_id } });
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const quantity = ticket.scheduledMaintenance?.quantity_affected || 1;

    if (ticket.inventory_action === InventoryAction.DEDUCT) {
      // Deduct from quantity
      if (item.quantity < quantity) {
        throw new Error('Insufficient quantity to deduct');
      }

      item.quantity -= quantity;
      ticket.quantity_deducted = quantity;

      // Update status based on new quantity
      if (item.quantity === 0) {
        item.status = InventoryStatus.OUT_OF_STOCK;
      } else if (item.quantity <= item.minimumStock) {
        item.status = InventoryStatus.LOW_STOCK;
      }

    } else if (ticket.inventory_action === InventoryAction.STATUS_ONLY) {
      // Just update in_maintenance_quantity
      item.in_maintenance_quantity += quantity;
      ticket.quantity_deducted = quantity;

      // Update status if all quantity is in maintenance
      if (item.in_maintenance_quantity >= item.quantity) {
        item.status = InventoryStatus.IN_MAINTENANCE;
      }
    }

    await inventoryRepo.save(item);
    await ticketRepo.save(ticket);

    logger.info(`Applied inventory action for ticket ${ticketId}: ${ticket.inventory_action}, quantity: ${quantity}`);
  }

  /**
   * Restore inventory when maintenance completes
   */
  static async restoreInventory(ticketId: string): Promise<void> {
    const ticketRepo = this.ticketRepo();
    const inventoryRepo = this.inventoryRepo();

    const ticket = await ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['item'],
    });

    if (!ticket || ticket.inventory_restored || !ticket.inventory_action || ticket.inventory_action === InventoryAction.NONE) {
      return;
    }

    const item = await inventoryRepo.findOne({ where: { id: ticket.item_id } });
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const quantity = ticket.quantity_deducted;

    if (ticket.inventory_action === InventoryAction.DEDUCT) {
      // Restore quantity
      item.quantity += quantity;

    } else if (ticket.inventory_action === InventoryAction.STATUS_ONLY) {
      // Decrease in_maintenance_quantity
      item.in_maintenance_quantity = Math.max(0, item.in_maintenance_quantity - quantity);
    }

    // Update status based on new quantity
    if (item.quantity === 0) {
      item.status = InventoryStatus.OUT_OF_STOCK;
    } else if (item.in_maintenance_quantity > 0 && item.in_maintenance_quantity >= item.quantity) {
      item.status = InventoryStatus.IN_MAINTENANCE;
    } else if (item.quantity <= item.minimumStock) {
      item.status = InventoryStatus.LOW_STOCK;
    } else {
      item.status = InventoryStatus.AVAILABLE;
    }

    ticket.inventory_restored = true;

    await inventoryRepo.save(item);
    await ticketRepo.save(ticket);

    logger.info(`Restored inventory for ticket ${ticketId}: action was ${ticket.inventory_action}, quantity: ${quantity}`);
  }

  /**
   * Update item's next maintenance date based on upcoming schedules
   */
  private static async updateItemNextMaintenanceDate(itemId: string): Promise<void> {
    const scheduleRepo = this.scheduleRepo();
    const inventoryRepo = this.inventoryRepo();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find the next upcoming uncompleted schedule for this item
    const nextSchedule = await scheduleRepo.findOne({
      where: {
        item_id: itemId,
        is_completed: false,
        scheduled_date: MoreThanOrEqual(now),
      },
      order: { scheduled_date: 'ASC' },
    });

    await inventoryRepo.update(itemId, {
      next_maintenance_date: nextSchedule?.scheduled_date ?? undefined,
    } as any);
  }

  /**
   * Format maintenance type for display
   */
  private static formatMaintenanceType(type: MaintenanceType): string {
    const labels: Record<MaintenanceType, string> = {
      [MaintenanceType.CALIBRATION]: 'Calibration',
      [MaintenanceType.INSPECTION]: 'Inspection',
      [MaintenanceType.SERVICING]: 'Servicing',
      [MaintenanceType.REPLACEMENT]: 'Replacement',
      [MaintenanceType.OTHER]: 'Maintenance',
    };
    return labels[type] || 'Maintenance';
  }

  /**
   * Get statistics for scheduled maintenance
   */
  static async getStats(): Promise<{
    total: number;
    upcoming: number;
    overdue: number;
    completedThisMonth: number;
  }> {
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
          scheduled_date: MoreThanOrEqual(now),
        },
      }),
      scheduleRepo.count({
        where: {
          is_completed: false,
          scheduled_date: LessThanOrEqual(now),
        },
      }),
      scheduleRepo.count({
        where: {
          is_completed: true,
          completed_date: MoreThanOrEqual(firstOfMonth),
        },
      }),
    ]);

    return { total, upcoming, overdue, completedThisMonth };
  }
}
