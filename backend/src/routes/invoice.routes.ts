import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Invoice, InvoiceStatus } from '../entities/Invoice';
import { Project, ProjectStatus } from '../entities/Project';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { InvoicePDFService } from '../services/invoice-pdf.service';

const router = Router();

// All invoice routes require authentication
router.use(authenticate);

/**
 * GET /api/invoices/next-number
 * Get the next available invoice number
 */
router.get('/next-number', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceRepo = AppDataSource.getRepository(Invoice);

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
  } catch (error: any) {
    console.error('Error getting next invoice number:', error);
    res.status(500).json({ error: 'Failed to get next invoice number' });
  }
});

/**
 * GET /api/invoices/project/:projectCode/context
 * Get invoice context for a project (previous invoices, percentages, sequence)
 */
router.get('/project/:projectCode/context', async (req: AuthRequest, res: Response) => {
  try {
    const { projectCode } = req.params;
    const invoiceRepo = AppDataSource.getRepository(Invoice);

    // Get all invoices for this project
    const invoices = await invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.project_code LIKE :code', { code: `%${projectCode}%` })
      .orderBy('invoice.invoice_sequence', 'ASC')
      .getMany();

    // Calculate totals
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0);
    const remainingPercentage = Math.max(0, 100 - totalInvoiced);
    const nextSequence = invoices.length + 1;

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
    });
  } catch (error: any) {
    console.error('Error fetching invoice context:', error);
    res.status(500).json({ error: 'Failed to fetch invoice context' });
  }
});

/**
 * GET /api/invoices
 * Get all invoices with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, project_code, limit = 100, offset = 0 } = req.query;
    const invoiceRepo = AppDataSource.getRepository(Invoice);

    let query = invoiceRepo
      .createQueryBuilder('invoice')
      .orderBy('invoice.invoice_date', 'DESC');

    if (status) {
      query = query.where('invoice.status = :status', { status });
    }

    if (project_code) {
      query = query.andWhere('invoice.project_code LIKE :code', { code: `%${project_code}%` });
    }

    const [invoices, total] = await query
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    res.json({
      data: invoices,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/invoices/:id
 * Get single invoice
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({
      where: { id: req.params.id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /api/invoices
 * Create new invoice with automatic sequence, cumulative percentage, and project completion
 */
router.post(
  '/',
  [
    body('invoice_number').notEmpty().withMessage('Invoice number is required'),
    body('project_code').notEmpty().withMessage('Project code is required'),
    body('project_name').notEmpty().withMessage('Project name is required'),
    body('client_name').notEmpty().withMessage('Client name is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('issue_date').isISO8601().withMessage('Valid issue date is required'),
    body('percentage_of_total').isNumeric().withMessage('Percentage must be a number'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        invoice_number,
        project_code,
        project_name,
        client_name,
        amount,
        issue_date,
        due_date,
        percentage_of_total,
        description,
        remark,
        status = InvoiceStatus.DRAFT,
        file_url,
      } = req.body;

      const invoiceRepo = AppDataSource.getRepository(Invoice);
      const projectRepo = AppDataSource.getRepository(Project);

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
      const previousTotal = existingInvoices.reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0);
      const cumulativePercentage = previousTotal + Number(percentage_of_total);

      // Create the invoice
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
        status: status as InvoiceStatus,
        file_url,
      });

      const savedInvoice = await invoiceRepo.save(invoice);

      // Check if project should be marked as completed (100% invoiced)
      let projectCompleted = false;
      if (cumulativePercentage >= 100) {
        // Extract first project code (in case of multiple like "J22006, J22007")
        const primaryProjectCode = project_code.split(',')[0].trim();
        const project = await projectRepo.findOne({ where: { project_code: primaryProjectCode } });

        if (project && project.status !== ProjectStatus.COMPLETED) {
          console.log(`📋 Updating project ${primaryProjectCode} status to completed (100% invoiced)`);
          project.status = ProjectStatus.COMPLETED;
          await projectRepo.save(project);
          projectCompleted = true;
          console.log(`✅ Project ${primaryProjectCode} marked as completed`);
        }
      }

      res.status(201).json({
        message: 'Invoice created successfully',
        data: savedInvoice,
        projectCompleted,
        cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }
);

/**
 * PUT /api/invoices/:id
 * Update invoice
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const {
      invoiceNumber,
      projectName,
      amount,
      invoiceDate,
      percentageOfTotal,
      remark,
      status,
      fileUrl,
    } = req.body;

    // Update fields if provided
    if (invoiceNumber !== undefined) invoice.invoice_number = invoiceNumber;
    if (projectName !== undefined) invoice.project_name = projectName;
    if (amount !== undefined) invoice.amount = parseFloat(amount);
    if (invoiceDate !== undefined) invoice.invoice_date = new Date(invoiceDate);
    if (percentageOfTotal !== undefined) {
      // Recalculate cumulative if percentage changed
      const existingInvoices = await invoiceRepo
        .createQueryBuilder('invoice')
        .where('invoice.project_code LIKE :code', { code: `%${invoice.project_code}%` })
        .andWhere('invoice.id != :id', { id: invoice.id })
        .getMany();

      const previousTotal = existingInvoices.reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0);
      invoice.percentage_of_total = parseFloat(percentageOfTotal);
      invoice.cumulative_percentage = previousTotal + parseFloat(percentageOfTotal);
    }
    if (remark !== undefined) invoice.remark = remark;
    if (status !== undefined) invoice.status = status as InvoiceStatus;
    if (fileUrl !== undefined) invoice.file_url = fileUrl;

    const updatedInvoice = await invoiceRepo.save(invoice);

    res.json({
      message: 'Invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete invoice
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoiceRepo.remove(invoice);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

/**
 * GET /api/invoices/:id/pdf
 * Generate and download invoice PDF
 */
router.get('/:id/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({ where: { id: req.params.id } });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate PDF
    const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoice);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

export default router;
