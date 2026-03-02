import { CompanySettings } from '../entities/CompanySettings';
export declare class CompanySettingsService {
    private static getRepository;
    /**
     * Get company settings (cached)
     */
    static getSettings(): Promise<CompanySettings>;
    /**
     * Update company settings
     */
    static updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings>;
    /**
     * Upload company logo
     */
    static uploadLogo(file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    /**
     * Delete company logo
     */
    static deleteLogo(): Promise<void>;
    /**
     * Clear cache (useful for testing)
     */
    static clearCache(): void;
}
//# sourceMappingURL=companySettings.service.d.ts.map