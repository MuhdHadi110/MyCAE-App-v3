"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const MaintenanceTicket_1 = require("../entities/MaintenanceTicket");
const InventoryItem_1 = require("../entities/InventoryItem");
const ScheduledMaintenance_1 = require("../entities/ScheduledMaintenance");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// All maintenance routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/maintenance
 * Get all maintenance tickets with filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, priority, itemId, search } = req.query;
        const maintenanceRepo = database_1.AppDataSource.getRepository(MaintenanceTicket_1.MaintenanceTicket);
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
            query = query.andWhere('(ticket.title LIKE :search OR ticket.description LIKE :search OR item.title LIKE :search)', { search: `%${search}%` });
        }
        const tickets = await query.getMany();
        res.json(tickets);
    }
    catch (error) {
        logger_1.logger.error('Error fetching maintenance tickets', { error });
        res.status(500).json({ error: 'Failed to fetch maintenance tickets' });
    }
});
/**
 * GET /api/maintenance/:id
 * Get single maintenance ticket
 */
router.get('/:id', async (req, res) => {
    try {
        const maintenanceRepo = database_1.AppDataSource.getRepository(MaintenanceTicket_1.MaintenanceTicket);
        const ticket = await maintenanceRepo.findOne({
            where: { id: req.params.id },
            relations: ['item', 'reporter', 'assignee'],
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Maintenance ticket not found' });
        }
        res.json(ticket);
    }
    catch (error) {
        logger_1.logger.error('Error fetching maintenance ticket', { error });
        res.status(500).json({ error: 'Failed to fetch maintenance ticket' });
    }
});
/**
 * POST /api/maintenance
 * Create new maintenance ticket
 */
router.post('/', [
    (0, express_validator_1.body)('itemId').notEmpty().withMessage('Item is required'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('priority').isIn(Object.values(MaintenanceTicket_1.TicketPriority)).withMessage('Invalid priority'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { itemId, title, description, priority, category, assignedTo, inventory_action, quantity_affected } = req.body;
        // Validate item exists
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const item = await inventoryRepo.findOne({ where: { id: itemId } });
        if (!item) {
            return res.status(400).json({ error: 'Inventory item not found' });
        }
        const maintenanceRepo = database_1.AppDataSource.getRepository(MaintenanceTicket_1.MaintenanceTicket);
        const ticket = maintenanceRepo.create({
            item_id: itemId,
            title,
            description,
            priority: priority || MaintenanceTicket_1.TicketPriority.MEDIUM,
            status: MaintenanceTicket_1.TicketStatus.OPEN,
            reported_by: req.user?.id,
            reported_date: new Date(),
            category,
            assigned_to: assignedTo,
            inventory_action: inventory_action || null,
            quantity_deducted: 0,
            inventory_restored: false,
        });
        await maintenanceRepo.save(ticket);
        // Apply inventory action if specified
        if (inventory_action && inventory_action !== ScheduledMaintenance_1.InventoryAction.NONE) {
            const qty = quantity_affected || 1;
            if (inventory_action === ScheduledMaintenance_1.InventoryAction.DEDUCT) {
                // Deduct from quantity
                if (item.quantity < qty) {
                    return res.status(400).json({ error: 'Insufficient quantity to deduct' });
                }
                item.quantity -= qty;
                ticket.quantity_deducted = qty;
                // Update status based on new quantity
                if (item.quantity === 0) {
                    item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
                }
                else if (item.quantity <= item.minimumStock) {
                    item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
                }
            }
            else if (inventory_action === ScheduledMaintenance_1.InventoryAction.STATUS_ONLY) {
                // Just update in_maintenance_quantity
                item.in_maintenance_quantity = (item.in_maintenance_quantity || 0) + qty;
                ticket.quantity_deducted = qty;
                // Update status if all quantity is in maintenance
                if (item.in_maintenance_quantity >= item.quantity) {
                    item.status = InventoryItem_1.InventoryStatus.IN_MAINTENANCE;
                }
            }
            await inventoryRepo.save(item);
            await maintenanceRepo.save(ticket);
            logger_1.logger.info(`Applied inventory action ${inventory_action} for ticket ${ticket.id}, qty: ${qty}`);
        }
        // Load relations
        const savedTicket = await maintenanceRepo.findOne({
            where: { id: ticket.id },
            relations: ['item', 'reporter', 'assignee'],
        });
        res.status(201).json(savedTicket);
    }
    catch (error) {
        logger_1.logger.error('Error creating maintenance ticket', { error });
        res.status(500).json({ error: 'Failed to create maintenance ticket' });
    }
});
/**
 * PUT /api/maintenance/:id
 * Update maintenance ticket
 * Authorization: Engineers and above
 */
router.put('/:id', (0, auth_1.authorize)(User_1.UserRole.ENGINEER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const maintenanceRepo = database_1.AppDataSource.getRepository(MaintenanceTicket_1.MaintenanceTicket);
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
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
        if ((newStatus === MaintenanceTicket_1.TicketStatus.RESOLVED || newStatus === MaintenanceTicket_1.TicketStatus.CLOSED) &&
            previousStatus !== MaintenanceTicket_1.TicketStatus.RESOLVED &&
            previousStatus !== MaintenanceTicket_1.TicketStatus.CLOSED) {
            req.body.resolved_date = new Date();
            // Restore inventory if not already restored
            if (ticket.inventory_action && !ticket.inventory_restored && ticket.quantity_deducted > 0) {
                const item = await inventoryRepo.findOne({ where: { id: ticket.item_id } });
                if (item) {
                    if (ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.DEDUCT) {
                        // Restore quantity
                        item.quantity += ticket.quantity_deducted;
                    }
                    else if (ticket.inventory_action === ScheduledMaintenance_1.InventoryAction.STATUS_ONLY) {
                        // Decrease in_maintenance_quantity
                        item.in_maintenance_quantity = Math.max(0, (item.in_maintenance_quantity || 0) - ticket.quantity_deducted);
                    }
                    // Update status based on new quantity
                    if (item.quantity === 0) {
                        item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
                    }
                    else if (item.in_maintenance_quantity > 0 && item.in_maintenance_quantity >= item.quantity) {
                        item.status = InventoryItem_1.InventoryStatus.IN_MAINTENANCE;
                    }
                    else if (item.quantity <= item.minimumStock) {
                        item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
                    }
                    else {
                        item.status = InventoryItem_1.InventoryStatus.AVAILABLE;
                    }
                    await inventoryRepo.save(item);
                    req.body.inventory_restored = true;
                    logger_1.logger.info(`Restored inventory for ticket ${ticket.id}: action was ${ticket.inventory_action}, qty: ${ticket.quantity_deducted}`);
                }
            }
        }
        maintenanceRepo.merge(ticket, req.body);
        await maintenanceRepo.save(ticket);
        // Auto-complete linked schedule if ticket was created from one
        if (ticket.scheduled_maintenance_id) {
            const { MaintenanceSchedulerService } = require('../services/maintenanceScheduler.service');
            try {
                await MaintenanceSchedulerService.markCompleted(ticket.scheduled_maintenance_id, req.user?.id || 'system');
                logger_1.logger.info(`Auto-completed schedule ${ticket.scheduled_maintenance_id} when ticket ${ticket.id} was resolved`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to auto-complete schedule ${ticket.scheduled_maintenance_id}:`, error);
                // Don't fail ticket update if schedule completion fails
            }
        }
        const updatedTicket = await maintenanceRepo.findOne({
            where: { id: ticket.id },
            relations: ['item', 'reporter', 'assignee'],
        });
        res.json(updatedTicket);
    }
    catch (error) {
        logger_1.logger.error('Error updating maintenance ticket', { error });
        res.status(500).json({ error: 'Failed to update maintenance ticket' });
    }
});
/**
 * DELETE /api/maintenance/:id
 * Delete maintenance ticket
 * Authorization: Admin only
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const maintenanceRepo = database_1.AppDataSource.getRepository(MaintenanceTicket_1.MaintenanceTicket);
        const ticket = await maintenanceRepo.findOne({ where: { id: req.params.id } });
        if (!ticket) {
            return res.status(404).json({ error: 'Maintenance ticket not found' });
        }
        await maintenanceRepo.remove(ticket);
        res.json({ message: 'Maintenance ticket deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting maintenance ticket', { error });
        res.status(500).json({ error: 'Failed to delete maintenance ticket' });
    }
});
exports.default = router;
//# sourceMappingURL=maintenance.routes.js.map