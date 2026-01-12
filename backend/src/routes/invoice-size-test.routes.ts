import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Test specific invoice PDF generation with size reporting
 */
router.get('/test-invoice-size/:invoiceId', async (req: AuthRequest, res: Response) => {
  try {
    const { AppDataSource } = await import('../config/database');
    const { Invoice } = await import('../entities/Invoice');
    
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({ where: { id: req.params.invoiceId } });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    console.log('Testing PDF size for:', {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount
    });

    const { InvoicePDFService } = await import('../services/invoice-pdf.service');
    const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoice);

    if (!pdfBuffer) {
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }

    const sizeKB = pdfBuffer.length / 1024;
    const sizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);

    console.log('PDF Size Analysis:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      sizeBytes: pdfBuffer.length,
      sizeKB: sizeKB.toFixed(2),
      sizeMB: sizeMB,
      recommendedViewer: parseFloat(sizeMB) > 1.0 ? 'Browser Viewer Recommended' : 'React-PDF Should Work'
    });

    res.json({
      success: true,
      analysis: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        sizeBytes: pdfBuffer.length,
        sizeKB: sizeKB.toFixed(2),
        sizeMB: sizeMB,
        recommendedViewer: parseFloat(sizeMB) > 1.0 ? 'Browser Viewer Recommended' : 'React-PDF Should Work'
      }
    });

  } catch (error: any) {
    console.error('Invoice size test failed:', error);
    res.status(500).json({ error: `Failed to test invoice: ${error.message}` });
  }
});

export default router;