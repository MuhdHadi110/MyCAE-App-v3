import PDFDocument from 'pdfkit';
import { IssuedPO } from '../entities/IssuedPO';
import * as fs from 'fs';
import * as path from 'path';

export class IssuedPOPDFService {
  private static readonly CACHE_DIR = path.join(__dirname, '../../uploads/pdfs/cache');
  private static readonly CACHE_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

  /**
   * Initialize cache directory
   */
  private static initializeCacheDir(): void {
    if (!fs.existsSync(this.CACHE_DIR)) {
      fs.mkdirSync(this.CACHE_DIR, { recursive: true });
    }
  }

  /**
   * Get cache file path for a PO
   */
  private static getCachePath(poId: string | number): string {
    return path.join(this.CACHE_DIR, `po-${poId}.pdf`);
  }

  /**
   * Check if cached PDF exists and is still valid
   */
  private static isCacheValid(cachePath: string): boolean {
    if (!fs.existsSync(cachePath)) {
      return false;
    }
    const stats = fs.statSync(cachePath);
    const ageMs = Date.now() - stats.mtime.getTime();
    return ageMs < this.CACHE_EXPIRY_MS;
  }

  /**
   * Get logo size in pixels based on setting
   */
  private static getLogoWidth(size: string): number {
    const sizes: Record<string, number> = {
      small: 60,
      medium: 100,
      large: 150,
    };
    return sizes[size] || 100;
  }

  /**
   * Add image with compression to PDF
   */
  private static addImageToPDF(doc: any, imagePath: string, x: number, y: number, width: number): void {
    if (fs.existsSync(imagePath)) {
      try {
        // Images in PDFs should be limited to reasonable DPI (72-96) for web viewing
        doc.image(imagePath, x, y, { width, fit: [width, width * 0.75] });
      } catch (error) {
        console.warn(`Failed to add image ${imagePath}:`, error);
      }
    }
  }

  /**
   * Generate Issued PO PDF with company branding and caching
   */
  static async generateIssuedPOPDF(issuedPO: IssuedPO): Promise<Buffer> {
    this.initializeCacheDir();

    // Check cache first
    const cachePath = this.getCachePath(issuedPO.id);
    if (this.isCacheValid(cachePath)) {
      console.log(`Loading PO PDF from cache: ${issuedPO.po_number}`);
      try {
        return fs.readFileSync(cachePath);
      } catch (error) {
        console.error('Failed to read cached PDF:', error);
        // Fall through to regenerate
      }
    }

    // Use default settings
    const settings = {
      company_name: 'MYCAE TECHNOLOGIES SDN BHD',
      registration_number: '863273W',
      address: 'UDINI Square, Block 2-03-13A,\nLebuh Tunku Kudin 3,\n11700 Gelugor, Penang, Malaysia',
      phone: '+604 376 2355',
      mobile: '+60 17 2008173',
      email: 'kctang@mycae.com.my',
      sst_id: 'P11-1808-31028245',
      page_margin: 50,
      logo_url: null,
      logo_size: 'medium',
      header_position: 'top-center',
      po_footer: 'This is a computer-generated document. No signature is required.',
      bank_details: '[Add your bank details here]',
      show_bank_details: true
    };

    return new Promise(async (resolve, reject) => {
      try {
        const margin = settings.page_margin || 50;
        const doc = new PDFDocument({ size: 'A4', margin });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
          try {
            const pdfBuffer = Buffer.concat(buffers);
            // Save to cache
            fs.writeFileSync(cachePath, pdfBuffer);
            resolve(pdfBuffer);
          } catch (error) {
            console.error('Failed to cache PDF:', error);
            resolve(Buffer.concat(buffers)); // Still return PDF even if caching fails
          }
        });

        let startY = margin;

        // Add logo if exists (with size optimization)
        if (settings.logo_url) {
          const logoPath = path.join(__dirname, '../../', settings.logo_url);
          if (fs.existsSync(logoPath)) {
            const logoWidth = this.getLogoWidth(settings.logo_size);
            let logoX = margin;

            // Position based on header_position setting
            if (settings.header_position === 'top-center') {
              logoX = (595 - logoWidth) / 2; // A4 width is 595 points
            } else if (settings.header_position === 'top-right') {
              logoX = 595 - margin - logoWidth;
            }

            // Add image with optimized sizing
            this.addImageToPDF(doc, logoPath, logoX, startY, logoWidth);
            startY += logoWidth * 0.6 + 10;
          }
        }

        // Company Header
        doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', margin, startY, {
          align: 'center',
          width: 595 - margin * 2,
        });
        doc.moveDown(0.5);

