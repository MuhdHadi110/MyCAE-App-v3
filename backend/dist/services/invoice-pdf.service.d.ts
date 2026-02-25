import { Invoice } from '../entities/Invoice';
export declare class InvoicePDFService {
    private static readonly CACHE_DIR;
    private static readonly CACHE_EXPIRY_MS;
    /**
     * Initialize cache directory
     */
    private static initializeCacheDir;
    /**
     * Get cache file path for an invoice
     */
    private static getCachePath;
    /**
     * Check if cached PDF exists and is still valid
     */
    private static isCacheValid;
    /**
     * Get logo size in pixels based on setting
     */
    private static getLogoWidth;
    /**
     * Add image with compression to PDF
     */
    private static addImageToPDF;
    /**
     * Generate invoice PDF with company branding and caching
     */
    static generateInvoicePDF(invoice: Invoice): Promise<Buffer>;
    /**
     * Save PDF to file system
     */
    static savePDF(invoice: Invoice, pdfBuffer: Buffer): Promise<string>;
}
//# sourceMappingURL=invoice-pdf.service.d.ts.map