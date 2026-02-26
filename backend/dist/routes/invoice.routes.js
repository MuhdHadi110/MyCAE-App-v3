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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Invoice_1 = require("../entities/Invoice");
const Activity_1 = require("../entities/Activity");
const Project_1 = require("../entities/Project");
const User_1 = require("../entities/User");
const PurchaseOrder_1 = require("../entities/PurchaseOrder");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const invoice_pdf_service_1 = require("../services/invoice-pdf.service");
const activity_service_1 = require("../services/activity.service");
const email_service_1 = __importDefault(require("../services/email.service"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const multer_1 = __importDefault(require("multer"));
// Configure multer for invoice uploads
const invoicesUploadDir = path_1.default.join(__dirname, '../../uploads/invoices');
if (!fs_1.default.existsSync(invoicesUploadDir)) {
    fs_1.default.mkdirSync(invoicesUploadDir, { recursive: true });
}
const invoiceStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, invoicesUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'invoice-' + uniqueSuffix + ext);
    }
});
const invoiceUpload = (0, multer_1.default)({
    storage: invoiceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
const router = (0, express_1.Router)();
// All invoice routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/invoices/next-number
 * Get next available invoice number
 */
router.get('/next-number', async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        // Find the highest invoice number
        const lastInvoice = await invoiceRepo
            .createQueryBuilder('invoice')
            .orderBy('invoice.invoice_number', 'DESC')
            .limit(1)
            .getOne();
        let nextNumber = 'MCE1548'; // Starting number after Excel import
        if (lastInvoice) {
            // Extract number from "MCE####" format
            const match = lastInvoice.invoice_number.match(/MCE(\d+)/);
            if (match) {
                const currentNum = parseInt(match[1]);
                nextNumber = `MCE${currentNum + 1}`;
            }
        }
        res.json({ nextNumber });
    }
    catch (error) {
        logger_1.logger.error('Error getting next invoice number', { error });
        res.status(500).json({ error: 'Failed to get next invoice number' });
    }
});
/**
 * GET /api/invoices/project/:projectCode/context
 * Get invoice context for a project (previous invoices, percentages, sequence, total value)
 */
