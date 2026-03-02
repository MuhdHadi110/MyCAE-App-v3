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
exports.InvoicePDFService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class InvoicePDFService {
    /**
     * Initialize cache directory
     */
    static initializeCacheDir() {
        if (!fs.existsSync(this.CACHE_DIR)) {
            fs.mkdirSync(this.CACHE_DIR, { recursive: true });
        }
    }
    /**
     * Get cache file path for an invoice
     */
    static getCachePath(invoiceId) {
        return path.join(this.CACHE_DIR, `invoice-${invoiceId}.pdf`);
    }
    /**
     * Check if cached PDF exists and is still valid
     */
    static isCacheValid(cachePath) {
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
    static getLogoWidth(size) {
        const sizes = {
            small: 60,
            medium: 100,
            large: 150,
        };
        return sizes[size] || 100;
    }
    /**
     * Add image with compression to PDF
     */
    static addImageToPDF(doc, imagePath, x, y, width) {
        if (fs.existsSync(imagePath)) {
            try {
                // Images in PDFs should be limited to reasonable DPI (72-96) for web viewing
                doc.image(imagePath, x, y, { width, fit: [width, width * 0.75] });
            }
            catch (error) {
                console.warn(`Failed to add image ${imagePath}:`, error);
            }
        }
    }
    /**
     * Generate invoice PDF with company branding and caching
     */
    static async generateInvoicePDF(invoice) {
        this.initializeCacheDir();
        // Check cache first
        const cachePath = this.getCachePath(invoice.id);
        if (this.isCacheValid(cachePath)) {
            console.log(`Loading invoice PDF from cache: ${invoice.invoice_number}`);
            try {
                return fs.readFileSync(cachePath);
            }
            catch (error) {
                console.error('Failed to read cached PDF:', error);
                // Fall through to regenerate
            }
        }
        // Use fallback default settings (simplified to avoid dependency issues)
        const settings = {
            company_name: 'MYCAE TECHNOLOGIES SDN BHD',
            registration_number: '863273W',
            address: 'UDINI Square, Block 2-03-13A,\nLebuh Tunku Kudin 3,\n11700 Gelugor, Penang, Malaysia',
            phone: '+604 376 2355',
            mobile: '+60 17 2008173',
            email: 'kctang@mycae.com.my',
            sst_id: 'P11-1808-31028245',
            primary_color: '#2563eb',
            header_position: 'top-center',
            logo_size: 'medium',
            show_sst_id: true,
            show_bank_details: true,
            page_margin: 50,
            invoice_footer: 'Payment Terms: Please make payment within 30 days from invoice date.',
            bank_details: '[Add your bank details here]',
            logo_url: null
        };
        console.log('Generating PDF for invoice:', {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            hasLogo: !!settings.logo_url
        });
        return new Promise(async (resolve, reject) => {
            try {
                const margin = settings.page_margin || 50;
                const doc = new pdfkit_1.default({ size: 'A4', margin });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', async () => {
                    try {
                        const pdfBuffer = Buffer.concat(buffers);
                        // Save to cache
                        fs.writeFileSync(cachePath, pdfBuffer);
                        resolve(pdfBuffer);
                    }
                    catch (error) {
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
                        }
                        else if (settings.header_position === 'top-right') {
                            logoX = 595 - margin - logoWidth;
                        }
                        // Add image with optimized sizing
                        this.addImageToPDF(doc, logoPath, logoX, startY, logoWidth);
                        startY += logoWidth * 0.6 + 10; // Adjust based on typical logo aspect ratio
                    }
                }
                // Company Header
                doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', margin, startY, {
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
                if (settings.phone)
                    contactParts.push(`Tel: ${settings.phone}`);
                if (settings.mobile)
                    contactParts.push(`H/P: ${settings.mobile}`);
                if (contactParts.length > 0) {
                    doc.text(contactParts.join('         '), { align: 'center' });
                }
                if (settings.email) {
                    doc.text(`Email: ${settings.email}`, { align: 'center' });
                }
                if (settings.show_sst_id && settings.sst_id) {
                    doc.text(`SST ID: ${settings.sst_id}`, { align: 'center' });
                }
                doc.moveDown(1);
                // Invoice Details (Right side)
                const invoiceDetailsY = doc.y;
                doc.fontSize(9).font('Helvetica');
                // Invoice Number
                const invoiceNumberY = invoiceDetailsY;
                doc.text(`INVOICE NUMBER:`, 350, invoiceNumberY, { width: 100 });
                doc.font('Helvetica-Bold').text(invoice.invoice_number, 470, invoiceNumberY, { width: 75, align: 'right' });
                // Invoice Date
                doc.font('Helvetica').text(`INVOICE DATE:`, 350, invoiceNumberY + 18, { width: 100 });
                doc.font('Helvetica-Bold').text(new Date(invoice.invoice_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }), 470, invoiceNumberY + 18, { width: 75, align: 'right' });
                // Client Details
                doc.font('Helvetica-Bold').fontSize(10);
                doc.text('SOLD TO:', margin, invoiceNumberY + 50);
                doc.font('Helvetica').fontSize(9);
                doc.text(invoice.project_name, margin, invoiceNumberY + 68, { width: 280 });
                // Line separator
                doc
                    .moveTo(margin, invoiceDetailsY + 110)
                    .lineTo(595 - margin, invoiceDetailsY + 110)
                    .stroke();
                // Table Header
                const tableTop = invoiceNumberY + 100;
                doc.font('Helvetica-Bold').fontSize(9);
                doc.text('NO', margin, tableTop);
                doc.text('DESCRIPTION', margin + 30, tableTop);
                doc.text('QTY', 340, tableTop, { width: 40, align: 'center' });
                doc.text('UNIT PRICE', 390, tableTop, { width: 60, align: 'right' });
                doc.text('(RM)', 390, tableTop + 12, { width: 60, align: 'right' });
                doc.text('AMOUNT(RM)', 470, tableTop, { width: 75, align: 'right' });
                // Table line
                doc
                    .moveTo(margin, tableTop + 15)
                    .lineTo(595 - margin, tableTop + 15)
                    .stroke();
                // Line Item
                const itemY = tableTop + 28;
                doc.font('Helvetica').fontSize(9);
                doc.text('1', margin, itemY);
                const description = invoice.remark || `Professional consultancy fee for ${invoice.project_name}`;
                doc.text(description, margin + 30, itemY, { width: 250 });
                // Calculate tax and totals
                const subtotal = Number(invoice.amount);
                const tax = subtotal * 0.08; // 8% SST
                const total = subtotal + tax;
                doc.text('1', 340, itemY, { width: 40, align: 'center' });
                doc.text(subtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 390, itemY, {
                    width: 60,
                    align: 'right',
                });
                doc.text(total.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 470, itemY, {
                    width: 75,
                    align: 'right',
                });
                // Totals section
                const totalsY = itemY + 80;
                doc
                    .moveTo(margin, totalsY)
                    .lineTo(595 - margin, totalsY)
                    .stroke();
                doc.font('Helvetica-Bold');
                doc.text('SUBTOTAL:', 390, totalsY + 10, { width: 100, align: 'left' });
                doc.text(`RM ${subtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, totalsY + 10, {
                    width: 75,
                    align: 'right',
                });
                doc.text('SST (8%):', 390, totalsY + 25, { width: 100, align: 'left' });
                doc.text(`RM ${tax.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, totalsY + 25, {
                    width: 75,
                    align: 'right',
                });
                doc.fontSize(11);
                doc.text('TOTAL:', 390, totalsY + 45, { width: 100, align: 'left' });
                doc.text(`RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 470, totalsY + 45, {
                    width: 75,
                    align: 'right',
                });
                // Footer - use settings
                doc.fontSize(8).font('Helvetica');
                if (settings.invoice_footer) {
                    doc.text(settings.invoice_footer, margin, totalsY + 100, {
                        width: 595 - margin * 2,
                        align: 'center',
                    });
                }
                if (settings.show_bank_details && settings.bank_details) {
                    doc.text(`Bank Details: ${settings.bank_details}`, margin, totalsY + 120, {
                        width: 595 - margin * 2,
                        align: 'center',
                    });
                }
                // Finalize PDF
                doc.end();
            }
            catch (error) {
                console.error('PDF Generation Error:', {
                    error: error.message,
                    stack: error.stack,
                    invoiceId: invoice?.id,
                    invoiceNumber: invoice?.invoice_number
                });
                reject(new Error(`PDF generation failed: ${error.message}`));
            }
        });
    }
    /**
     * Save PDF to file system
     */
    static async savePDF(invoice, pdfBuffer) {
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
exports.InvoicePDFService = InvoicePDFService;
InvoicePDFService.CACHE_DIR = path.join(__dirname, '../../uploads/pdfs/cache');
InvoicePDFService.CACHE_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours
//# sourceMappingURL=invoice-pdf.service.js.map