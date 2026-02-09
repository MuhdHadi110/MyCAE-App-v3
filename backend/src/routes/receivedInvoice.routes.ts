import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ReceivedInvoice, ReceivedInvoiceStatus } from '../entities/ReceivedInvoice';
import { IssuedPO, IssuedPOStatus } from '../entities/IssuedPO';
import { Company } from '../entities/Company';
import { UserRole } from '../entities/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { upload, generateFileUrl } from '../utils/fileUpload';

const router = Router();

// All received invoice routes require authentication
router.use(authenticate);

/**
 * GET /api/received-invoices
 * Get all received invoices with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, vendor_name, issued_po_id, limit = 100, offset = 0 } = req.query;
    const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);

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
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: receivedInvoices,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching received invoices:', error);
    res.status(500).json({ error: 'Failed to fetch received invoices' });
  }
});

/**
 * GET /api/received-invoices/:id
 * Get single received invoice
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
    const invoice = await receivedInvoiceRepo.findOne({
      where: { id: req.params.id },
      relations: ['issuedPO'],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Received invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    console.error('Error fetching received invoice:', error);
    res.status(500).json({ error: 'Failed to fetch received invoice' });
  }
});

/**
 * POST /api/received-invoices
 * Create new received invoice (linked to Issued PO)
 */
router.post(
  '/',
  [
    body('invoiceNumber').notEmpty().withMessage('Invoice number is required'),
    body('issuedPoId').notEmpty().withMessage('Issued PO ID is required'),
    body('companyId').optional(),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('invoiceDate').isISO8601().withMessage('Valid invoice date is required'),
    body('receivedDate').isISO8601().withMessage('Valid received date is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        invoiceNumber,
        issuedPoId,
        companyId,
        amount,
        currency,
        amountMyr,
        exchangeRate,
        invoiceDate,
        receivedDate,
        dueDate,
        description,
        fileUrl,
      } = req.body;

      const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
      const issuedPORepo = AppDataSource.getRepository(IssuedPO);
      const companyRepo = AppDataSource.getRepository(Company);

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
        status: ReceivedInvoiceStatus.PENDING,
        fileUrl: fileUrl,
      });

      const savedInvoice = await receivedInvoiceRepo.save(invoice);

      res.status(201).json({
        message: 'Received invoice created successfully',
        data: savedInvoice,
      });
    } catch (error: any) {
      console.error('Error creating received invoice:', error);
      res.status(500).json({ error: 'Failed to create received invoice' });
    }
  }
);

/**
 * PUT /api/received-invoices/:id
 * Update received invoice
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
    const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });

    if (!invoice) {
      return res.status(404).json({ error: 'Received invoice not found' });
    }

    // Don't allow editing paid invoices
    if (invoice.status === ReceivedInvoiceStatus.PAID) {
      return res.status(400).json({ error: 'Cannot edit a paid invoice' });
    }

    const {
      invoiceNumber,
      amount,
      currency,
      amountMyr,
      exchangeRate,
      invoiceDate,
      receivedDate,
      dueDate,
      description,
      fileUrl,
    } = req.body;

    // Update fields if provided
    if (invoiceNumber !== undefined) invoice.invoiceNumber = invoiceNumber;
    if (amount !== undefined) invoice.amount = parseFloat(amount);
    if (currency !== undefined) invoice.currency = currency;
    if (amountMyr !== undefined) invoice.amountMyr = amountMyr ? parseFloat(amountMyr) : null;
    if (exchangeRate !== undefined) invoice.exchangeRate = exchangeRate ? parseFloat(exchangeRate) : null;
    if (invoiceDate !== undefined) invoice.invoiceDate = new Date(invoiceDate);
    if (receivedDate !== undefined) invoice.receivedDate = new Date(receivedDate);
    if (dueDate !== undefined) invoice.dueDate = dueDate ? new Date(dueDate) : null;
    if (description !== undefined) invoice.description = description;
    if (fileUrl !== undefined) invoice.fileUrl = fileUrl;

    const updatedInvoice = await receivedInvoiceRepo.save(invoice);

    res.json({
      message: 'Received invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error updating received invoice:', error);
    res.status(500).json({ error: 'Failed to update received invoice' });
  }
});

/**
 * DELETE /api/received-invoices/:id
 * Delete received invoice
 * Authorization: Senior Engineer and above
 */
