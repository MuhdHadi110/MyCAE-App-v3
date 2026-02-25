"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
const Timesheet_1 = require("../entities/Timesheet");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// All timesheet routes require authentication
router.use(auth_1.authenticate);
// Helper to validate and sanitize pagination params
const validatePagination = (limit, offset) => ({
    limit: Math.min(Math.max(parseInt(String(limit)) || 100, 1), 500), // Max 500 records
    offset: Math.max(parseInt(String(offset)) || 0, 0)
});
/**
 * GET /api/timesheets
 * Get all timesheets with optional filters
 * Authorization: All engineers, managers, and admins can see all timesheets
 */
router.get('/', async (req, res) => {
    try {
        const { projectId, date, engineerId, startDate, endDate, limit = 100, offset = 0 } = req.query;
        const pagination = validatePagination(limit, offset);
        const timesheetRepo = database_1.AppDataSource.getRepository(Timesheet_1.Timesheet);
        // Authorization: Check user roles
        const userId = req.user?.id;
        const userRoles = req.user?.roles || [];
        const isPrivileged = userRoles.some((r) => ['admin', 'managing-director', 'manager', 'principal-engineer', 'senior-engineer', 'engineer'].includes(r));
        let query = timesheetRepo.createQueryBuilder('timesheet')
            .leftJoinAndSelect('timesheet.engineer', 'engineer')
            .leftJoinAndSelect('timesheet.project', 'project');
        // Non-privileged users can only see timesheets for projects they're assigned to
        if (!isPrivileged && userId) {
            query = query.where('(project.manager_id = :userId OR project.lead_engineer_id = :userId OR timesheet.engineer_id = :userId)', { userId });
        }
        if (projectId) {
            query = isPrivileged || !userId
                ? query.where('timesheet.project_id = :projectId', { projectId })
                : query.andWhere('timesheet.project_id = :projectId', { projectId });
        }
        // Filter by engineer
        if (engineerId) {
            query = query.andWhere('timesheet.engineer_id = :engineerId', { engineerId });
        }
        // Filter by specific date
        if (date) {
            query = query.andWhere('DATE(timesheet.date) = :date', { date });
        }
        // Filter by date range (startDate and endDate)
        if (startDate) {
            query = query.andWhere('DATE(timesheet.date) >= :startDate', { startDate });
        }
        if (endDate) {
            query = query.andWhere('DATE(timesheet.date) <= :endDate', { endDate });
        }
        const [timesheets, total] = await query
            .take(pagination.limit)
            .skip(pagination.offset)
            .getManyAndCount();
        // Format the response to include engineer name and email
        const formattedTimesheets = timesheets.map(ts => ({
            id: ts.id,
            project_id: ts.project_id,
            engineer_id: ts.engineer_id,
            date: ts.date,
            hours: ts.hours,
            work_category: ts.work_category,
            description: ts.description,
            created_at: ts.created_at,
            updated_at: ts.updated_at,
            engineerName: ts.engineer?.name || 'Unknown',
            engineerEmail: ts.engineer?.email || 'Unknown',
            projectCode: ts.project?.project_code,
            projectTitle: ts.project?.title,
        }));
        res.json({
            data: formattedTimesheets,
            total,
            limit: pagination.limit,
            offset: pagination.offset,
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting timesheet', { error });
        res.status(500).json({ error: 'Failed to delete timesheet' });
    }
});
/**
 * GET /api/timesheets/:id
 * Get single timesheet
 * Authorization: Users can only view their own timesheets, unless they are managers or above
 */
router.get('/:id', async (req, res) => {
    try {
        const timesheetRepo = database_1.AppDataSource.getRepository(Timesheet_1.Timesheet);
        const timesheet = await timesheetRepo.findOne({
            where: { id: req.params.id },
            relations: ['engineer', 'project'],
        });
        if (!timesheet) {
            return res.status(404).json({ error: 'Timesheet not found' });
        }
        // Authorization check: Users can only view their own timesheets unless they are managers or above
        const userId = req.user?.id;
        const userRoles = req.user?.roles || [];
        const isPrivileged = userRoles.some((r) => ['admin', 'managing-director', 'manager', 'principal-engineer', 'senior-engineer'].includes(r));
        const isOwner = timesheet.engineer_id === userId;
        if (!isOwner && !isPrivileged) {
            return res.status(403).json({
                error: 'You do not have permission to view this timesheet'
            });
        }
        res.json(timesheet);
    }
    catch (error) {
        console.error('Error fetching timesheet:', error);
        res.status(500).json({ error: 'Failed to fetch timesheet' });
    }
});
/**
 * POST /api/timesheets
 * Create new timesheet
 * Uses transaction to ensure atomicity of timesheet creation and project hours update
 */
router.post('/', [
    (0, express_validator_1.body)('projectId').notEmpty().withMessage('Project is required'),
    (0, express_validator_1.body)('date').notEmpty().withMessage('Date is required'),
    (0, express_validator_1.body)('hours').isFloat({ gt: 0 }).withMessage('Hours must be greater than 0'),
    (0, express_validator_1.body)('workCategory').notEmpty().withMessage('Work category is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { projectId, date, hours, workCategory, description } = req.body;
        // Use transaction to ensure atomicity
        const result = await database_1.AppDataSource.transaction(async (manager) => {
            // Create and save the new timesheet
            const newTimesheet = manager.create(Timesheet_1.Timesheet, {
                project_id: projectId,
                engineer_id: req.user.id,
                date,
                hours,
                work_category: workCategory,
                description,
            });
            await manager.save(newTimesheet);
            // Find and update the associated project
            const project = await manager.findOne(Project_1.Project, { where: { id: projectId } });
            if (project) {
                project.actual_hours = (project.actual_hours || 0) + hours;
                await manager.save(project);
            }
            return newTimesheet;
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Error creating timesheet:', error);
        res.status(500).json({ error: 'Failed to create timesheet' });
    }
});
/**
 * PUT /api/timesheets/:id
 * Update timesheet - Only the engineer who created the timesheet can update it
 * Uses transaction to ensure atomicity of timesheet and project hours update
 * Authorization: Engineers and above (ownership verified in handler)
 */
router.put('/:id', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const timesheetRepo = database_1.AppDataSource.getRepository(Timesheet_1.Timesheet);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        // Get the timesheet
        const timesheet = await timesheetRepo.findOne({
            where: { id: req.params.id },
        });
        if (!timesheet) {
            return res.status(404).json({ error: 'Timesheet not found' });
        }
        // Get the associated project
        const project = await projectRepo.findOne({
            where: { id: timesheet.project_id },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Authorization check: Only the engineer who created the timesheet can update it
        const userId = req.user?.id;
        const isOwner = timesheet.engineer_id === userId;
        if (!isOwner) {
            return res.status(403).json({
                error: 'You do not have permission to update this timesheet. Only the engineer who created the timesheet can update it.'
            });
        }
        // Update the timesheet with allowed fields using transaction
        const { hours, workCategory, description, date } = req.body;
        const result = await database_1.AppDataSource.transaction(async (manager) => {
            if (hours !== undefined) {
                // If hours changed, update the project's actual_hours
                const hoursDifference = hours - timesheet.hours;
                project.actual_hours = (project.actual_hours || 0) + hoursDifference;
                await manager.save(project);
                timesheet.hours = hours;
            }
            if (workCategory !== undefined) {
                timesheet.work_category = workCategory;
            }
            if (description !== undefined) {
                timesheet.description = description;
            }
            if (date !== undefined) {
                timesheet.date = date;
            }
            await manager.save(timesheet);
            return timesheet;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error updating timesheet:', error);
        res.status(500).json({ error: 'Failed to update timesheet' });
    }
});
/**
 * DELETE /api/timesheets/:id
 * Delete timesheet - Only the engineer who created the timesheet can delete it
 * Uses transaction to ensure atomicity of timesheet deletion and project hours update
 * Authorization: Engineers and above (ownership verified in handler)
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const timesheetRepo = database_1.AppDataSource.getRepository(Timesheet_1.Timesheet);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        // Get the timesheet
        const timesheet = await timesheetRepo.findOne({
            where: { id: req.params.id },
        });
        if (!timesheet) {
            return res.status(404).json({ error: 'Timesheet not found' });
        }
        // Get the associated project
        const project = await projectRepo.findOne({
            where: { id: timesheet.project_id },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Authorization check: Only the engineer who created the timesheet can delete it
        const userId = req.user?.id;
        const isOwner = timesheet.engineer_id === userId;
        if (!isOwner) {
            return res.status(403).json({
                error: 'You do not have permission to delete this timesheet. Only the engineer who created the timesheet can delete it.'
            });
        }
        // Delete timesheet and update project hours in a transaction
        await database_1.AppDataSource.transaction(async (manager) => {
            // Update the project's actual_hours
            if (timesheet.hours) {
                project.actual_hours = Math.max(0, (project.actual_hours || 0) - timesheet.hours);
                await manager.save(project);
            }
            // Delete the timesheet
            await manager.remove(timesheet);
        });
        res.json({ message: 'Timesheet deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting timesheet:', error);
        res.status(500).json({ error: 'Failed to delete timesheet' });
    }
});
exports.default = router;
//# sourceMappingURL=timesheet.routes.js.map