router.get('/project/:projectCode/context', async (req, res) => {
    try {
        const { projectCode } = req.params;
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const poRepo = database_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
        // Get all invoices for this project
        const invoices = await invoiceRepo
            .createQueryBuilder('invoice')
            .where('invoice.project_code LIKE :code', { code: `%${projectCode}%` })
            .orderBy('invoice.invoice_sequence', 'ASC')
            .getMany();
        // Calculate invoice totals
        const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0);
        const remainingPercentage = Math.max(0, 100 - totalInvoiced);
        const nextSequence = invoices.length + 1;
        // Get project total value from Purchase Orders
        const activePOs = await poRepo
            .createQueryBuilder('po')
            .where('po.project_code LIKE :code', { code: `%${projectCode}%` })
            .andWhere('po.is_active = true')
            .getMany();
        const projectTotalValue = activePOs.reduce((sum, po) => sum + Number(po.effective_amount_myr || po.amount_myr || 0), 0);
        // Format previous invoices
        const previousInvoices = invoices.map(inv => ({
            invoiceNumber: inv.invoice_number,
            amount: Number(inv.amount),
            percentage: Number(inv.percentage_of_total),
            status: inv.status,
            date: inv.invoice_date,
        }));
        res.json({
            previousInvoices,
            totalInvoiced: Math.round(totalInvoiced * 100) / 100,
            remainingPercentage: Math.round(remainingPercentage * 100) / 100,
            nextSequence,
            projectTotalValue: Math.round(projectTotalValue * 100) / 100,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching invoice context', { error });
        res.status(500).json({ error: 'Failed to fetch invoice context' });
    }
});
/**
 * GET /api/invoices
 * Get all invoices with filters
 * Authorization: Managers, MDs, Admins, and Senior Engineers can view all invoices
 * Regular engineers can only view invoices they created
 */
router.get('/', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { status, project_code, limit = 100, offset = 0 } = req.query;
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        let query = invoiceRepo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.project', 'project')
            .orderBy('invoice.invoice_date', 'DESC');
        if (status) {
            query = query.where('invoice.status = :status', { status });
        }
        if (project_code) {
            query = query.andWhere('invoice.project_code LIKE :code', { code: `%${project_code}%` });
        }
        const [invoices, total] = await query
            .take(parseInt(limit))
            .skip(parseInt(offset))
            .getManyAndCount();
        res.json({
            data: invoices,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching invoices', { error });
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});
/**
 * GET /api/invoices/:id
 * Get single invoice
 */
router.get('/:id', async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({
            where: { id: req.params.id },
            relations: ['project'],
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice);
    }
    catch (error) {
        logger_1.logger.error('Error fetching invoice', { error });
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});
/**
 * POST /api/invoices
 * Create new invoice with automatic sequence, cumulative percentage, and project completion
 */
router.post('/', [
    (0, express_validator_1.body)('invoice_number').notEmpty().withMessage('Invoice number is required'),
    (0, express_validator_1.body)('project_code').notEmpty().withMessage('Project code is required'),
    (0, express_validator_1.body)('project_name').notEmpty().withMessage('Project name is required'),
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('issue_date').isISO8601().withMessage('Valid issue date is required'),
    (0, express_validator_1.body)('percentage_of_total').isNumeric().withMessage('Percentage must be a number'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { invoice_number, project_code, project_name, amount, issue_date, due_date, percentage_of_total, description, remark, status = Invoice_1.InvoiceStatus.DRAFT, file_url, } = req.body;
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        // Validate project code is not empty after trimming
        if (!project_code || project_code.trim() === '') {
            return res.status(400).json({
                error: 'Project code is required and cannot be empty'
            });
        }
        // Check if invoice number already exists
        const existingInvoice = await invoiceRepo.findOne({ where: { invoice_number: invoice_number } });
        if (existingInvoice) {
            return res.status(400).json({ error: 'Invoice with this number already exists' });
        }
        // Get existing invoices for this project to calculate sequence and cumulative
        const existingInvoices = await invoiceRepo
            .createQueryBuilder('invoice')
            .where('invoice.project_code LIKE :code', { code: `%${project_code}%` })
            .getMany();
        const invoiceSequence = existingInvoices.length + 1;
        const previousTotal = Math.round(existingInvoices.reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0) * 100) / 100;
        const cumulativePercentage = Math.round((previousTotal + Number(percentage_of_total)) * 100) / 100;
        // Create invoice
        const invoice = invoiceRepo.create({
            invoice_number,
            project_code,
            project_name,
            amount: parseFloat(amount),
            invoice_date: new Date(issue_date),
            percentage_of_total: parseFloat(percentage_of_total),
            invoice_sequence: invoiceSequence,
            cumulative_percentage: cumulativePercentage,
            remark,
            status: status,
            file_url,
            created_by: req.user.id,
        });
        const savedInvoice = await invoiceRepo.save(invoice);
        // Log invoice creation (wrapped in try-catch to prevent activity logging from breaking invoice creation)
        try {
            await activity_service_1.ActivityService.logInvoiceCreate(req.user.id, savedInvoice);
        }
        catch (activityError) {
            logger_1.logger.error('Failed to log invoice creation activity', { error: activityError });
            // Continue with invoice creation even if activity logging fails
        }
        // Check if project should be marked as completed (100% invoiced)
        let projectCompleted = false;
        if (cumulativePercentage >= 100) {
            // Extract first project code (in case of multiple like "J22006, J22007")
            const primaryProjectCode = project_code.split(',')[0].trim();
            const project = await projectRepo.findOne({ where: { project_code: primaryProjectCode } });
            if (project && project.status !== Project_1.ProjectStatus.COMPLETED) {
                logger_1.logger.info('Project status updated to completed', { projectCode: primaryProjectCode, reason: '100% invoiced' });
                project.status = Project_1.ProjectStatus.COMPLETED;
                await projectRepo.save(project);
                projectCompleted = true;
                logger_1.logger.info('Project marked as completed', { projectCode: primaryProjectCode });
            }
        }
        res.status(201).json({
            message: 'Invoice created successfully',
            data: savedInvoice,
            projectCompleted,
            cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating invoice', { error });
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});
/**
 * PUT /api/invoices/:id
 * Update invoice
 */
router.put('/:id', (0, auth_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.MANAGER, User_1.UserRole.SENIOR_ENGINEER), [
    (0, express_validator_1.body)('invoiceNumber').optional().notEmpty().withMessage('Invoice number is required'),
    (0, express_validator_1.body)('amount').optional().isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('percentageOfTotal').optional().isNumeric().withMessage('Percentage must be a number'),
    (0, express_validator_1.body)('invoiceDate').optional().isISO8601().withMessage('Valid invoice date is required'),
    (0, express_validator_1.body)('status').optional().isIn(Object.values(Invoice_1.InvoiceStatus)).withMessage('Invalid status'),
    (0, express_validator_1.body)('remark').optional().isString().withMessage('Remark must be text'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({
            where: { id: req.params.id },
            relations: ['project'],
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Status-based edit restrictions
        if (invoice.status === Invoice_1.InvoiceStatus.APPROVED || invoice.status === Invoice_1.InvoiceStatus.SENT) {
            return res.status(403).json({
                error: `Cannot edit ${invoice.status} invoices`
            });
        }
        if (invoice.status === Invoice_1.InvoiceStatus.PENDING_APPROVAL) {
            // Only creator can edit pending invoices
            if (invoice.created_by !== req.user.id && !req.user?.roles.includes(User_1.UserRole.ADMIN)) {
                return res.status(403).json({
                    error: 'Only the invoice creator can edit invoices pending approval'
                });
            }
        }
        // Prevent editing paid invoices (except for admin)
        if (invoice.status === Invoice_1.InvoiceStatus.PAID && !req.user?.roles.includes(User_1.UserRole.ADMIN)) {
            return res.status(403).json({ error: 'Paid invoices cannot be edited' });
        }
        // Store original values for audit logging
        const originalValues = { ...invoice };
        const { invoiceNumber, projectName, amount, invoiceDate, percentageOfTotal, remark, status, fileUrl, } = req.body;
        // Update fields if provided
        if (invoiceNumber !== undefined)
            invoice.invoice_number = invoiceNumber;
        if (projectName !== undefined)
            invoice.project_name = projectName;
        if (amount !== undefined)
            invoice.amount = parseFloat(amount);
        if (invoiceDate !== undefined)
            invoice.invoice_date = new Date(invoiceDate);
        if (percentageOfTotal !== undefined) {
            // Recalculate cumulative if percentage changed
            const existingInvoices = await invoiceRepo
                .createQueryBuilder('invoice')
                .where('invoice.project_code LIKE :code', { code: `%${invoice.project_code}%` })
                .andWhere('invoice.id != :id', { id: invoice.id })
                .getMany();
            const previousTotal = Math.round(existingInvoices.reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0) * 100) / 100;
            invoice.percentage_of_total = Math.round(parseFloat(percentageOfTotal) * 100) / 100;
            invoice.cumulative_percentage = Math.round((previousTotal + parseFloat(percentageOfTotal)) * 100) / 100;
        }
        if (remark !== undefined)
            invoice.remark = remark;
        if (status !== undefined)
            invoice.status = status;
        if (fileUrl !== undefined)
            invoice.file_url = fileUrl;
        const updatedInvoice = await invoiceRepo.save(invoice);
        // Log invoice changes for audit trail
        await activity_service_1.ActivityService.logInvoiceUpdate(req.user.id, originalValues, req.body, updatedInvoice);
        res.json({
            message: 'Invoice updated successfully',
            data: updatedInvoice,
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating invoice', { error });
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});
/**
 * DELETE /api/invoices/:id
 * Delete invoice
 * Authorization: Senior Engineer and above
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        await invoiceRepo.remove(invoice);
        res.json({ message: 'Invoice deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting invoice', { error });
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});
/**
 * POST /api/invoices/:id/submit-for-approval
 * Submit invoice for approval (Draft → Pending Approval)
 */
router.post('/:id/submit-for-approval', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Verify invoice is in draft status
        if (invoice.status !== Invoice_1.InvoiceStatus.DRAFT) {
            return res.status(400).json({
                error: `Invoice must be in Draft status to submit for approval. Current status: ${invoice.status}`
            });
        }
        // Store original for audit logging (deep copy to prevent mutation)
        const originalStatus = invoice.status;
        const originalValues = { ...invoice };
        // Update status and track submission
        invoice.status = Invoice_1.InvoiceStatus.PENDING_APPROVAL;
        invoice.submitted_for_approval_at = new Date();
        const updatedInvoice = await invoiceRepo.save(invoice);
        // Log activity with proper original values
        try {
            await activity_service_1.ActivityService.logInvoiceUpdate(req.user.id, { ...originalValues, status: originalStatus }, { status: Invoice_1.InvoiceStatus.PENDING_APPROVAL }, updatedInvoice);
        }
        catch (activityError) {
            logger_1.logger.error('Activity logging failed', { error: activityError });
            // Don't fail the request if activity logging fails
        }
        // Fetch all Managing Directors
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const mds = await userRepo.createQueryBuilder('user')
            .where(`JSON_CONTAINS(user.roles, '"managing-director"')`)
            .getMany();
        // Format date/time
        const submittedDate = invoice.submitted_for_approval_at.toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const submittedTime = invoice.submitted_for_approval_at.toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit'
        });
        // Send approval request email to all MDs (don't fail request if email fails)
        try {
            await email_service_1.default.sendInvoiceApprovalRequest(invoice.id, mds, invoice.invoice_number, invoice.amount, invoice.currency, invoice.project_code, invoice.project_name, req.user.name, req.user.email, submittedDate, submittedTime);
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send invoice approval notification', { error: emailError.message });
            // Don't fail the request if email fails
        }
        res.json({
            message: 'Invoice submitted for approval',
            data: updatedInvoice,
        });
    }
    catch (error) {
        logger_1.logger.error('Error submitting invoice for approval', { error });
        res.status(500).json({ error: 'Failed to submit invoice for approval' });
    }
});
/**
 * POST /api/invoices/:id/approve
 * Approve invoice (Pending Approval → Approved)
 * Authorization: MANAGING_DIRECTOR or ADMIN only
 */
router.post('/:id/approve', (0, auth_1.authorize)(User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Verify invoice is pending approval
        if (invoice.status !== Invoice_1.InvoiceStatus.PENDING_APPROVAL) {
            return res.status(400).json({
                error: `Invoice must be pending approval to approve. Current status: ${invoice.status}`
            });
        }
        // Store original for audit logging
        const originalStatus = invoice.status;
        const originalValues = { ...invoice };
        // Update status and track approval
        invoice.status = Invoice_1.InvoiceStatus.APPROVED;
        invoice.approved_by = req.user.id;
        invoice.approved_at = new Date();
        const updatedInvoice = await invoiceRepo.save(invoice);
        // Log activity with proper original values
        try {
            await activity_service_1.ActivityService.logInvoiceUpdate(req.user.id, { ...originalValues, status: originalStatus }, { status: Invoice_1.InvoiceStatus.APPROVED, approved_by: req.user.id }, updatedInvoice);
        }
        catch (activityError) {
            logger_1.logger.error('Activity logging failed', { error: activityError });
            // Don't fail the request if activity logging fails
        }
        // Fetch creator
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const creator = await userRepo.findOne({ where: { id: invoice.created_by } });
        // Format date/time
        const approvedDate = invoice.approved_at.toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const approvedTime = invoice.approved_at.toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit'
        });
        // Send approval confirmation to creator
        await email_service_1.default.sendInvoiceApprovalConfirmation(invoice.id, creator.email, creator.name, invoice.invoice_number, invoice.amount, invoice.currency, invoice.project_code, invoice.project_name, req.user.name, approvedDate, approvedTime).catch(err => {
            logger_1.logger.error('Failed to send approval confirmation email', { error: err.message });
        });
        res.json({
            message: 'Invoice approved successfully',
            data: updatedInvoice,
        });
    }
    catch (error) {
        logger_1.logger.error('Error approving invoice', { error });
        res.status(500).json({ error: 'Failed to approve invoice' });
    }
});
/**
 * POST /api/invoices/:id/withdraw
 * Withdraw invoice from approval (Pending Approval → Draft)
 * Authorization: Creator only
 */
router.post('/:id/withdraw', (0, auth_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.MANAGER, User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.ENGINEER), async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Verify invoice is pending approval
        if (invoice.status !== Invoice_1.InvoiceStatus.PENDING_APPROVAL) {
            return res.status(400).json({
                error: `Invoice must be pending approval to withdraw. Current status: ${invoice.status}`
            });
        }
        // Verify user is the creator
        if (invoice.created_by !== req.user.id && !req.user?.roles.includes(User_1.UserRole.ADMIN)) {
            return res.status(403).json({
                error: 'Only the invoice creator can withdraw from approval'
            });
        }
        // Store original for audit logging
        const originalStatus = invoice.status;
        const originalValues = { ...invoice };
        // Update status and clear submission tracking
        invoice.status = Invoice_1.InvoiceStatus.DRAFT;
        invoice.submitted_for_approval_at = undefined;
        const updatedInvoice = await invoiceRepo.save(invoice);
        // Log activity with proper original values
        try {
            await activity_service_1.ActivityService.logInvoiceUpdate(req.user.id, { ...originalValues, status: originalStatus }, { status: Invoice_1.InvoiceStatus.DRAFT }, updatedInvoice);
        }
        catch (activityError) {
            logger_1.logger.error('Activity logging failed', { error: activityError });
            // Don't fail the request if activity logging fails
        }
        // Fetch all Managing Directors
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const mds = await userRepo.createQueryBuilder('user')
            .where(`JSON_CONTAINS(user.roles, '"managing-director"')`)
            .getMany();
        // Format date/time
        const withdrawnDate = new Date().toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const withdrawnTime = new Date().toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit'
        });
        // Send withdrawal notification to all MDs
        await email_service_1.default.sendInvoiceWithdrawnNotification(invoice.id, mds, invoice.invoice_number, invoice.amount, invoice.currency, invoice.project_code, invoice.project_name, req.user.name, withdrawnDate, withdrawnTime).catch(err => {
            logger_1.logger.error('Failed to send invoice withdrawal notification', { error: err.message });
        });
        res.json({
            message: 'Invoice withdrawn from approval',
            data: updatedInvoice,
        });
    }
    catch (error) {
        logger_1.logger.error('Error withdrawing invoice', { error });
        res.status(500).json({ error: 'Failed to withdraw invoice from approval' });
    }
});
/**
 * POST /api/invoices/:id/mark-as-sent
 * Mark invoice as sent (Approved → Sent)
 */
