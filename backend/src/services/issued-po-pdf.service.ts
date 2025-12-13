import PDFDocument from 'pdfkit';
import { IssuedPO } from '../entities/IssuedPO';
import * as fs from 'fs';
import * as path from 'path';

export class IssuedPOPDFService {
  /**
   * Generate Issued PO PDF matching MyCAE template
   */
  static async generateIssuedPOPDF(issuedPO: IssuedPO): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Company Header
        doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'center' });
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
        doc.moveDown(1);

        // PO Details
        const poDetailsY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`PO NUMBER:`, 50, poDetailsY);
        doc.font('Helvetica').text(issuedPO.po_number, 150, poDetailsY);

        doc.font('Helvetica-Bold').text(`PO DATE:`, 50, poDetailsY + 15);
        doc.font('Helvetica').text(
          new Date(issuedPO.issue_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          150,
          poDetailsY + 15
        );

        if (issuedPO.project_code) {
          doc.font('Helvetica-Bold').text(`PROJECT:`, 50, poDetailsY + 30);
          doc.font('Helvetica').text(issuedPO.project_code, 150, poDetailsY + 30);
        }

        // Vendor Details
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('VENDOR:', 50, poDetailsY + 60);
        doc.font('Helvetica').fontSize(9);
        doc.text(issuedPO.recipient, 50, poDetailsY + 75);

        // Line separator
        doc.moveTo(50, poDetailsY + 110)
           .lineTo(545, poDetailsY + 110)
           .stroke();

        // Items Section
        const itemsY = poDetailsY + 125;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('ITEMS / SERVICES:', 50, itemsY);

        doc.font('Helvetica').fontSize(9);
        doc.text(issuedPO.items, 50, itemsY + 20, { width: 495 });

        // Amount section (if not 0)
        if (issuedPO.amount > 0) {
          const amountY = itemsY + 100;
          doc.moveTo(50, amountY)
             .lineTo(545, amountY)
             .stroke();

          doc.font('Helvetica-Bold').fontSize(10);
          doc.text('TOTAL AMOUNT:', 350, amountY + 15);
          doc.text(`RM ${Number(issuedPO.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, amountY + 15, {
            width: 75,
            align: 'right'
          });
        }

        // Terms and Conditions
        const termsY = doc.y + 40;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('TERMS & CONDITIONS:', 50, termsY);

        doc.font('Helvetica').fontSize(8);
        const terms = [
          '1. Please quote our PO number on all invoices and correspondence.',
          '2. Delivery must be made as per schedule.',
          '3. Payment terms: Net 30 days from invoice date.',
          '4. Any changes to this order must be approved in writing.',
        ];

        let currentY = termsY + 20;
        terms.forEach(term => {
          doc.text(term, 50, currentY, { width: 495 });
          currentY += 15;
        });

        // Signature section
        const signatureY = currentY + 40;
        doc.moveTo(50, signatureY)
           .lineTo(545, signatureY)
           .stroke();

        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Authorized By:', 50, signatureY + 20);
        doc.text('MYCAE TECHNOLOGIES SDN BHD', 50, signatureY + 50);

        doc.text('Date:', 350, signatureY + 20);
        doc.font('Helvetica').text(
          new Date().toLocaleDateString('en-GB'),
          350,
          signatureY + 35
        );

        // Footer
        doc.fontSize(7).font('Helvetica');
        doc.text(
          'This is a computer-generated document. No signature is required.',
          50,
          750,
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
  static async savePDF(issuedPO: IssuedPO, pdfBuffer: Buffer): Promise<string> {
    const uploadsDir = path.join(__dirname, '../../uploads/pdfs/issued-pos');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `po-${issuedPO.po_number}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdfBuffer);

    return `/uploads/pdfs/issued-pos/${filename}`;
  }
}
