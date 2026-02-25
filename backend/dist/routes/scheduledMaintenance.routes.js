"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const maintenanceScheduler_service_1 = require("../services/maintenanceScheduler.service");
const ScheduledMaintenance_1 = require("../entities/ScheduledMaintenance");
const maintenanceReminderScheduler_service_1 = require("../services/maintenanceReminderScheduler.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/scheduled-maintenance
 * Get all scheduled maintenance with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { item_id, is_completed, maintenance_type, from_date, to_date } = req.query;
        const filters = {};
        if (item_id)
            filters.item_id = item_id;
        if (is_completed !== undefined)
            filters.is_completed = is_completed === 'true';
        if (maintenance_type)
            filters.maintenance_type = maintenance_type;
        if (from_date)
            filters.from_date = new Date(from_date);
        if (to_date)
            filters.to_date = new Date(to_date);
        const schedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getSchedules(filters);
        res.json(schedules);
    }
    catch (error) {
        logger_1.logger.error('Error fetching scheduled maintenance:', error);
        res.status(500).json({ message: 'Failed to fetch scheduled maintenance' });
    }
});
/**
 * GET /api/scheduled-maintenance/upcoming
 * Get upcoming maintenance (next 30 days)
 */
router.get('/upcoming', async (req, res) => {
    try {
        const schedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getUpcoming();
        res.json(schedules);
    }
    catch (error) {
        logger_1.logger.error('Error fetching upcoming maintenance:', error);
        res.status(500).json({ message: 'Failed to fetch upcoming maintenance' });
    }
});
/**
 * GET /api/scheduled-maintenance/overdue
 * Get overdue maintenance
 */
router.get('/overdue', async (req, res) => {
    try {
        const schedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getOverdue();
        res.json(schedules);
    }
    catch (error) {
        logger_1.logger.error('Error fetching overdue maintenance:', error);
        res.status(500).json({ message: 'Failed to fetch overdue maintenance' });
    }
});
/**
 * GET /api/scheduled-maintenance/stats
 * Get maintenance statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getStats();
        res.json(stats);
    }
    catch (error) {
        logger_1.logger.error('Error fetching maintenance stats:', error);
        res.status(500).json({ message: 'Failed to fetch maintenance stats' });
    }
});
/**
 * GET /api/scheduled-maintenance/item/:itemId
 * Get scheduled maintenance for a specific item
 */
router.get('/item/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const schedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getSchedules({ item_id: itemId });
        res.json(schedules);
    }
    catch (error) {
        logger_1.logger.error('Error fetching item maintenance:', error);
        res.status(500).json({ message: 'Failed to fetch item maintenance' });
    }
});
/**
 * GET /api/scheduled-maintenance/:id
 * Get single scheduled maintenance by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const schedules = await maintenanceScheduler_service_1.MaintenanceSchedulerService.getSchedules();
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) {
            return res.status(404).json({ message: 'Scheduled maintenance not found' });
        }
        res.json(schedule);
    }
    catch (error) {
        logger_1.logger.error('Error fetching scheduled maintenance:', error);
        res.status(500).json({ message: 'Failed to fetch scheduled maintenance' });
    }
});
/**
 * POST /api/scheduled-maintenance
 * Create new scheduled maintenance - Engineers and above
 */
router.post('/', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const user = req.user;
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
        const schedule = await maintenanceScheduler_service_1.MaintenanceSchedulerService.createSchedule({
            item_id,
            maintenance_type: maintenance_type,
            description,
            scheduled_date: new Date(scheduled_date),
            inventory_action: inventory_action || ScheduledMaintenance_1.InventoryAction.NONE,
            quantity_affected: quantity_affected || 1,
            created_by: user.id,
        });
        res.status(201).json(schedule);
    }
    catch (error) {
        logger_1.logger.error('Error creating scheduled maintenance:', error);
        res.status(500).json({ message: error.message || 'Failed to create scheduled maintenance' });
    }
});
/**
 * PUT /api/scheduled-maintenance/:id
 * Update scheduled maintenance - Engineers and above
 */
router.put('/:id', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { maintenance_type, description, scheduled_date, inventory_action, quantity_affected } = req.body;
        const updateData = {};
        if (maintenance_type)
            updateData.maintenance_type = maintenance_type;
        if (description !== undefined)
            updateData.description = description;
        if (scheduled_date)
            updateData.scheduled_date = new Date(scheduled_date);
        if (inventory_action)
            updateData.inventory_action = inventory_action;
        if (quantity_affected !== undefined)
            updateData.quantity_affected = quantity_affected;
        const schedule = await maintenanceScheduler_service_1.MaintenanceSchedulerService.updateSchedule(id, updateData);
        res.json(schedule);
    }
    catch (error) {
        logger_1.logger.error('Error updating scheduled maintenance:', error);
        res.status(500).json({ message: error.message || 'Failed to update scheduled maintenance' });
    }
});
/**
 * DELETE /api/scheduled-maintenance/:id
 * Delete scheduled maintenance - Engineers and above
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        await maintenanceScheduler_service_1.MaintenanceSchedulerService.deleteSchedule(id);
        res.json({ message: 'Scheduled maintenance deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting scheduled maintenance:', error);
        res.status(500).json({ message: error.message || 'Failed to delete scheduled maintenance' });
    }
});
/**
 * POST /api/scheduled-maintenance/:id/complete
 * Mark scheduled maintenance as completed - Engineers and above
 */
router.post('/:id/complete', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const schedule = await maintenanceScheduler_service_1.MaintenanceSchedulerService.markCompleted(id, user.id);
        res.json(schedule);
    }
    catch (error) {
        logger_1.logger.error('Error completing scheduled maintenance:', error);
        res.status(500).json({ message: error.message || 'Failed to complete scheduled maintenance' });
    }
});
/**
 * POST /api/scheduled-maintenance/:id/create-ticket
 * Create a maintenance ticket from scheduled maintenance - Engineers and above
 */
router.post('/:id/create-ticket', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const ticket = await maintenanceScheduler_service_1.MaintenanceSchedulerService.createTicketFromSchedule(id, user.id);
        res.status(201).json(ticket);
    }
    catch (error) {
        logger_1.logger.error('Error creating ticket from schedule:', error);
        res.status(500).json({ message: error.message || 'Failed to create ticket from schedule' });
    }
});
/**
 * POST /api/scheduled-maintenance/trigger-reminders
 * Manually trigger reminder check (admin only)
 */
router.post('/trigger-reminders', (0, auth_1.authorize)(User_1.UserRole.ADMIN), async (req, res) => {
    try {
        await (0, maintenanceReminderScheduler_service_1.triggerManualReminderCheck)();
        res.json({ message: 'Reminder check triggered successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error triggering reminders:', error);
        res.status(500).json({ message: 'Failed to trigger reminder check' });
    }
});
exports.default = router;
//# sourceMappingURL=scheduledMaintenance.routes.js.map