import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Client } from '../entities/Client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// All client routes require authentication
router.use(authenticate);

/**
 * GET /api/clients
 * Get all clients with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let { status, search, limit = 100, offset = 0 } = req.query;

    // Ensure parameters are strings, not arrays
    const statusValue = Array.isArray(status) ? status[0] : status;
    const searchValue = Array.isArray(search) ? search[0] : search;

    const clientRepo = AppDataSource.getRepository(Client);

    let query = clientRepo.createQueryBuilder('client')
      .orderBy('client.name', 'ASC');

    // Only filter by status if explicitly provided
    if (statusValue && statusValue !== 'all') {
      query = query.where('client.status = :status', { status: statusValue });
    } else if (!statusValue) {
      // Default: exclude archived clients if no status specified
      query = query.where('client.status != :archivedStatus', { archivedStatus: 'archived' });
    }

    if (searchValue) {
      query = query.andWhere(
        '(client.name LIKE :search OR client.email LIKE :search OR client.code LIKE :search)',
        { search: `%${searchValue}%` }
      );
    }

    const [clients, total] = await query
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: clients,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
    });
    res.status(500).json({
      error: 'Failed to fetch clients',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

/**
 * GET /api/clients/:id
 * Get single client
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clientRepo = AppDataSource.getRepository(Client);
    const client = await clientRepo.findOne({ where: { id: req.params.id } });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error: any) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

/**
 * POST /api/clients
 * Create new client
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Client name is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clientRepo = AppDataSource.getRepository(Client);

      // Check for duplicate name
      const existing = await clientRepo.findOne({
        where: { name: req.body.name },
      });

      if (existing) {
        return res.status(400).json({ error: 'Client with this name already exists' });
      }

      const client = clientRepo.create({
        ...req.body,
        status: req.body.status || 'active',
      });

      await clientRepo.save(client);
      res.status(201).json(client);
    } catch (error: any) {
      console.error('Error creating client:', error);
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
);

/**
 * PUT /api/clients/:id
 * Update client
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clientRepo = AppDataSource.getRepository(Client);
    const client = await clientRepo.findOne({ where: { id: req.params.id } });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check for duplicate name (if changing name)
    if (req.body.name && req.body.name !== client.name) {
      const existing = await clientRepo.findOne({
        where: { name: req.body.name },
      });
      if (existing) {
        return res.status(400).json({ error: 'Client with this name already exists' });
      }
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'industry',
      'status',
      'website',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    clientRepo.merge(client, updates);
    await clientRepo.save(client);

    res.json(client);
  } catch (error: any) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete client (soft delete by marking inactive)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clientRepo = AppDataSource.getRepository(Client);
    const client = await clientRepo.findOne({ where: { id: req.params.id } });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Soft delete - mark as archived
    client.status = 'archived';
    await clientRepo.save(client);

    res.json({ message: 'Client archived successfully' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

/**
 * GET /api/clients/status/:status
 * Get clients by status
 */
router.get('/status/:status', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const clientRepo = AppDataSource.getRepository(Client);

    const [clients, total] = await clientRepo
      .createQueryBuilder('client')
      .where('client.status = :status', { status: req.params.status })
      .orderBy('client.name', 'ASC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: clients,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching clients by status:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

export default router;
