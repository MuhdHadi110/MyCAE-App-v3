"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const ReceivedInvoice_1 = require("../entities/ReceivedInvoice");
const IssuedPO_1 = require("../entities/IssuedPO");
const Company_1 = require("../entities/Company");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const fileUpload_1 = require("../utils/fileUpload");
const router = (0, express_1.Router)();
// All received invoice routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/received-invoices
 * Get all received invoices with filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, vendor_name, issued_po_id, limit = 100, offset = 0 } = req.query;
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        let query = receivedInvoiceRepo
            .createQueryBuilder('ri')
            .leftJoinAndSelect('ri.issuedPO', 'issuedPO')
            .orderBy('ri.receivedDate', 'DESC');
        if (status) {
            query = query.andWhere('ri.status = :status', { status });
        }
        if (vendor_name) {
            query = query.andWhere('ri.vendor_name LIKE :vendor', { vendor: `%${vendor_name}%` });
        }
        if (issued_po_id) {
            query = query.andWhere('ri.issued_po_id = :poId', { poId: issued_po_id });
        }
        const [receivedInvoices, total] = await query
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: receivedInvoices,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        console.error('Error fetching received invoices:', error);
        res.status(500).json({ error: 'Failed to fetch received invoices' });
    }
});
/**
 * GET /api/received-invoices/:id
 * Get single received invoice
 */
