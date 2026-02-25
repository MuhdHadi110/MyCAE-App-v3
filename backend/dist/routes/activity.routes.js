"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Activity_1 = require("../entities/Activity");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All activity routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/activity
 * Get recent activities with filters
 */
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, type, module, entityType } = req.query;
        const activityRepo = database_1.AppDataSource.getRepository(Activity_1.Activity);
        let query = activityRepo.createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .orderBy('activity.created_at', 'DESC')
            .take(parseInt(limit))
            .skip(parseInt(offset));
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
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});
/**
 * GET /api/activity/:id
 * Get single activity
 */
router.get('/:id', async (req, res) => {
    try {
        const activityRepo = database_1.AppDataSource.getRepository(Activity_1.Activity);
        const activity = await activityRepo.findOne({
            where: { id: req.params.id },
            relations: ['user'],
        });
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(activity);
    }
    catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});
/**
 * POST /api/activity
 * Create new activity log
 */
router.post('/', [
    (0, express_validator_1.body)('type').isIn(Object.values(Activity_1.ActivityType)).withMessage('Invalid activity type'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { type, description, details, entityType, entityId, module } = req.body;
        const activityRepo = database_1.AppDataSource.getRepository(Activity_1.Activity);
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
    }
    catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
});
/**
 * GET /api/activity/user/:userId
 * Get activities for a specific user
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const activityRepo = database_1.AppDataSource.getRepository(Activity_1.Activity);
        const [activities, total] = await activityRepo
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .where('activity.user_id = :userId', { userId: req.params.userId })
            .orderBy('activity.created_at', 'DESC')
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: activities,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        console.error('Error fetching user activities:', error);
        res.status(500).json({ error: 'Failed to fetch user activities' });
    }
});
/**
 * GET /api/activity/module/:module
 * Get activities for a specific module
 */
router.get('/module/:module', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const activityRepo = database_1.AppDataSource.getRepository(Activity_1.Activity);
        const [activities, total] = await activityRepo
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .where('activity.module = :module', { module: req.params.module })
            .orderBy('activity.created_at', 'DESC')
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: activities,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        console.error('Error fetching module activities:', error);
        res.status(500).json({ error: 'Failed to fetch module activities' });
    }
});
exports.default = router;
//# sourceMappingURL=activity.routes.js.map