import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { MaintenanceSchedulerService } from '../services/maintenanceScheduler.service';
import { MaintenanceType, InventoryAction } from '../entities/ScheduledMaintenance';
import { triggerManualReminderCheck } from '../services/maintenanceReminderScheduler.service';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/scheduled-maintenance
 * Get all scheduled maintenance with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { item_id, is_completed, maintenance_type, from_date, to_date } = req.query;

    const filters: {
      item_id?: string;
      is_completed?: boolean;
      maintenance_type?: MaintenanceType;
      from_date?: Date;
      to_date?: Date;
    } = {};

    if (item_id) filters.item_id = item_id as string;
    if (is_completed !== undefined) filters.is_completed = is_completed === 'true';
    if (maintenance_type) filters.maintenance_type = maintenance_type as MaintenanceType;
    if (from_date) filters.from_date = new Date(from_date as string);
    if (to_date) filters.to_date = new Date(to_date as string);

    const schedules = await MaintenanceSchedulerService.getSchedules(filters);

    res.json(schedules);
  } catch (error: any) {
    logger.error('Error fetching scheduled maintenance:', error);
    res.status(500).json({ message: 'Failed to fetch scheduled maintenance' });
  }
});

/**
 * GET /api/scheduled-maintenance/upcoming
 * Get upcoming maintenance (next 30 days)
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const schedules = await MaintenanceSchedulerService.getUpcoming();
    res.json(schedules);
  } catch (error: any) {
    logger.error('Error fetching upcoming maintenance:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming maintenance' });
  }
});

/**
 * GET /api/scheduled-maintenance/overdue
 * Get overdue maintenance
 */
router.get('/overdue', async (req: Request, res: Response) => {
  try {
    const schedules = await MaintenanceSchedulerService.getOverdue();
    res.json(schedules);
  } catch (error: any) {
    logger.error('Error fetching overdue maintenance:', error);
    res.status(500).json({ message: 'Failed to fetch overdue maintenance' });
  }
});

/**
 * GET /api/scheduled-maintenance/stats
 * Get maintenance statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await MaintenanceSchedulerService.getStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Error fetching maintenance stats:', error);
    res.status(500).json({ message: 'Failed to fetch maintenance stats' });
  }
});

/**
 * GET /api/scheduled-maintenance/item/:itemId
 * Get scheduled maintenance for a specific item
 */
router.get('/item/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const schedules = await MaintenanceSchedulerService.getSchedules({ item_id: itemId });
    res.json(schedules);
  } catch (error: any) {
    logger.error('Error fetching item maintenance:', error);
    res.status(500).json({ message: 'Failed to fetch item maintenance' });
  }
});

/**
 * GET /api/scheduled-maintenance/:id
 * Get single scheduled maintenance by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedules = await MaintenanceSchedulerService.getSchedules();
    const schedule = schedules.find(s => s.id === id);

    if (!schedule) {
      return res.status(404).json({ message: 'Scheduled maintenance not found' });
    }

    res.json(schedule);
  } catch (error: any) {
    logger.error('Error fetching scheduled maintenance:', error);
    res.status(500).json({ message: 'Failed to fetch scheduled maintenance' });
  }
});

/**
 * POST /api/scheduled-maintenance
 * Create new scheduled maintenance
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { item_id, maintenance_type, description, scheduled_date, inventory_action, quantity_affected } = req.body;

    // Validation
    if (!item_id) {
      return res.status(400).json({ message: 'Item ID is required' });
    }
    if (!maintenance_type) {
      return res.status(400).json({ message: 'Maintenance type is required' });
    }
    if (!scheduled_date) {
      return res.status(400).json({ message: 'Scheduled date is required' });
    }

    const schedule = await MaintenanceSchedulerService.createSchedule({
      item_id,
      maintenance_type: maintenance_type as MaintenanceType,
      description,
      scheduled_date: new Date(scheduled_date),
      inventory_action: (inventory_action as InventoryAction) || InventoryAction.NONE,
      quantity_affected: quantity_affected || 1,
      created_by: user.id,
    });

    res.status(201).json(schedule);
  } catch (error: any) {
    logger.error('Error creating scheduled maintenance:', error);
    res.status(500).json({ message: error.message || 'Failed to create scheduled maintenance' });
  }
});

/**
 * PUT /api/scheduled-maintenance/:id
 * Update scheduled maintenance
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { maintenance_type, description, scheduled_date, inventory_action, quantity_affected } = req.body;

    const updateData: {
      maintenance_type?: MaintenanceType;
      description?: string;
      scheduled_date?: Date;
      inventory_action?: InventoryAction;
      quantity_affected?: number;
    } = {};

    if (maintenance_type) updateData.maintenance_type = maintenance_type as MaintenanceType;
    if (description !== undefined) updateData.description = description;
    if (scheduled_date) updateData.scheduled_date = new Date(scheduled_date);
    if (inventory_action) updateData.inventory_action = inventory_action as InventoryAction;
    if (quantity_affected !== undefined) updateData.quantity_affected = quantity_affected;

    const schedule = await MaintenanceSchedulerService.updateSchedule(id, updateData);

    res.json(schedule);
  } catch (error: any) {
    logger.error('Error updating scheduled maintenance:', error);
    res.status(500).json({ message: error.message || 'Failed to update scheduled maintenance' });
  }
});

/**
 * DELETE /api/scheduled-maintenance/:id
 * Delete scheduled maintenance
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await MaintenanceSchedulerService.deleteSchedule(id);

    res.json({ message: 'Scheduled maintenance deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting scheduled maintenance:', error);
    res.status(500).json({ message: error.message || 'Failed to delete scheduled maintenance' });
  }
});

/**
 * POST /api/scheduled-maintenance/:id/complete
 * Mark scheduled maintenance as completed
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const schedule = await MaintenanceSchedulerService.markCompleted(id, user.id);

    res.json(schedule);
  } catch (error: any) {
    logger.error('Error completing scheduled maintenance:', error);
    res.status(500).json({ message: error.message || 'Failed to complete scheduled maintenance' });
  }
});

/**
 * POST /api/scheduled-maintenance/:id/create-ticket
 * Create a maintenance ticket from scheduled maintenance
 */
router.post('/:id/create-ticket', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const ticket = await MaintenanceSchedulerService.createTicketFromSchedule(id, user.id);

    res.status(201).json(ticket);
  } catch (error: any) {
    logger.error('Error creating ticket from schedule:', error);
    res.status(500).json({ message: error.message || 'Failed to create ticket from schedule' });
  }
});

/**
 * POST /api/scheduled-maintenance/trigger-reminders
 * Manually trigger reminder check (admin only)
 */
router.post('/trigger-reminders', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Check admin permission
    if (!user.roles?.includes('admin') && user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await triggerManualReminderCheck();

    res.json({ message: 'Reminder check triggered successfully' });
  } catch (error: any) {
    logger.error('Error triggering reminders:', error);
    res.status(500).json({ message: 'Failed to trigger reminder check' });
  }
});

export default router;
