import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PurchaseOrder, POStatus } from '../entities/PurchaseOrder';
import { Project, ProjectStatus } from '../entities/Project';
import { User, UserRole } from '../entities/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { upload, generateFileUrl, deleteFile } from '../utils/fileUpload';
import { CurrencyService } from '../services/currency.service';
import { PurchaseOrderService } from '../services/purchaseOrder.service';
import emailService from '../services/email.service';
import path from 'path';
import fs from 'fs';

const router = Router();
const poService = new PurchaseOrderService();

// All PO routes require authentication
router.use(authenticate);

/**
 * GET /api/purchase-orders
 * Get all purchase orders with filters
 * By default, only returns active revisions (is_active = true)
 * Use includeInactive=true to get all revisions
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, project_code, limit = 100, offset = 0, includeInactive } = req.query;

    if (includeInactive === 'true') {
      // For inactive revisions, use direct repo query
      const poRepo = AppDataSource.getRepository(PurchaseOrder);
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
        .take(parseInt(limit as string))
        .skip(parseInt(offset as string))
        .getManyAndCount();

      res.json({
        data: purchaseOrders,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } else {
      // Use service for active POs
      const result = await poService.getAllActivePOs({
        project_code: project_code as string,
        status: status as POStatus,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        data: result.data,
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    }
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

/**
 * GET /api/purchase-orders/:id
 * Get single purchase order
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const po = await poService.getById(req.params.id);

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(po);
  } catch (error: any) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

/**
 * POST /api/purchase-orders
 * Create new purchase order and automatically update project status
 */
router.post(
  '/',
  [
    body('poNumber').notEmpty().withMessage('PO number is required'),
    body('projectCode').notEmpty().withMessage('Project code is required'),
    body('clientName').notEmpty().withMessage('Client name is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('receivedDate').isISO8601().withMessage('Valid received date is required'),
    body('plannedHours').optional().isNumeric().withMessage('Planned hours must be a number'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        poNumber,
        projectCode,
        clientName,
        amount,
        currency = 'MYR',
        receivedDate,
        dueDate,
        description,
        status = POStatus.RECEIVED,
        fileUrl,
        plannedHours,
        customExchangeRate,
      } = req.body;

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
        status: status as POStatus,
        fileUrl,
        plannedHours: plannedHours ? parseFloat(plannedHours) : undefined,
        customExchangeRate: customExchangeRate ? parseFloat(customExchangeRate) : undefined,
      });

      // Fetch the complete PO with project relation
      const fullPO = await poService.getById(po.id);

      // Send notification to Managing Directors (don't fail request if email fails)
      try {
        const userRepo = AppDataSource.getRepository(User);
        const mds = await userRepo.createQueryBuilder('user')
          .where(`JSON_CONTAINS(user.roles, '"managing-director"')`)
          .getMany();

        if (mds.length > 0) {
          // Format date/time
          const receivedDateFormatted = new Date(receivedDate).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const receivedTimeFormatted = new Date().toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit'
          });

          await emailService.sendPOReceivedNotification(
            po.id,
            mds,
            poNumber,
            parseFloat(amount),
            currency,
            projectCode,
            clientName,
            req.user!.name,
            req.user!.email,
            receivedDateFormatted,
            receivedTimeFormatted
          );
        }
      } catch (emailError: any) {
        console.error('Failed to send PO notification:', emailError.message);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        message: 'Purchase order created successfully',
        data: fullPO,
      });
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: error.message || 'Failed to create purchase order' });
    }
  }
);

