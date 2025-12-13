import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PurchaseOrder, POStatus } from '../entities/PurchaseOrder';
import { Project, ProjectStatus } from '../entities/Project';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { upload, generateFileUrl, deleteFile } from '../utils/fileUpload';
import path from 'path';
import fs from 'fs';

const router = Router();

// All PO routes require authentication
router.use(authenticate);

/**
 * GET /api/purchase-orders
 * Get all purchase orders with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, project_code, limit = 100, offset = 0 } = req.query;
    const poRepo = AppDataSource.getRepository(PurchaseOrder);

    let query = poRepo.createQueryBuilder('po')
      .leftJoinAndSelect('po.project', 'project')
      .select([
        'po',
        'project.project_code',
        'project.title',
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
    const poRepo = AppDataSource.getRepository(PurchaseOrder);
    const po = await poRepo.findOne({
      where: { id: req.params.id },
      relations: ['project'],
    });

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
        receivedDate,
        dueDate,
        description,
        status = POStatus.RECEIVED,
        fileUrl,
      } = req.body;

      const poRepo = AppDataSource.getRepository(PurchaseOrder);
      const projectRepo = AppDataSource.getRepository(Project);

      // Check if PO number already exists
      const existingPO = await poRepo.findOne({ where: { po_number: poNumber } });
      if (existingPO) {
        return res.status(400).json({ error: 'Purchase order with this PO number already exists' });
      }

      // Find the project by project code
      const project = await projectRepo.findOne({ where: { project_code: projectCode } });
      if (!project) {
        return res.status(404).json({ error: `Project with code ${projectCode} not found` });
      }

      // Create the purchase order
      const po = poRepo.create({
        po_number: poNumber,
        project_code: projectCode,
        client_name: clientName,
        amount: parseFloat(amount),
        received_date: new Date(receivedDate),
        due_date: dueDate ? new Date(dueDate) : undefined,
        description,
        status: status as POStatus,
        file_url: fileUrl,
      });

      const savedPO = await poRepo.save(po);

      // Automatically update project status from 'pre-lim' to 'ongoing' when PO is received
      if (project.status === ProjectStatus.PRE_LIM) {
        console.log(`📋 Updating project ${projectCode} status from pre-lim to ongoing`);
        project.status = ProjectStatus.ONGOING;
        project.po_received_date = new Date(receivedDate);
        await projectRepo.save(project);
        console.log(`✅ Project ${projectCode} status updated to ongoing`);
      }

      // Fetch the complete PO with project relation
      const fullPO = await poRepo.findOne({
        where: { id: savedPO.id },
        relations: ['project'],
      });

      res.status(201).json({
        message: 'Purchase order created successfully',
        data: fullPO,
        projectStatusUpdated: project.status === ProjectStatus.ONGOING,
      });
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Failed to create purchase order' });
    }
  }
);

/**
 * PUT /api/purchase-orders/:id
 * Update purchase order
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const poRepo = AppDataSource.getRepository(PurchaseOrder);
    const po = await poRepo.findOne({ where: { id: req.params.id } });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const {
      poNumber,
      clientName,
      amount,
      receivedDate,
      dueDate,
      description,
      status,
      fileUrl,
    } = req.body;

    // Update fields if provided
    if (poNumber !== undefined) po.po_number = poNumber;
    if (clientName !== undefined) po.client_name = clientName;
    if (amount !== undefined) po.amount = parseFloat(amount);
    if (receivedDate !== undefined) po.received_date = new Date(receivedDate);
    if (dueDate !== undefined) po.due_date = dueDate ? new Date(dueDate) : undefined;
    if (description !== undefined) po.description = description;
    if (status !== undefined) po.status = status as POStatus;
    if (fileUrl !== undefined) po.file_url = fileUrl;

    const updatedPO = await poRepo.save(po);

    // Fetch with relations
    const fullPO = await poRepo.findOne({
      where: { id: updatedPO.id },
      relations: ['project'],
    });

    res.json({
      message: 'Purchase order updated successfully',
      data: fullPO,
    });
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

/**
 * DELETE /api/purchase-orders/:id
 * Delete purchase order (soft delete)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const poRepo = AppDataSource.getRepository(PurchaseOrder);
    const po = await poRepo.findOne({ where: { id: req.params.id } });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Delete associated file if exists
    if (po.file_url) {
      deleteFile(po.file_url);
    }

    // Hard delete for now (can be changed to soft delete if needed)
    await poRepo.remove(po);

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

/**
 * POST /api/purchase-orders/upload
 * Upload PO document file
 */
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = generateFileUrl(req.file.filename, req);

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

export default router;
