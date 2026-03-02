import { IssuedPO } from '../entities/IssuedPO';
export declare class IssuedPOPDFService {
    private static readonly CACHE_DIR;
    private static readonly CACHE_EXPIRY_MS;
    /**
     * Initialize cache directory
     */
    private static initializeCacheDir;
    /**
     * Get cache file path for a PO
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
     * Generate Issued PO PDF with company branding and caching
     */
    static generateIssuedPOPDF(issuedPO: IssuedPO): Promise<Buffer>;
    /**
     * Save PDF to file system
     */
    static savePDF(issuedPO: IssuedPO, pdfBuffer: Buffer): Promise<string>;
}
//# sourceMappingURL=issued-po-pdf.service.d.ts.map