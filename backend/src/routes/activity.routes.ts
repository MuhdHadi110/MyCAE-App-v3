import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Activity, ActivityType } from '../entities/Activity';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

/**
 * GET /api/activity
 * Get recent activities with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0, type, module, entityType } = req.query;
    const activityRepo = AppDataSource.getRepository(Activity);

    let query = activityRepo.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .orderBy('activity.created_at', 'DESC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string));

    if (type) {
      query = query.andWhere('activity.type = :type', { type });
    }

    if (module) {
      query = query.andWhere('activity.module = :module', { module });
    }

    if (entityType) {
      query = query.andWhere('activity.entity_type = :entityType', { entityType });
    }

    const [activities, total] = await query.getManyAndCount();

    res.json({
      data: activities,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

/**
 * GET /api/activity/:id
 * Get single activity
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const activityRepo = AppDataSource.getRepository(Activity);
    const activity = await activityRepo.findOne({
      where: { id: req.params.id },
      relations: ['user'],
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

/**
 * POST /api/activity
 * Create new activity log
 */
router.post(
  '/',
  [
    body('type').isIn(Object.values(ActivityType)).withMessage('Invalid activity type'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, description, details, entityType, entityId, module } = req.body;

      const activityRepo = AppDataSource.getRepository(Activity);
      const activity = activityRepo.create({
        type,
        description,
        details,
        entity_type: entityType,
        entity_id: entityId,
        module,
        user_id: req.user?.id,
      });

      await activityRepo.save(activity);

      const savedActivity = await activityRepo.findOne({
        where: { id: activity.id },
        relations: ['user'],
      });

      res.status(201).json(savedActivity);
    } catch (error: any) {
      console.error('Error creating activity:', error);
      res.status(500).json({ error: 'Failed to create activity' });
    }
  }
);

/**
 * GET /api/activity/user/:userId
 * Get activities for a specific user
 */
router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const activityRepo = AppDataSource.getRepository(Activity);

    const [activities, total] = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.user_id = :userId', { userId: req.params.userId })
      .orderBy('activity.created_at', 'DESC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: activities,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

/**
 * GET /api/activity/module/:module
 * Get activities for a specific module
 */
router.get('/module/:module', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const activityRepo = AppDataSource.getRepository(Activity);

    const [activities, total] = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.module = :module', { module: req.params.module })
      .orderBy('activity.created_at', 'DESC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: activities,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching module activities:', error);
    res.status(500).json({ error: 'Failed to fetch module activities' });
  }
});

export default router;
