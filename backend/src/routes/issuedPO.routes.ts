import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { IssuedPO, IssuedPOStatus } from '../entities/IssuedPO';
import { User, UserRole } from '../entities/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { IssuedPOPDFService } from '../services/issued-po-pdf.service';

const router = Router();

// All issued PO routes require authentication
router.use(authenticate);

/**
 * GET /api/issued-pos/next-number
 * Get the next available issued PO number
 */
router.get('/next-number', async (req: AuthRequest, res: Response) => {
  try {
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);

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
  } catch (error: any) {
    console.error('Error getting next issued PO number:', error);
    res.status(500).json({ error: 'Failed to get next issued PO number' });
  }
});

/**
 * GET /api/issued-pos
 * Get all issued POs with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, project_code, limit = 100, offset = 0 } = req.query;
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);

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
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: issuedPOs,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching issued POs:', error);
    res.status(500).json({ error: 'Failed to fetch issued POs' });
  }
});

/**
 * GET /api/issued-pos/:id
 * Get single issued PO
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);
    const po = await issuedPORepo.findOne({
      where: { id: req.params.id },
    });

    if (!po) {
      return res.status(404).json({ error: 'Issued PO not found' });
    }

    res.json(po);
  } catch (error: any) {
    console.error('Error fetching issued PO:', error);
    res.status(500).json({ error: 'Failed to fetch issued PO' });
  }
});

/**
 * POST /api/issued-pos
 * Create new issued PO
 */
router.post(
  '/',
  [
    body('poNumber').notEmpty().withMessage('PO number is required'),
    body('items').notEmpty().withMessage('Items description is required'),
    body('recipient').notEmpty().withMessage('Recipient/vendor name is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('issueDate').isISO8601().withMessage('Valid issue date is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        poNumber,
        items,
        recipient,
        projectCode,
        amount,
        issueDate,
        dueDate,
        status = IssuedPOStatus.ISSUED,
        fileUrl,
      } = req.body;

      const issuedPORepo = AppDataSource.getRepository(IssuedPO);

      // Check if PO number already exists
      const existingPO = await issuedPORepo.findOne({ where: { po_number: poNumber } });
      if (existingPO) {
        return res.status(400).json({ error: 'Issued PO with this number already exists' });
      }

      // Create the issued PO
      const po = issuedPORepo.create({
        po_number: poNumber,
        items,
        recipient,
        project_code: projectCode || null,
        amount: parseFloat(amount),
        issue_date: new Date(issueDate),
        due_date: dueDate ? new Date(dueDate) : undefined,
        status: status as IssuedPOStatus,
        file_url: fileUrl,
      });

      const savedPO = await issuedPORepo.save(po);

      res.status(201).json({
        message: 'Issued PO created successfully',
        data: savedPO,
      });
    } catch (error: any) {
      console.error('Error creating issued PO:', error);
      res.status(500).json({ error: 'Failed to create issued PO' });
    }
  }
);

/**
 * PUT /api/issued-pos/:id
 * Update issued PO
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);
    const po = await issuedPORepo.findOne({ where: { id: req.params.id } });

    if (!po) {
      return res.status(404).json({ error: 'Issued PO not found' });
    }

    const {
      poNumber,
      items,
      recipient,
      projectCode,
      amount,
      issueDate,
      dueDate,
      status,
      fileUrl,
    } = req.body;

    // Update fields if provided
    if (poNumber !== undefined) po.po_number = poNumber;
    if (items !== undefined) po.items = items;
    if (recipient !== undefined) po.recipient = recipient;
    if (projectCode !== undefined) po.project_code = projectCode || null;
    if (amount !== undefined) po.amount = parseFloat(amount);
    if (issueDate !== undefined) po.issue_date = new Date(issueDate);
    if (dueDate !== undefined) po.due_date = dueDate ? new Date(dueDate) : undefined;
    if (status !== undefined) po.status = status as IssuedPOStatus;
    if (fileUrl !== undefined) po.file_url = fileUrl;

    const updatedPO = await issuedPORepo.save(po);

    res.json({
      message: 'Issued PO updated successfully',
      data: updatedPO,
    });
  } catch (error: any) {
    console.error('Error updating issued PO:', error);
    res.status(500).json({ error: 'Failed to update issued PO' });
  }
});

/**
 * DELETE /api/issued-pos/:id
 * Delete issued PO
 * Authorization: Senior Engineer and above
 */
router.delete('/:id',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
  try {
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);
    const po = await issuedPORepo.findOne({ where: { id: req.params.id } });
    
    if (!po) {
      return res.status(404).json({ error: 'Issued PO not found' });
    }
    
    await issuedPORepo.remove(po);
    
    res.json({ message: 'Issued PO deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting issued PO:', error);
    res.status(500).json({ error: 'Failed to delete issued PO' });
  }
});

/**
 * GET /api/issued-pos/:id/pdf
 * Generate and download issued PO PDF
 */
router.get('/:id/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);
    const po = await issuedPORepo.findOne({ where: { id: req.params.id } });

    if (!po) {
      return res.status(404).json({ error: 'Issued PO not found' });
    }

    // Generate PDF
    const pdfBuffer = await IssuedPOPDFService.generateIssuedPOPDF(po);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="po-${po.po_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating issued PO PDF:', error);
    res.status(500).json({ error: 'Failed to generate issued PO PDF' });
  }
});

export default router;