router.post('/:id/mark-as-sent', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Verify invoice is approved
        if (invoice.status !== Invoice_1.InvoiceStatus.APPROVED) {
            return res.status(400).json({
                error: `Invoice must be approved to mark as sent. Current status: ${invoice.status}`
            });
        }
        // Store original for audit logging
        const originalValues = { ...invoice };
        // Update status
        invoice.status = Invoice_1.InvoiceStatus.SENT;
        const updatedInvoice = await invoiceRepo.save(invoice);
        // Log activity
        await activity_service_1.ActivityService.logInvoiceUpdate(req.user.id, originalValues, { status: Invoice_1.InvoiceStatus.SENT }, updatedInvoice);
        res.json({
            message: 'Invoice marked as sent',
            data: updatedInvoice,
        });
    }
    catch (error) {
        logger_1.logger.error('Error marking invoice as sent', { error });
        res.status(500).json({ error: 'Failed to mark invoice as sent' });
    }
});
/**
 * POST /api/invoices/:id/mark-as-paid
 * Mark invoice as paid (Sent → Paid)
 */
router.post('/:id/mark-as-paid', (0, auth_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.MANAGER, User_1.UserRole.PRINCIPAL_ENGINEER), async (req, res) => {
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Only sent invoices can be marked as paid
        if (invoice.status !== Invoice_1.InvoiceStatus.SENT) {
            return res.status(400).json({
                error: `Invoice must be sent to mark as paid. Current status: ${invoice.status}`
            });
        }
        // Update status to paid
        invoice.status = Invoice_1.InvoiceStatus.PAID;
        const updatedInvoice = await invoiceRepo.save(invoice);
        // Log activity
        await activity_service_1.ActivityService.log({
            userId: req.user.id,
            type: Activity_1.ActivityType.INVOICE_STATUS_CHANGE,
            description: `Invoice ${invoice.invoice_number} marked as paid`,
            entityType: 'invoice',
            entityId: invoice.id,
            module: 'finance',
            details: JSON.stringify({
                invoiceNumber: invoice.invoice_number,
                from: invoice.status,
                to: 'paid',
            }),
        });
        res.json({
            message: 'Invoice marked as paid',
            data: updatedInvoice,
        });
    }
    catch (error) {
        logger_1.logger.error('Error marking invoice as paid', { error });
        res.status(500).json({ error: 'Failed to mark invoice as paid' });
    }
});
/**
 * POST /api/invoices/:id/upload
 * Upload invoice document file
 */