router.get('/:id', async (req, res) => {
    try {
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const invoice = await receivedInvoiceRepo.findOne({
            where: { id: req.params.id },
            relations: ['issuedPO'],
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        res.json(invoice);
    }
    catch (error) {
        console.error('Error fetching received invoice:', error);
        res.status(500).json({ error: 'Failed to fetch received invoice' });
    }
});
/**
 * POST /api/received-invoices
 * Create new received invoice (linked to Issued PO)
 */
router.post('/', [
    (0, express_validator_1.body)('invoiceNumber').notEmpty().withMessage('Invoice number is required'),
    (0, express_validator_1.body)('issuedPoId').notEmpty().withMessage('Issued PO ID is required'),
    (0, express_validator_1.body)('companyId').optional(),
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('invoiceDate').isISO8601().withMessage('Valid invoice date is required'),
    (0, express_validator_1.body)('receivedDate').isISO8601().withMessage('Valid received date is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { invoiceNumber, issuedPoId, companyId, amount, currency, amountMyr, exchangeRate, invoiceDate, receivedDate, dueDate, description, fileUrl, } = req.body;
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        // Verify the Issued PO exists
        const issuedPO = await issuedPORepo.findOne({ where: { id: issuedPoId } });
        if (!issuedPO) {
            return res.status(400).json({ error: 'Issued PO not found. Received invoice must be linked to a valid Issued PO.' });
        }
        // Create the received invoice
        const invoice = receivedInvoiceRepo.create({
            invoiceNumber: invoiceNumber,
            issuedPoId: issuedPoId,
            vendorName: issuedPO.recipient, // Copy from Issued PO
            amount: parseFloat(amount),
            currency: currency,
            amountMyr: amountMyr ? parseFloat(amountMyr) : null,
            exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
            invoiceDate: new Date(invoiceDate),
            receivedDate: new Date(receivedDate),
            dueDate: dueDate ? new Date(dueDate) : null,
            status: ReceivedInvoice_1.ReceivedInvoiceStatus.PENDING,
            fileUrl: fileUrl,
        });
        const savedInvoice = await receivedInvoiceRepo.save(invoice);
        res.status(201).json({
            message: 'Received invoice created successfully',
            data: savedInvoice,
        });
    }
    catch (error) {
        console.error('Error creating received invoice:', error);
        res.status(500).json({ error: 'Failed to create received invoice' });
    }
});
/**
 * PUT /api/received-invoices/:id
 * Update received invoice
 */
router.put('/:id', async (req, res) => {
    try {
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        // Don't allow editing paid invoices
        if (invoice.status === ReceivedInvoice_1.ReceivedInvoiceStatus.PAID) {
            return res.status(400).json({ error: 'Cannot edit a paid invoice' });
        }
        const { invoiceNumber, amount, currency, amountMyr, exchangeRate, invoiceDate, receivedDate, dueDate, description, fileUrl, } = req.body;
        // Update fields if provided
        if (invoiceNumber !== undefined)
            invoice.invoiceNumber = invoiceNumber;
        if (amount !== undefined)
            invoice.amount = parseFloat(amount);
        if (currency !== undefined)
            invoice.currency = currency;
        if (amountMyr !== undefined)
            invoice.amountMyr = amountMyr ? parseFloat(amountMyr) : null;
        if (exchangeRate !== undefined)
            invoice.exchangeRate = exchangeRate ? parseFloat(exchangeRate) : null;
        if (invoiceDate !== undefined)
            invoice.invoiceDate = new Date(invoiceDate);
        if (receivedDate !== undefined)
            invoice.receivedDate = new Date(receivedDate);
        if (dueDate !== undefined)
            invoice.dueDate = dueDate ? new Date(dueDate) : null;
        if (description !== undefined)
            invoice.description = description;
        if (fileUrl !== undefined)
            invoice.fileUrl = fileUrl;
        const updatedInvoice = await receivedInvoiceRepo.save(invoice);
        res.json({
            message: 'Received invoice updated successfully',
            data: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error updating received invoice:', error);
        res.status(500).json({ error: 'Failed to update received invoice' });
    }
});
/**
 * DELETE /api/received-invoices/:id
 * Delete received invoice
 * Authorization: Senior Engineer and above
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        // Don't allow deleting paid invoices
        if (invoice.status === ReceivedInvoice_1.ReceivedInvoiceStatus.PAID) {
            return res.status(400).json({ error: 'Cannot delete a paid invoice' });
        }
        await receivedInvoiceRepo.remove(invoice);
        res.json({ message: 'Received invoice deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting received invoice:', error);
        res.status(500).json({ error: 'Failed to delete received invoice' });
    }
});
/**
 * POST /api/received-invoices/:id/verify
 * Mark received invoice as verified
 * Authorization: Senior Engineer and above
 */
router.post('/:id/verify', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        if (invoice.status !== ReceivedInvoice_1.ReceivedInvoiceStatus.PENDING && invoice.status !== ReceivedInvoice_1.ReceivedInvoiceStatus.DISPUTED) {
            return res.status(400).json({
                error: `Invoice must be pending or disputed to verify. Current status: ${invoice.status}`
            });
        }
        invoice.status = ReceivedInvoice_1.ReceivedInvoiceStatus.VERIFIED;
        invoice.verifiedBy = req.user?.id || null;
        invoice.verifiedAt = new Date();
        const updatedInvoice = await receivedInvoiceRepo.save(invoice);
        res.json({
            message: 'Received invoice verified successfully',
            data: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error verifying received invoice:', error);
        res.status(500).json({ error: 'Failed to verify received invoice' });
    }
});
/**
 * POST /api/received-invoices/:id/mark-as-paid
 * Mark received invoice as paid and auto-update linked Issued PO to COMPLETED
 * Authorization: Senior Engineer and above
 */
router.post('/:id/mark-as-paid', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const invoice = await receivedInvoiceRepo.findOne({
            where: { id: req.params.id },
            relations: ['issuedPO'],
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        if (invoice.status !== ReceivedInvoice_1.ReceivedInvoiceStatus.VERIFIED) {
            return res.status(400).json({
                error: `Invoice must be verified to mark as paid. Current status: ${invoice.status}`
            });
        }
        // Mark invoice as paid
        invoice.status = ReceivedInvoice_1.ReceivedInvoiceStatus.PAID;
        invoice.paidAt = new Date();
        const updatedInvoice = await receivedInvoiceRepo.save(invoice);
        // Auto-update linked Issued PO to COMPLETED
        if (invoice.issuedPO) {
            invoice.issuedPO.status = IssuedPO_1.IssuedPOStatus.COMPLETED;
            await issuedPORepo.save(invoice.issuedPO);
        }
        res.json({
            message: 'Received invoice marked as paid. Linked Issued PO updated to COMPLETED.',
            data: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error marking received invoice as paid:', error);
        res.status(500).json({ error: 'Failed to mark received invoice as paid' });
    }
});
/**
 * POST /api/received-invoices/:id/upload
 * Upload document file for received invoice
 * Authorization: Senior Engineer and above
 */
router.post('/:id/upload', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), fileUpload_1.upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        // Check if invoice exists
        const invoice = await receivedInvoiceRepo.findOne({ where: { id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate file URL
        const fileUrl = (0, fileUpload_1.generateFileUrl)(req.file.filename, req);
        // Update invoice with file URL
        await receivedInvoiceRepo.update(id, { fileUrl });
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            filename: req.file.filename,
        });
    }
    catch (error) {
        console.error('Error uploading received invoice file:', error);
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});
/**
 * GET /api/received-invoices/:id/file
 * View uploaded received invoice document
 */
router.get('/:id/file', async (req, res) => {
    try {
        const receivedInvoiceRepo = database_1.AppDataSource.getRepository(ReceivedInvoice_1.ReceivedInvoice);
        const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Received invoice not found' });
        }
        if (!invoice.fileUrl) {
            return res.status(404).json({ error: 'No file uploaded for this invoice' });
        }
        // Extract filename from fileUrl
        const filename = invoice.fileUrl.split('/').pop();
        if (!filename) {
            return res.status(404).json({ error: 'Invalid file URL' });
        }
        // Serve the file
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const uploadsDir = path.default.join(__dirname, '../../uploads/purchase-orders');
        const filePath = path.default.join(uploadsDir, filename);
        // Check if file exists
        if (!fs.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }
        // Send file
        res.sendFile(path.default.resolve(filePath));
    }
    catch (error) {
        console.error('Error serving received invoice file:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});
exports.default = router;
//# sourceMappingURL=receivedInvoice.routes.js.map