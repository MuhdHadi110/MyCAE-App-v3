import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { MaintenanceTicket, TicketStatus, TicketPriority } from '../entities/MaintenanceTicket';
import { InventoryItem, InventoryStatus } from '../entities/InventoryItem';
import { InventoryAction } from '../entities/ScheduledMaintenance';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';
import { MaintenanceSchedulerService } from '../services/maintenanceScheduler.service';
import { logger } from '../utils/logger';

const router = Router();

// All maintenance routes require authentication
router.use(authenticate);

/**
 * GET /api/maintenance
 * Get all maintenance tickets with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, itemId, search } = req.query;
    const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);

    let query = maintenanceRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.item', 'item')
      .leftJoinAndSelect('ticket.reporter', 'reporter')
      .leftJoinAndSelect('ticket.assignee', 'assignee')
      .orderBy('ticket.created_at', 'DESC');

    if (status) {
      query = query.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      query = query.andWhere('ticket.priority = :priority', { priority });
    }

    if (itemId) {
      query = query.andWhere('ticket.item_id = :itemId', { itemId });
    }

    if (search) {
      query = query.andWhere(
        '(ticket.title LIKE :search OR ticket.description LIKE :search OR item.title LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const tickets = await query.getMany();
    res.json(tickets);
  } catch (error: any) {
    logger.error('Error fetching maintenance tickets', { error });
    res.status(500).json({ error: 'Failed to fetch maintenance tickets' });
  }
});

/**
 * GET /api/maintenance/:id
 * Get single maintenance ticket
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);
    const ticket = await maintenanceRepo.findOne({
      where: { id: req.params.id },
      relations: ['item', 'reporter', 'assignee'],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    logger.error('Error fetching maintenance ticket', { error });
    res.status(500).json({ error: 'Failed to fetch maintenance ticket' });
  }
});

/**
 * POST /api/maintenance
 * Create new maintenance ticket
 */
router.post(
  '/',
  [
    body('itemId').notEmpty().withMessage('Item is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').isIn(Object.values(TicketPriority)).withMessage('Invalid priority'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { itemId, title, description, priority, category, assignedTo, inventory_action, quantity_affected } = req.body;

      // Validate item exists
      const inventoryRepo = AppDataSource.getRepository(InventoryItem);
      const item = await inventoryRepo.findOne({ where: { id: itemId } });
      if (!item) {
        return res.status(400).json({ error: 'Inventory item not found' });
      }

      const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);
      const ticket = maintenanceRepo.create({
        item_id: itemId,
        title,
        description,
        priority: priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        reported_by: req.user?.id,
        reported_date: new Date(),
        category,
        assigned_to: assignedTo,
        inventory_action: inventory_action as InventoryAction || null,
        quantity_deducted: 0,
        inventory_restored: false,
      });

      await maintenanceRepo.save(ticket);

      // Apply inventory action if specified
      if (inventory_action && inventory_action !== InventoryAction.NONE) {
        const qty = quantity_affected || 1;

        if (inventory_action === InventoryAction.DEDUCT) {
          // Deduct from quantity
          if (item.quantity < qty) {
            return res.status(400).json({ error: 'Insufficient quantity to deduct' });
          }

          item.quantity -= qty;
          ticket.quantity_deducted = qty;

          // Update status based on new quantity
          if (item.quantity === 0) {
            item.status = InventoryStatus.OUT_OF_STOCK;
          } else if (item.quantity <= item.minimumStock) {
            item.status = InventoryStatus.LOW_STOCK;
          }

        } else if (inventory_action === InventoryAction.STATUS_ONLY) {
          // Just update in_maintenance_quantity
          item.in_maintenance_quantity = (item.in_maintenance_quantity || 0) + qty;
          ticket.quantity_deducted = qty;

          // Update status if all quantity is in maintenance
          if (item.in_maintenance_quantity >= item.quantity) {
            item.status = InventoryStatus.IN_MAINTENANCE;
          }
        }

        await inventoryRepo.save(item);
        await maintenanceRepo.save(ticket);

        logger.info(`Applied inventory action ${inventory_action} for ticket ${ticket.id}, qty: ${qty}`);
      }

      // Load relations
      const savedTicket = await maintenanceRepo.findOne({
        where: { id: ticket.id },
        relations: ['item', 'reporter', 'assignee'],
      });

      res.status(201).json(savedTicket);
    } catch (error: any) {
      logger.error('Error creating maintenance ticket', { error });
      res.status(500).json({ error: 'Failed to create maintenance ticket' });
    }
  }
);