router.post('/:id/upload', (0, auth_1.authorize)(User_1.UserRole.SENIOR_ENGINEER, User_1.UserRole.PRINCIPAL_ENGINEER, User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), invoiceUpload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        // Check if invoice exists
        const invoice = await invoiceRepo.findOne({ where: { id } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate file URL for invoices
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'] || req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/invoices/${req.file.filename}`;
        // Update invoice with file URL
        await invoiceRepo.update(id, { file_url: fileUrl });
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            filename: req.file.filename,
        });
    }
    catch (error) {
        logger_1.logger.error('Error uploading invoice file', { error });
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});
/**
 * GET /api/invoices/:id/pdf
 * View uploaded invoice document (or generate PDF if no file uploaded)
 */
router.get('/:id/pdf', async (req, res) => {
    try {
        logger_1.logger.debug('Fetching document for invoice', { invoiceId: req.params.id });
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });
        if (!invoice) {
            logger_1.logger.debug('Invoice not found', { invoiceId: req.params.id });
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Check if uploaded file exists
        if (invoice.file_url) {
            logger_1.logger.debug('Serving uploaded document', { fileUrl: invoice.file_url });
            // Extract filename from URL (handle both relative and absolute URLs)
            let filename = path_1.default.basename(invoice.file_url);
            // Handle URLs like "/uploads/filename.pdf" or "http://domain/uploads/invoices/filename.pdf"
            // The basename above should already extract just the filename, but if there's a subdirectory
            // in the path after /uploads/, we need to handle that
            if (invoice.file_url.includes('/uploads/')) {
                const parts = invoice.file_url.split('/uploads/');
                const pathAfterUploads = parts[parts.length - 1];
                // Extract just the filename, removing any subdirectory paths like "invoices/"
                filename = path_1.default.basename(pathAfterUploads);
            }
            // SECURITY: Validate filename to prevent path traversal attacks
            // Only allow alphanumeric characters, hyphens, underscores, and dots
            const safeFilenamePattern = /^[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$/;
            if (!safeFilenamePattern.test(filename)) {
                logger_1.logger.error('Invalid filename detected', { filename });
                return res.status(400).json({ error: 'Invalid filename format' });
            }
            // Determine the correct uploads directory based on file URL
            let uploadsDir;
            if (invoice.file_url.includes('/invoices/')) {
                uploadsDir = path_1.default.join(__dirname, '../../uploads/invoices');
            }
            else {
                uploadsDir = path_1.default.join(__dirname, '../../uploads');
            }
            const filePath = path_1.default.join(uploadsDir, filename);
            // SECURITY: Ensure resolved path is within uploads directory
            const resolvedPath = path_1.default.resolve(filePath);
            const resolvedUploadsDir = path_1.default.resolve(uploadsDir);
            if (!resolvedPath.startsWith(resolvedUploadsDir)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            logger_1.logger.debug('Resolved file path', {
                fileUrl: invoice.file_url,
                filename,
                uploadsDir,
                fullPath: filePath,
                exists: fs_1.default.existsSync(filePath)
            });
            // Check if file exists
            if (!fs_1.default.existsSync(filePath)) {
                logger_1.logger.error('Uploaded file not found on disk', {
                    filePath,
                    uploadsDir,
                    filesInDir: fs_1.default.existsSync(uploadsDir) ? fs_1.default.readdirSync(uploadsDir).length : 0
                });
                return res.status(404).json({
                    error: 'Document file not found on server',
                    details: `Looking for: ${filename}`
                });
            }
            // Set headers and send file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoice_number}.pdf"`);
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
        }
        else {
            // No file uploaded - return error message
            logger_1.logger.debug('No document uploaded for invoice', { invoiceNumber: invoice.invoice_number });
            return res.status(404).json({ error: 'No document uploaded for this invoice' });
        }
    }
    catch (error) {
        logger_1.logger.error('Error serving invoice document', {
            error: error.message,
            invoiceId: req.params.id
        });
        res.status(500).json({ error: `Failed to serve invoice document: ${error.message}` });
    }
});
/**
 * Debug endpoint to check company settings
 * Only available in development mode
 */
router.get('/debug-settings', async (req, res) => {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    try {
        const { CompanySettingsService } = await Promise.resolve().then(() => __importStar(require('../services/companySettings.service')));
        const settings = await CompanySettingsService.getSettings();
        res.json({
            success: true,
            settings: {
                company_name: settings.company_name,
                logo_url: settings.logo_url,
                logo_size: settings.logo_size,
                header_position: settings.header_position,
                page_margin: settings.page_margin
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Settings debug failed', { error });
        res.status(500).json({ error: `Failed to load settings: ${error.message}` });
    }
});
/**
 * Test specific invoice PDF generation with size reporting
 * Only available in development mode
 */
router.get('/test-invoice-size/:invoiceId', async (req, res) => {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    try {
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.invoiceId } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        logger_1.logger.debug('Testing PDF size for invoice', {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount
        });
        const pdfBuffer = await invoice_pdf_service_1.InvoicePDFService.generateInvoicePDF(invoice);
        if (!pdfBuffer) {
            return res.status(500).json({ error: 'Failed to generate PDF' });
        }
        const sizeKB = pdfBuffer.length / 1024;
        const sizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
        logger_1.logger.debug('PDF Size Analysis', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            sizeBytes: pdfBuffer.length,
            sizeKB: parseFloat(sizeKB.toFixed(2)),
            sizeMB: parseFloat(sizeMB),
            recommendedViewer: parseFloat(sizeMB) > 1.0 ? 'Browser Viewer Recommended' : 'React-PDF Should Work'
        });
        res.json({
            success: true,
            analysis: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                amount: invoice.amount,
                sizeBytes: pdfBuffer.length,
                sizeKB: parseFloat(sizeKB.toFixed(2)),
                sizeMB: parseFloat(sizeMB),
                recommendedViewer: parseFloat(sizeMB) > 1.0 ? 'Browser Viewer Recommended' : 'React-PDF Should Work'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Invoice size test failed', { error });
        res.status(500).json({ error: `Failed to test invoice: ${error.message}` });
    }
});
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map