import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Computer, ComputerType, ComputerStatus } from '../entities/Computer';
import { User } from '../entities/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';

const router = Router();

// All computer routes require authentication
router.use(authenticate);

/**
 * GET /api/computers
 * Get all computers with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, assignedTo, search, limit = 100, offset = 0 } = req.query;
    const computerRepo = AppDataSource.getRepository(Computer);

    let query = computerRepo.createQueryBuilder('computer')
      .leftJoinAndSelect('computer.assignee', 'assignee')
      .orderBy('computer.device_name', 'ASC');

    if (status) {
      query = query.where('computer.status = :status', { status });
    }

    if (type) {
      query = query.andWhere('computer.computer_type = :type', { type });
    }

    if (assignedTo) {
      query = query.andWhere('computer.assigned_to = :assignedTo', { assignedTo });
    }

    if (search) {
      query = query.andWhere(
        '(computer.device_name LIKE :search OR computer.asset_tag LIKE :search OR computer.serial_number LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [computers, total] = await query
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: computers,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching computers:', error);
    res.status(500).json({ error: 'Failed to fetch computers' });
  }
});

/**
 * GET /api/computers/:id
 * Get single computer
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const computerRepo = AppDataSource.getRepository(Computer);
    const computer = await computerRepo.findOne({
      where: { id: req.params.id },
      relations: ['assignee'],
    });

    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    res.json(computer);
  } catch (error: any) {
    console.error('Error fetching computer:', error);
    res.status(500).json({ error: 'Failed to fetch computer' });
  }
});

/**
 * POST /api/computers
 * Create new computer
 */
router.post(
  '/',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  [
    body('assetTag').notEmpty().withMessage('Asset tag is required'),
    body('deviceName').notEmpty().withMessage('Device name is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const computerRepo = AppDataSource.getRepository(Computer);

      // Check for duplicate asset tag
      const existing = await computerRepo.findOne({
        where: { asset_tag: req.body.assetTag },
      });

      if (existing) {
        return res.status(400).json({ error: 'Computer with this asset tag already exists' });
      }

      // Validate assignee if provided
      if (req.body.assignedTo) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: req.body.assignedTo } });
        if (!user) {
          return res.status(400).json({ error: 'User not found' });
        }
      }

      const computer = computerRepo.create({
        asset_tag: req.body.assetTag,
        device_name: req.body.deviceName,
        computer_type: req.body.computerType || ComputerType.LAPTOP,
        status: ComputerStatus.ACTIVE,
        ...req.body,
      });

      const savedComputerEntity = await computerRepo.save(computer);

      const savedComputer = await computerRepo.findOne({
        where: { id: (savedComputerEntity as unknown as Computer).id },
        relations: ['assignee'],
      });

      res.status(201).json(savedComputer);
    } catch (error: any) {
      console.error('Error creating computer:', error);
      res.status(500).json({ error: 'Failed to create computer' });
    }
  }
);

/**
 * PUT /api/computers/:id
 * Update computer
 */
router.put(
  '/:id',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  async (req: AuthRequest, res: Response) => {
    try {
      const computerRepo = AppDataSource.getRepository(Computer);
      const computer = await computerRepo.findOne({ where: { id: req.params.id } });

      if (!computer) {
        return res.status(404).json({ error: 'Computer not found' });
      }

      // Validate assignee if changing
      if (req.body.assignedTo && req.body.assignedTo !== computer.assigned_to) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: req.body.assignedTo } });
        if (!user) {
          return res.status(400).json({ error: 'User not found' });
        }
      }

      computerRepo.merge(computer, req.body);
      await computerRepo.save(computer);

      const updatedComputer = await computerRepo.findOne({
        where: { id: computer.id },
        relations: ['assignee'],
      });

      res.json(updatedComputer);
    } catch (error: any) {
      console.error('Error updating computer:', error);
      res.status(500).json({ error: 'Failed to update computer' });
    }
  }
);

/**
 * DELETE /api/computers/:id
 * Delete computer
 */
router.delete(
  '/:id',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  async (req: AuthRequest, res: Response) => {
    try {
      const computerRepo = AppDataSource.getRepository(Computer);
      const computer = await computerRepo.findOne({ where: { id: req.params.id } });

      if (!computer) {
        return res.status(404).json({ error: 'Computer not found' });
      }

      // Soft delete - mark as decommissioned
      computer.status = ComputerStatus.DECOMMISSIONED;
      computer.decommission_date = new Date();
      await computerRepo.save(computer);

      res.json({ message: 'Computer decommissioned successfully' });
    } catch (error: any) {
      console.error('Error deleting computer:', error);
      res.status(500).json({ error: 'Failed to delete computer' });
    }
  }
);

/**
 * GET /api/computers/assigned/:userId
 * Get computers assigned to a user
 */
router.get('/assigned/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const computerRepo = AppDataSource.getRepository(Computer);

    const [computers, total] = await computerRepo
      .createQueryBuilder('computer')
      .leftJoinAndSelect('computer.assignee', 'assignee')
      .where('computer.assigned_to = :userId', { userId: req.params.userId })
      .andWhere('computer.status = :status', { status: ComputerStatus.ACTIVE })
      .orderBy('computer.device_name', 'ASC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: computers,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching assigned computers:', error);
    res.status(500).json({ error: 'Failed to fetch computers' });
  }
});

/**
 * POST /api/computers/:id/assign
 * Assign computer to user
 */
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const computerRepo = AppDataSource.getRepository(Computer);
    const computer = await computerRepo.findOne({ where: { id: req.params.id } });

    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    // Validate user exists
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    computer.assigned_to = userId;
    computer.status = ComputerStatus.ACTIVE;
    await computerRepo.save(computer);

    const updatedComputer = await computerRepo.findOne({
      where: { id: computer.id },
      relations: ['assignee'],
    });

    res.json(updatedComputer);
  } catch (error: any) {
    console.error('Error assigning computer:', error);
    res.status(500).json({ error: 'Failed to assign computer' });
  }
});

/**
 * POST /api/computers/:id/unassign
 * Unassign computer from user
 */
router.post('/:id/unassign', async (req: AuthRequest, res: Response) => {
  try {
    const computerRepo = AppDataSource.getRepository(Computer);
    const computer = await computerRepo.findOne({ where: { id: req.params.id } });

    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    computer.assigned_to = undefined;
    await computerRepo.save(computer);

    const updatedComputer = await computerRepo.findOne({
      where: { id: computer.id },
      relations: ['assignee'],
    });

    res.json(updatedComputer);
  } catch (error: any) {
    console.error('Error unassigning computer:', error);
    res.status(500).json({ error: 'Failed to unassign computer' });
  }
});

export default router;