/**
 * PUT /api/maintenance/:id
 * Update maintenance ticket
 * Authorization: Engineers and above
 */
router.put('/:id', authorize(UserRole.ENGINEER, UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
    const ticket = await maintenanceRepo.findOne({
      where: { id: req.params.id },
      relations: ['item'],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    const previousStatus = ticket.status;
    const newStatus = req.body.status;

    // If status is being changed to RESOLVED or CLOSED, set resolved_date
    if (
      (newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.CLOSED) &&
      previousStatus !== TicketStatus.RESOLVED &&
      previousStatus !== TicketStatus.CLOSED
    ) {
      req.body.resolved_date = new Date();

      // Restore inventory if not already restored
      if (ticket.inventory_action && !ticket.inventory_restored && ticket.quantity_deducted > 0) {
        const item = await inventoryRepo.findOne({ where: { id: ticket.item_id } });

        if (item) {
          if (ticket.inventory_action === InventoryAction.DEDUCT) {
            // Restore quantity
            item.quantity += ticket.quantity_deducted;
          } else if (ticket.inventory_action === InventoryAction.STATUS_ONLY) {
            // Decrease in_maintenance_quantity
            item.in_maintenance_quantity = Math.max(0, (item.in_maintenance_quantity || 0) - ticket.quantity_deducted);
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

          await inventoryRepo.save(item);
          req.body.inventory_restored = true;

          logger.info(`Restored inventory for ticket ${ticket.id}: action was ${ticket.inventory_action}, qty: ${ticket.quantity_deducted}`);
        }
      }
    }

    maintenanceRepo.merge(ticket, req.body);
    await maintenanceRepo.save(ticket);

    // Auto-complete linked schedule if ticket was created from one
    if (ticket.scheduled_maintenance_id) {
      const { MaintenanceSchedulerService } = require('../services/maintenanceScheduler.service');
      try {
        await MaintenanceSchedulerService.markCompleted(
          ticket.scheduled_maintenance_id,
          req.user?.id || 'system'
        );
        logger.info(
          `Auto-completed schedule ${ticket.scheduled_maintenance_id} when ticket ${ticket.id} was resolved`
        );
      } catch (error) {
        logger.error(
          `Failed to auto-complete schedule ${ticket.scheduled_maintenance_id}:`,
          error
        );
        // Don't fail ticket update if schedule completion fails
      }
    }

    const updatedTicket = await maintenanceRepo.findOne({
      where: { id: ticket.id },
      relations: ['item', 'reporter', 'assignee'],
    });

    res.json(updatedTicket);
  } catch (error: any) {
    logger.error('Error updating maintenance ticket', { error });
    res.status(500).json({ error: 'Failed to update maintenance ticket' });
  }
});

/**
 * DELETE /api/maintenance/:id
 * Delete maintenance ticket
 * Authorization: Admin only
 */
router.delete('/:id', authorize(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);
    const ticket = await maintenanceRepo.findOne({ where: { id: req.params.id } });

    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    await maintenanceRepo.remove(ticket);
    res.json({ message: 'Maintenance ticket deleted successfully'     });
  } catch (error: any) {
    logger.error('Error deleting maintenance ticket', { error });
    res.status(500).json({ error: 'Failed to delete maintenance ticket' });
  }
});

export default router;
