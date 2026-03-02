"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Client_1 = require("../entities/Client");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All client routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/clients
 * Get all clients with filters
 */
router.get('/', async (req, res) => {
    try {
        let { status, search, limit = 100, offset = 0 } = req.query;
        // Ensure parameters are strings, not arrays
        const statusValue = Array.isArray(status) ? status[0] : status;
        const searchValue = Array.isArray(search) ? search[0] : search;
        const clientRepo = database_1.AppDataSource.getRepository(Client_1.Client);
        let query = clientRepo.createQueryBuilder('client')
            .orderBy('client.name', 'ASC');
        // Only filter by status if explicitly provided
        if (statusValue && statusValue !== 'all') {
            query = query.where('client.status = :status', { status: statusValue });
        }
        else if (!statusValue) {
            // Default: exclude archived clients if no status specified
            query = query.where('client.status != :archivedStatus', { archivedStatus: 'archived' });
        }
        if (searchValue) {
            query = query.andWhere('(client.name LIKE :search OR client.email LIKE :search OR client.code LIKE :search)', { search: `%${searchValue}%` });
        }
        const [clients, total] = await query
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: clients,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
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
router.get('/:id', async (req, res) => {
    try {
        const clientRepo = database_1.AppDataSource.getRepository(Client_1.Client);
        const client = await clientRepo.findOne({ where: { id: req.params.id } });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    }
    catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});
/**
 * POST /api/clients
 * Create new client
 */
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Client name is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const clientRepo = database_1.AppDataSource.getRepository(Client_1.Client);
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
    }
    catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});
/**
 * PUT /api/clients/:id
 * Update client
 */
router.put('/:id', async (req, res) => {
    try {
        const clientRepo = database_1.AppDataSource.getRepository(Client_1.Client);
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
        const updates = {};
        for (const field of allowedFields) {
            if (field in req.body) {
                updates[field] = req.body[field];
            }
        }
        clientRepo.merge(client, updates);
        await clientRepo.save(client);
        res.json(client);
    }
    catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});
/**
 * DELETE /api/clients/:id
 * Delete client (soft delete by marking inactive)
 */
router.delete('/:id', async (req, res) => {
    try {
        const clientRepo = database_1.AppDataSource.getRepository(Client_1.Client);
        const client = await clientRepo.findOne({ where: { id: req.params.id } });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        // Soft delete - mark as archived
        client.status = 'archived';
        await clientRepo.save(client);
        res.json({ message: 'Client archived successfully' });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});
/**
 * GET /api/clients/status/:status
 * Get clients by status
 */
router.get('/status/:status', async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        const clientRepo = database_1.AppDataSource.getRepository(Client_1.Client);
        const [clients, total] = await clientRepo
            .createQueryBuilder('client')
            .where('client.status = :status', { status: req.params.status })
            .orderBy('client.name', 'ASC')
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: clients,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        console.error('Error fetching clients by status:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});
exports.default = router;
//# sourceMappingURL=client.routes.js.map