import PDFDocument from 'pdfkit';
import { Invoice } from '../entities/Invoice';
import * as fs from 'fs';
import * as path from 'path';

export class InvoicePDFService {
  /**
   * Generate invoice PDF matching MyCAE template
   */
  static async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Company Header
        doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);

        // Company Details
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('MYCAE TECHNOLOGIES SDN BHD (863273W)', { align: 'center' });
        doc.fontSize(9).font('Helvetica');
        doc.text('UDINI Square, Block 2-03-13A,', { align: 'center' });
        doc.text('Lebuh Tunku Kudin 3,', { align: 'center' });
        doc.text('11700 Gelugor, Penang, Malaysia', { align: 'center' });
        doc.text('Tel: +604 376 2355         H/P: +60 17 2008173', { align: 'center' });
        doc.text('Email: kctang@mycae.com.my', { align: 'center' });
        doc.text('SST ID: P11-1808-31028245', { align: 'center' });
        doc.moveDown(1);

        // Invoice Details (Right side)
        const invoiceDetailsY = doc.y;
        doc.fontSize(9);
        doc.text(`INVOICE NUMBER:`, 350, invoiceDetailsY);
        doc.font('Helvetica-Bold').text(invoice.invoice_number, 470, invoiceDetailsY);

        doc.font('Helvetica').text(`INVOICE DATE:`, 350, invoiceDetailsY + 15);
        doc.font('Helvetica-Bold').text(
          new Date(invoice.invoice_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          470,
          invoiceDetailsY + 15
        );

        // Client Details
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('SOLD TO:', 50, invoiceDetailsY + 50);
        doc.font('Helvetica').fontSize(9);
        doc.text(invoice.project_name, 50, invoiceDetailsY + 65, { width: 280 });

        // Line separator
        doc.moveTo(50, invoiceDetailsY + 110)
           .lineTo(545, invoiceDetailsY + 110)
           .stroke();

        // Table Header
        const tableTop = invoiceDetailsY + 125;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('NO', 50, tableTop);
        doc.text('DESCRIPTION', 80, tableTop);
        doc.text('QTY', 340, tableTop, { width: 40, align: 'center' });
        doc.text('UNIT PRICE (RM)', 390, tableTop, { width: 70, align: 'right' });
        doc.text('8% TAX (RM)', 470, tableTop, { width: 70, align: 'right' });
        doc.text('AMOUNT (RM)', 470, tableTop, { width: 75, align: 'right' });

        // Table line
        doc.moveTo(50, tableTop + 15)
           .lineTo(545, tableTop + 15)
           .stroke();

        // Line Item
        const itemY = tableTop + 25;
        doc.font('Helvetica').fontSize(9);
        doc.text('1', 50, itemY);

        const description = invoice.remark ||
          `Professional consultancy fee for ${invoice.project_name}`;
        doc.text(description, 80, itemY, { width: 250 });

        // Calculate tax and totals
        const subtotal = Number(invoice.amount);
        const tax = subtotal * 0.08; // 8% SST
        const total = subtotal + tax;

        doc.text('1', 340, itemY, { width: 40, align: 'center' });
        doc.text(subtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 390, itemY, { width: 70, align: 'right' });
        doc.text(tax.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 470, itemY, { width: 70, align: 'right' });
        doc.text(subtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 470, itemY, { width: 75, align: 'right' });

        // Totals section
        const totalsY = itemY + 80;
        doc.moveTo(50, totalsY)
           .lineTo(545, totalsY)
           .stroke();

        doc.font('Helvetica-Bold');
        doc.text('SUBTOTAL:', 390, totalsY + 10, { width: 100, align: 'left' });
        doc.text(`RM ${subtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, totalsY + 10, { width: 75, align: 'right' });

        doc.text('SST (8%):', 390, totalsY + 25, { width: 100, align: 'left' });
        doc.text(`RM ${tax.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, totalsY + 25, { width: 75, align: 'right' });

        doc.fontSize(11);
        doc.text('TOTAL:', 390, totalsY + 45, { width: 100, align: 'left' });
        doc.text(`RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, totalsY + 45, { width: 75, align: 'right' });

        // Footer
        doc.fontSize(8).font('Helvetica');
        doc.text(
          'Payment Terms: Please make payment within 30 days from invoice date.',
          50,
          totalsY + 100,
          { width: 495, align: 'center' }
        );

        doc.text(
          'Bank Details: [Add your bank details here]',
          50,
          totalsY + 120,
          { width: 495, align: 'center' }
        );

        // Finalize PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save PDF to file system
   */
  static async savePDF(invoice: Invoice, pdfBuffer: Buffer): Promise<string> {
    const uploadsDir = path.join(__dirname, '../../uploads/pdfs/invoices');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `invoice-${invoice.invoice_number}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdfBuffer);

    return `/uploads/pdfs/invoices/${filename}`;
  }
}