/**
 * PUT /api/purchase-orders/:id
 * Update purchase order
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const {
      poNumber,
      clientName,
      amount,
      currency,
      customExchangeRate,
      receivedDate,
      dueDate,
      description,
      status,
      fileUrl,
    } = req.body;

    const updates: any = {};
    if (poNumber !== undefined) updates.po_number = poNumber;
    if (clientName !== undefined) updates.client_name = clientName;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (currency !== undefined) updates.currency = currency;
    if (customExchangeRate !== undefined) updates.customExchangeRate = parseFloat(customExchangeRate);
    if (receivedDate !== undefined) updates.received_date = new Date(receivedDate);
    if (dueDate !== undefined) updates.due_date = dueDate ? new Date(dueDate) : undefined;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status as POStatus;
    if (fileUrl !== undefined) updates.file_url = fileUrl;

    const updatedPO = await poService.updatePO(req.params.id, updates);

    res.json({
      message: 'Purchase order updated successfully',
      data: updatedPO,
    });
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: error.message || 'Failed to update purchase order' });
  }
});

/**
 * DELETE /api/purchase-orders/:id
 * Delete purchase order
 * Authorization: Senior Engineer and above
 */
router.delete('/:id',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
  try {
    await poService.deletePO(req.params.id);
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
  }
});

/**
 * POST /api/purchase-orders/:id/upload
 * Upload PO document file
 */
router.post('/:id/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const poRepo = AppDataSource.getRepository(PurchaseOrder);

    // Check if PO exists
    const po = await poRepo.findOne({ where: { id } });
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate file URL
    const fileUrl = generateFileUrl(req.file.filename, req);

    // Update PO with file URL
    await poRepo.update(id, { file_url: fileUrl });

    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

/**
 * GET /api/purchase-orders/download/:filename
 * Download PO document file
 * Security: Validates filename to prevent path traversal attacks
 */
router.get('/download/:filename', async (req: AuthRequest, res: Response) => {
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

    const uploadsDir = path.resolve(__dirname, '../../uploads/purchase-orders');
    const filePath = path.join(uploadsDir, filename);

    // Security: Verify resolved path is within uploads directory
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

/**
 * GET /api/purchase-orders/:poNumberBase/revisions
 * Get all revisions for a PO number
 */
router.get('/:poNumberBase/revisions', async (req: AuthRequest, res: Response) => {
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
  } catch (error: any) {
    console.error('Error fetching PO revisions:', error);
    res.status(500).json({ error: 'Failed to fetch PO revisions' });
  }
});

/**
 * POST /api/purchase-orders/:id/revisions
 * Create new revision of existing PO
 */
router.post(
  '/:id/revisions',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').notEmpty().withMessage('Currency is required'),
    body('receivedDate').isISO8601().withMessage('Valid received date is required'),
    body('revisionReason').notEmpty().withMessage('Revision reason is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { amount, currency, receivedDate, description, fileUrl, revisionReason } = req.body;
      const userId = req.user!.id;

      const newRevision = await poService.createRevision(
        id,
        {
          amount: parseFloat(amount),
          currency,
          receivedDate: new Date(receivedDate),
          description,
          fileUrl,
          revisionReason,
        },
        userId
      );

      res.status(201).json({
        message: 'PO revision created successfully',
        data: newRevision,
      });
    } catch (error: any) {
      console.error('Error creating PO revision:', error);
      res.status(500).json({ error: error.message || 'Failed to create PO revision' });
    }
  }
);

/**
 * PATCH /api/purchase-orders/:id/adjust-myr
 * Manually adjust MYR amount
 */
router.patch(
  '/:id/adjust-myr',
  [
    body('adjustedAmount').isNumeric().withMessage('Adjusted amount must be a number'),
    body('reason').notEmpty().withMessage('Adjustment reason is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { adjustedAmount, reason } = req.body;
      const userId = req.user!.id;

      const updatedPO = await poService.adjustMYRAmount(
        id,
        parseFloat(adjustedAmount),
        reason,
        userId
      );

      res.json({
        message: 'MYR amount adjusted successfully',
        data: updatedPO,
      });
    } catch (error: any) {
      console.error('Error adjusting MYR amount:', error);
      res.status(500).json({ error: error.message || 'Failed to adjust MYR amount' });
    }
  }
);

export default router;
