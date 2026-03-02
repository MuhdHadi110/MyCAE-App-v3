"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const PurchaseOrder_1 = require("../entities/PurchaseOrder");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const fileUpload_1 = require("../utils/fileUpload");
const purchaseOrder_service_1 = require("../services/purchaseOrder.service");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const poService = new purchaseOrder_service_1.PurchaseOrderService();
// All PO routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/purchase-orders
 * Get all purchase orders with filters
 * By default, only returns active revisions (is_active = true)
 * Use includeInactive=true to get all revisions
 */
router.get('/', async (req, res) => {
    try {
        const { status, project_code, limit = 100, offset = 0, includeInactive } = req.query;
        if (includeInactive === 'true') {
            // For inactive revisions, use direct repo query
            const poRepo = database_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
            let query = poRepo.createQueryBuilder('po')
                .leftJoinAndSelect('po.project', 'project')
                .leftJoinAndSelect('project.company', 'company')
                .select([
                'po',
                'project.project_code',
                'project.title',
                'company.name',
            ])
                .orderBy('po.received_date', 'DESC');
            if (status) {
                query = query.where('po.status = :status', { status });
            }
            if (project_code) {
                query = query.andWhere('po.project_code = :project_code', { project_code });
            }
            const [purchaseOrders, total] = await query
                .take(parseInt(limit))
                .skip(parseInt(offset))
                .getManyAndCount();
            res.json({
                data: purchaseOrders,
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
        }
        else {
            // Use service for active POs
            const result = await poService.getAllActivePOs({
                project_code: project_code,
                status: status,
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
            res.json({
                data: result.data,
                total: result.total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
        }
    }
    catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});
/**
 * GET /api/purchase-orders/:id
 * Get single purchase order
 */
router.get('/:id', async (req, res) => {
    try {
        const po = await poService.getById(req.params.id);
        if (!po) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        res.json(po);
    }
    catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
});
/**
 * POST /api/purchase-orders
 * Create new purchase order and automatically update project status
 */
router.post('/', [
    (0, express_validator_1.body)('poNumber').notEmpty().withMessage('PO number is required'),
    (0, express_validator_1.body)('projectCode').notEmpty().withMessage('Project code is required'),
    (0, express_validator_1.body)('clientName').notEmpty().withMessage('Client name is required'),
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('receivedDate').isISO8601().withMessage('Valid received date is required'),
    (0, express_validator_1.body)('plannedHours').optional().isNumeric().withMessage('Planned hours must be a number'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { poNumber, projectCode, clientName, amount, currency = 'MYR', receivedDate, dueDate, description, status = PurchaseOrder_1.POStatus.RECEIVED, fileUrl, plannedHours, customExchangeRate, } = req.body;
        // Check if project already has an active PO
        const existingPO = await poService.getActivePOByProjectCode(projectCode);
        if (existingPO) {
            return res.status(409).json({
                error: `This project already has ${existingPO.po_number}. Please edit the current PO.`,
            });
        }
        const po = await poService.createPO({
            poNumber,
            projectCode,
            clientName,
            amount: parseFloat(amount),
            currency,
            receivedDate: new Date(receivedDate),
            dueDate: dueDate ? new Date(dueDate) : undefined,
            description,
            status: status,
            fileUrl,
            plannedHours: plannedHours ? parseFloat(plannedHours) : undefined,
            customExchangeRate: customExchangeRate ? parseFloat(customExchangeRate) : undefined,
        });
        // Fetch the complete PO with project relation
        const fullPO = await poService.getById(po.id);
        res.status(201).json({
            message: 'Purchase order created successfully',
            data: fullPO,
        });
    }
    catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({ error: error.message || 'Failed to create purchase order' });
    }
});
/**
 * PUT /api/purchase-orders/:id
 * Update purchase order
 */
router.put('/:id', async (req, res) => {
    try {
        const { poNumber, clientName, amount, currency, customExchangeRate, receivedDate, dueDate, description, status, fileUrl, } = req.body;
        const updates = {};
        if (poNumber !== undefined)
            updates.po_number = poNumber;
        if (clientName !== undefined)
            updates.client_name = clientName;
        if (amount !== undefined)
            updates.amount = parseFloat(amount);
        if (currency !== undefined)
            updates.currency = currency;
        if (customExchangeRate !== undefined)
            updates.customExchangeRate = parseFloat(customExchangeRate);
        if (receivedDate !== undefined)
            updates.received_date = new Date(receivedDate);
        if (dueDate !== undefined)
            updates.due_date = dueDate ? new Date(dueDate) : undefined;
        if (description !== undefined)
            updates.description = description;
        if (status !== undefined)
            updates.status = status;
        if (fileUrl !== undefined)
            updates.file_url = fileUrl;
        const updatedPO = await poService.updatePO(req.params.id, updates);
        res.json({
            message: 'Purchase order updated successfully',
            data: updatedPO,
        });
    }
    catch (error) {
        console.error('Error updating purchase order:', error);
        res.status(500).json({ error: error.message || 'Failed to update purchase order' });
    }
});
/**
 * DELETE /api/purchase-orders/:id
 * Delete purchase order
 * Authorization: Senior Engineer and above
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        await poService.deletePO(req.params.id);
        res.json({ message: 'Purchase order deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting purchase order:', error);
        res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
    }
});
/**
 * POST /api/purchase-orders/:id/upload
 * Upload PO document file
 */
router.post('/:id/upload', fileUpload_1.upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const poRepo = database_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
        // Check if PO exists
        const po = await poRepo.findOne({ where: { id } });
        if (!po) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate file URL
        const fileUrl = (0, fileUpload_1.generateFileUrl)(req.file.filename, req);
        // Update PO with file URL
        await poRepo.update(id, { file_url: fileUrl });
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            filename: req.file.filename,
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});
/**
 * GET /api/purchase-orders/download/:filename
 * Download PO document file
 * Security: Validates filename to prevent path traversal attacks
 */
router.get('/download/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        // Security: Validate filename to prevent path traversal
        // Only allow alphanumeric, dash, underscore, dot (no slashes or ..)
        const safeFilenamePattern = /^[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$/;
        if (!safeFilenamePattern.test(filename)) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        // Additional check: ensure no path traversal sequences
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        const uploadsDir = path_1.default.resolve(__dirname, '../../uploads/purchase-orders');
        const filePath = path_1.default.join(uploadsDir, filename);
        // Security: Verify resolved path is within uploads directory
        const resolvedPath = path_1.default.resolve(filePath);
        if (!resolvedPath.startsWith(uploadsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.download(filePath);
    }
    catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});
/**
 * GET /api/purchase-orders/:poNumberBase/revisions
 * Get all revisions for a PO number
 */
router.get('/:poNumberBase/revisions', async (req, res) => {
    try {
        const { poNumberBase } = req.params;
        const revisions = await poService.getRevisionHistory(poNumberBase);
        if (revisions.length === 0) {
            return res.status(404).json({ error: 'No revisions found for this PO' });
        }
        const activeRevision = revisions.find(r => r.is_active);
        res.json({
            data: revisions,
            total: revisions.length,
            activeRevision,
        });
    }
    catch (error) {
        console.error('Error fetching PO revisions:', error);
        res.status(500).json({ error: 'Failed to fetch PO revisions' });
    }
});
/**
 * POST /api/purchase-orders/:id/revisions
 * Create new revision of existing PO
 */
router.post('/:id/revisions', [
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('currency').notEmpty().withMessage('Currency is required'),
    (0, express_validator_1.body)('receivedDate').isISO8601().withMessage('Valid received date is required'),
    (0, express_validator_1.body)('revisionReason').notEmpty().withMessage('Revision reason is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const { amount, currency, receivedDate, description, fileUrl, revisionReason } = req.body;
        const userId = req.user.id;
        const newRevision = await poService.createRevision(id, {
            amount: parseFloat(amount),
            currency,
            receivedDate: new Date(receivedDate),
            description,
            fileUrl,
            revisionReason,
        }, userId);
        res.status(201).json({
            message: 'PO revision created successfully',
            data: newRevision,
        });
    }
    catch (error) {
        console.error('Error creating PO revision:', error);
        res.status(500).json({ error: error.message || 'Failed to create PO revision' });
    }
});
/**
 * PATCH /api/purchase-orders/:id/adjust-myr
 * Manually adjust MYR amount
 */
router.patch('/:id/adjust-myr', [
    (0, express_validator_1.body)('adjustedAmount').isNumeric().withMessage('Adjusted amount must be a number'),
    (0, express_validator_1.body)('reason').notEmpty().withMessage('Adjustment reason is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const { adjustedAmount, reason } = req.body;
        const userId = req.user.id;
        const updatedPO = await poService.adjustMYRAmount(id, parseFloat(adjustedAmount), reason, userId);
        res.json({
            message: 'MYR amount adjusted successfully',
            data: updatedPO,
        });
    }
    catch (error) {
        console.error('Error adjusting MYR amount:', error);
        res.status(500).json({ error: error.message || 'Failed to adjust MYR amount' });
    }
});
exports.default = router;
//# sourceMappingURL=purchaseOrder.routes.js.map