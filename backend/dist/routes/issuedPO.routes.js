"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const IssuedPO_1 = require("../entities/IssuedPO");
const Company_1 = require("../entities/Company");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const fileUpload_1 = require("../utils/fileUpload");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
// All issued PO routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/issued-pos/next-number
 * Get the next available issued PO number
 */
router.get('/next-number', async (req, res) => {
    try {
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        // Find the highest PO number
        const lastPO = await issuedPORepo
            .createQueryBuilder('po')
            .orderBy('po.po_number', 'DESC')
            .limit(1)
            .getOne();
        let nextNumber = 'PO_MCE25009'; // Starting number after Excel import
        if (lastPO) {
            // Extract number from "PO_MCE#####" format
            const match = lastPO.po_number.match(/PO_MCE(\d+)/);
            if (match) {
                const currentNum = parseInt(match[1]);
                nextNumber = `PO_MCE${currentNum + 1}`;
            }
        }
        res.json({ nextNumber });
    }
    catch (error) {
        logger_1.logger.error('Error getting next issued PO number', { error });
        res.status(500).json({ error: 'Failed to get next issued PO number' });
    }
});
/**
 * GET /api/issued-pos
 * Get all issued POs with filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, project_code, limit = 100, offset = 0 } = req.query;
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        let query = issuedPORepo
            .createQueryBuilder('po')
            .orderBy('po.issue_date', 'DESC');
        if (status) {
            query = query.where('po.status = :status', { status });
        }
        if (project_code) {
            query = query.andWhere('po.project_code LIKE :code', { code: `%${project_code}%` });
        }
        const [issuedPOs, total] = await query
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: issuedPOs,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching issued POs', { error });
        res.status(500).json({ error: 'Failed to fetch issued POs' });
    }
});
/**
 * GET /api/issued-pos/:id
 * Get single issued PO
 */
router.get('/:id', async (req, res) => {
    try {
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const po = await issuedPORepo.findOne({
            where: { id: req.params.id },
        });
        if (!po) {
            return res.status(404).json({ error: 'Issued PO not found' });
        }
        res.json(po);
    }
    catch (error) {
        logger_1.logger.error('Error fetching issued PO', { error });
        res.status(500).json({ error: 'Failed to fetch issued PO' });
    }
});
/**
 * POST /api/issued-pos
 * Create new issued PO
 */