        // Company Details from settings
        doc.fontSize(10).font('Helvetica-Bold');
        const companyTitle = settings.registration_number
          ? `${settings.company_name} (${settings.registration_number})`
          : settings.company_name;
        doc.text(companyTitle, { align: 'center' });

        doc.fontSize(9).font('Helvetica');
        if (settings.address) {
          const addressLines = settings.address.split('\n');
          addressLines.forEach((line) => {
            doc.text(line, { align: 'center' });
          });
        }

        // Contact info
        const contactParts = [];
        if (settings.phone) contactParts.push(`Tel: ${settings.phone}`);
        if (settings.mobile) contactParts.push(`H/P: ${settings.mobile}`);
        if (contactParts.length > 0) {
          doc.text(contactParts.join('         '), { align: 'center' });
        }

        if (settings.email) {
          doc.text(`Email: ${settings.email}`, { align: 'center' });
        }

        doc.moveDown(1);

        // PO Details
        const poDetailsY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`PO NUMBER:`, margin, poDetailsY);
        doc.font('Helvetica').text(issuedPO.po_number, margin + 100, poDetailsY);

        doc.font('Helvetica-Bold').text(`PO DATE:`, margin, poDetailsY + 15);
        doc.font('Helvetica').text(
          new Date(issuedPO.issue_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          margin + 100,
          poDetailsY + 15
        );

        if (issuedPO.project_code) {
          doc.font('Helvetica-Bold').text(`PROJECT:`, margin, poDetailsY + 30);
          doc.font('Helvetica').text(issuedPO.project_code, margin + 100, poDetailsY + 30);
        }

        // Vendor Details
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('VENDOR:', margin, poDetailsY + 60);
        doc.font('Helvetica').fontSize(9);
        doc.text(issuedPO.recipient, margin, poDetailsY + 75);

        // Line separator
        doc
          .moveTo(margin, poDetailsY + 110)
          .lineTo(595 - margin, poDetailsY + 110)
          .stroke();

        // Items Section
        const itemsY = poDetailsY + 125;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('ITEMS / SERVICES:', margin, itemsY);

        doc.font('Helvetica').fontSize(9);
        doc.text(issuedPO.items, margin, itemsY + 20, { width: 595 - margin * 2 });

        // Amount section (if not 0)
        if (issuedPO.amount > 0) {
          const amountY = itemsY + 100;
          doc
            .moveTo(margin, amountY)
            .lineTo(595 - margin, amountY)
            .stroke();

          doc.font('Helvetica-Bold').fontSize(10);
          doc.text('TOTAL AMOUNT:', 350, amountY + 15);
          doc.text(
            `RM ${Number(issuedPO.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
            470,
            amountY + 15,
            {
              width: 75,
              align: 'right',
            }
          );
        }

        // Terms and Conditions
        const termsY = doc.y + 40;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('TERMS & CONDITIONS:', margin, termsY);

        doc.font('Helvetica').fontSize(8);
        const defaultTerms = [
          '1. Please quote our PO number on all invoices and correspondence.',
          '2. Delivery must be made as per schedule.',
          '3. Payment terms: Net 30 days from invoice date.',
          '4. Any changes to this order must be approved in writing.',
        ];

        let currentY = termsY + 20;
        defaultTerms.forEach((term) => {
          doc.text(term, margin, currentY, { width: 595 - margin * 2 });
          currentY += 15;
        });

        // Signature section
        const signatureY = currentY + 40;
        doc
          .moveTo(margin, signatureY)
          .lineTo(595 - margin, signatureY)
          .stroke();

        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Authorized By:', margin, signatureY + 20);
        doc.text(settings.company_name, margin, signatureY + 50);

        doc.text('Date:', 350, signatureY + 20);
        doc.font('Helvetica').text(new Date().toLocaleDateString('en-GB'), 350, signatureY + 35);

        // Footer
        doc.fontSize(7).font('Helvetica');
        const footerText =
          settings.po_footer || 'This is a computer-generated document. No signature is required.';
        doc.text(footerText, margin, 750, {
          width: 595 - margin * 2,
          align: 'center',
        });

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