router.delete('/:id',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
      const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });

      if (!invoice) {
        return res.status(404).json({ error: 'Received invoice not found' });
      }

      // Don't allow deleting paid invoices
      if (invoice.status === ReceivedInvoiceStatus.PAID) {
        return res.status(400).json({ error: 'Cannot delete a paid invoice' });
      }

      await receivedInvoiceRepo.remove(invoice);

      res.json({ message: 'Received invoice deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting received invoice:', error);
      res.status(500).json({ error: 'Failed to delete received invoice' });
    }
  }
);

/**
 * POST /api/received-invoices/:id/verify
 * Mark received invoice as verified
 * Authorization: Senior Engineer and above
 */
router.post('/:id/verify',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
      const invoice = await receivedInvoiceRepo.findOne({ where: { id: req.params.id } });

      if (!invoice) {
        return res.status(404).json({ error: 'Received invoice not found' });
      }

      if (invoice.status !== ReceivedInvoiceStatus.PENDING && invoice.status !== ReceivedInvoiceStatus.DISPUTED) {
        return res.status(400).json({
          error: `Invoice must be pending or disputed to verify. Current status: ${invoice.status}`
        });
      }

      invoice.status = ReceivedInvoiceStatus.VERIFIED;
      invoice.verifiedBy = req.user?.id || null;
      invoice.verifiedAt = new Date();

      const updatedInvoice = await receivedInvoiceRepo.save(invoice);

      res.json({
        message: 'Received invoice verified successfully',
        data: updatedInvoice,
      });
    } catch (error: any) {
      console.error('Error verifying received invoice:', error);
      res.status(500).json({ error: 'Failed to verify received invoice' });
    }
  }
);

/**
 * POST /api/received-invoices/:id/mark-as-paid
 * Mark received invoice as paid and auto-update linked Issued PO to COMPLETED
 * Authorization: Senior Engineer and above
 */
router.post('/:id/mark-as-paid',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
      const issuedPORepo = AppDataSource.getRepository(IssuedPO);

      const invoice = await receivedInvoiceRepo.findOne({
        where: { id: req.params.id },
        relations: ['issuedPO'],
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Received invoice not found' });
      }

      if (invoice.status !== ReceivedInvoiceStatus.VERIFIED) {
        return res.status(400).json({
          error: `Invoice must be verified to mark as paid. Current status: ${invoice.status}`
        });
      }

      // Mark invoice as paid
      invoice.status = ReceivedInvoiceStatus.PAID;
      invoice.paidAt = new Date();
      const updatedInvoice = await receivedInvoiceRepo.save(invoice);

      // Auto-update linked Issued PO to COMPLETED
      if (invoice.issuedPO) {
        invoice.issuedPO.status = IssuedPOStatus.COMPLETED;
        await issuedPORepo.save(invoice.issuedPO);
      }

      res.json({
        message: 'Received invoice marked as paid. Linked Issued PO updated to COMPLETED.',
        data: updatedInvoice,
      });
    } catch (error: any) {
      console.error('Error marking received invoice as paid:', error);
      res.status(500).json({ error: 'Failed to mark received invoice as paid' });
    }
  }
);

/**
 * POST /api/received-invoices/:id/upload
 * Upload document file for received invoice
 * Authorization: Senior Engineer and above
 */
router.post(
  '/:id/upload',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);

      // Check if invoice exists
      const invoice = await receivedInvoiceRepo.findOne({ where: { id } });
      if (!invoice) {
        return res.status(404).json({ error: 'Received invoice not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate file URL
      const fileUrl = generateFileUrl(req.file.filename, req);

      // Update invoice with file URL
      await receivedInvoiceRepo.update(id, { fileUrl });

      res.status(200).json({
        message: 'File uploaded successfully',
        fileUrl,
        filename: req.file.filename,
      });
    } catch (error: any) {
      console.error('Error uploading received invoice file:', error);
      res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
  }
);

/**
 * GET /api/received-invoices/:id/file
 * View uploaded received invoice document
 */
router.get('/:id/file', async (req: AuthRequest, res: Response) => {
  try {
    const receivedInvoiceRepo = AppDataSource.getRepository(ReceivedInvoice);
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
    const path = await import('path');
    const fs = await import('fs');
    const uploadsDir = path.default.join(__dirname, '../../uploads/purchase-orders');
    const filePath = path.default.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.default.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Send file
    res.sendFile(path.default.resolve(filePath));
  } catch (error: any) {
    console.error('Error serving received invoice file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;
