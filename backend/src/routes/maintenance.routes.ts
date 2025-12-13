import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { MaintenanceTicket, TicketStatus, TicketPriority } from '../entities/MaintenanceTicket';
import { InventoryItem } from '../entities/InventoryItem';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

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
    console.error('Error fetching maintenance tickets:', error);
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
    console.error('Error fetching maintenance ticket:', error);
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

      const { itemId, title, description, priority, category, assignedTo } = req.body;

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
      });

      await maintenanceRepo.save(ticket);

      // Load relations
      const savedTicket = await maintenanceRepo.findOne({
        where: { id: ticket.id },
        relations: ['item', 'reporter', 'assignee'],
      });

      res.status(201).json(savedTicket);
    } catch (error: any) {
      console.error('Error creating maintenance ticket:', error);
      res.status(500).json({ error: 'Failed to create maintenance ticket' });
    }
  }
);

/**
 * PUT /api/maintenance/:id
 * Update maintenance ticket
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);
    const ticket = await maintenanceRepo.findOne({ where: { id: req.params.id } });

    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    // If status is being changed to RESOLVED or CLOSED, set resolved_date
    if (
      (req.body.status === TicketStatus.RESOLVED || req.body.status === TicketStatus.CLOSED) &&
      ticket.status !== TicketStatus.RESOLVED &&
      ticket.status !== TicketStatus.CLOSED
    ) {
      req.body.resolved_date = new Date();
    }

    maintenanceRepo.merge(ticket, req.body);
    await maintenanceRepo.save(ticket);

    const updatedTicket = await maintenanceRepo.findOne({
      where: { id: ticket.id },
      relations: ['item', 'reporter', 'assignee'],
    });

    res.json(updatedTicket);
  } catch (error: any) {
    console.error('Error updating maintenance ticket:', error);
    res.status(500).json({ error: 'Failed to update maintenance ticket' });
  }
});

/**
 * DELETE /api/maintenance/:id
 * Delete maintenance ticket
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const maintenanceRepo = AppDataSource.getRepository(MaintenanceTicket);
    const ticket = await maintenanceRepo.findOne({ where: { id: req.params.id } });

    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found' });
    }

    await maintenanceRepo.remove(ticket);
    res.json({ message: 'Maintenance ticket deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting maintenance ticket:', error);
    res.status(500).json({ error: 'Failed to delete maintenance ticket' });
  }
});

export default router;