router.post('/', [
    (0, express_validator_1.body)('poNumber').notEmpty().withMessage('PO number is required'),
    (0, express_validator_1.body)('items').notEmpty().withMessage('Items description is required'),
    (0, express_validator_1.body)('recipient').optional(),
    (0, express_validator_1.body)('companyId').optional(),
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('issueDate').isISO8601().withMessage('Valid issue date is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { poNumber, items, recipient, companyId, projectCode, amount, issueDate, dueDate, status = IssuedPO_1.IssuedPOStatus.ISSUED, fileUrl, } = req.body;
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        // Check if PO number already exists
        const existingPO = await issuedPORepo.findOne({ where: { po_number: poNumber } });
        if (existingPO) {
            return res.status(400).json({ error: 'Issued PO with this number already exists' });
        }
        // If companyId is provided, fetch company and get its name for recipient field
        let recipientName = recipient;
        if (companyId) {
            const company = await companyRepo.findOne({ where: { id: companyId } });
            if (!company) {
                return res.status(400).json({ error: 'Company not found' });
            }
            recipientName = company.name;
        }
        // Create the issued PO
        const po = issuedPORepo.create({
            po_number: poNumber,
            items,
            recipient: recipientName,
            company_id: companyId || null,
            project_code: projectCode || null,
            amount: parseFloat(amount),
            issue_date: new Date(issueDate),
            due_date: dueDate ? new Date(dueDate) : undefined,
            status: status,
            file_url: fileUrl,
        });
        const savedPO = await issuedPORepo.save(po);
        res.status(201).json({
            message: 'Issued PO created successfully',
            data: savedPO,
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting issued PO', { error });
        res.status(500).json({ error: 'Failed to delete issued PO' });
    }
});
/**
 * PUT /api/issued-pos/:id
 * Update issued PO
 * Authorization: Senior Engineer and above
 */
router.put('/:id', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        const po = await issuedPORepo.findOne({ where: { id: req.params.id } });
        if (!po) {
            return res.status(404).json({ error: 'Issued PO not found' });
        }
        const { poNumber, items, recipient, companyId, projectCode, amount, issueDate, dueDate, status, fileUrl, } = req.body;
        // If companyId is provided, fetch company and get its name for recipient field
        let recipientName = recipient;
        if (companyId) {
            const company = await companyRepo.findOne({ where: { id: companyId } });
            if (!company) {
                return res.status(400).json({ error: 'Company not found' });
            }
            recipientName = company.name;
        }
        // Update fields if provided
        if (poNumber !== undefined)
            po.po_number = poNumber;
        if (items !== undefined)
            po.items = items;
        if (recipient !== undefined)
            po.recipient = recipient;
        if (companyId !== undefined)
            po.company_id = companyId || null;
        if (projectCode !== undefined)
            po.project_code = projectCode || null;
        if (amount !== undefined)
            po.amount = parseFloat(amount);
        if (issueDate !== undefined)
            po.issue_date = new Date(issueDate);
        if (dueDate !== undefined)
            po.due_date = dueDate ? new Date(dueDate) : undefined;
        if (status !== undefined)
            po.status = status;
        if (fileUrl !== undefined)
            po.file_url = fileUrl;
        const updatedPO = await issuedPORepo.save(po);
        res.json({
            message: 'Issued PO updated successfully',
            data: updatedPO,
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating issued PO', { error });
        res.status(500).json({ error: 'Failed to update issued PO' });
    }
});
/**
 * DELETE /api/issued-pos/:id
 * Delete issued PO
 * Authorization: Senior Engineer and above
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const po = await issuedPORepo.findOne({ where: { id: req.params.id } });
        if (!po) {
            return res.status(404).json({ error: 'Issued PO not found' });
        }
        await issuedPORepo.remove(po);
        res.json({ message: 'Issued PO deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting issued PO:', error);
        res.status(500).json({ error: 'Failed to delete issued PO' });
    }
});
/**
 * POST /api/issued-pos/:id/upload
 * Upload issued PO document file
 */
router.post('/:id/upload', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), fileUpload_1.upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        // Check if issued PO exists
        const po = await issuedPORepo.findOne({ where: { id } });
        if (!po) {
            return res.status(404).json({ error: 'Issued PO not found' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate file URL
        const fileUrl = (0, fileUpload_1.generateFileUrl)(req.file.filename, req);
        // Update issued PO with file URL
        await issuedPORepo.update(id, { file_url: fileUrl });
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            filename: req.file.filename,
        });
    }
    catch (error) {
        logger_1.logger.error('Error uploading issued PO file', { error });
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});
/**
 * GET /api/issued-pos/:id/pdf
 * View uploaded issued PO document
 */
router.get('/:id/pdf', async (req, res) => {
    try {
        logger_1.logger.debug('Fetching document for issued PO', { issuedPOId: req.params.id });
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const po = await issuedPORepo.findOne({ where: { id: req.params.id } });
        if (!po) {
            logger_1.logger.debug('Issued PO not found', { issuedPOId: req.params.id });
            return res.status(404).json({ error: 'Issued PO not found' });
        }
        // Check if uploaded file exists
        if (po.file_url) {
            logger_1.logger.debug('Serving uploaded document', { fileUrl: po.file_url });
            // Extract filename from URL
            const filename = path_1.default.basename(po.file_url);
            const uploadsDir = path_1.default.join(__dirname, '../../uploads');
            const filePath = path_1.default.join(uploadsDir, filename);
            // Check if file exists
            if (!fs_1.default.existsSync(filePath)) {
                logger_1.logger.error('Uploaded file not found on disk', { filePath });
                return res.status(404).json({ error: 'Document file not found' });
            }
            // Set headers and send file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="po-${po.po_number}.pdf"`);
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
        }
        else {
            // No file uploaded - return error message
            logger_1.logger.debug('No document uploaded for issued PO', { poNumber: po.po_number });
            return res.status(404).json({ error: 'No document uploaded for this issued PO' });
        }
    }
    catch (error) {
        logger_1.logger.error('Error serving issued PO document', {
            error: error.message,
            issuedPOId: req.params.id
        });
        res.status(500).json({ error: `Failed to serve issued PO document: ${error.message}` });
    }
});
exports.default = router;
//# sourceMappingURL=issuedPO.routes.js.map