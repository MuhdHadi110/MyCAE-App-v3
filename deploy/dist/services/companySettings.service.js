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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettingsService = void 0;
const database_1 = require("../config/database");
const CompanySettings_1 = require("../entities/CompanySettings");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Cache for company settings (singleton pattern)
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
class CompanySettingsService {
    static getRepository() {
        return database_1.AppDataSource.getRepository(CompanySettings_1.CompanySettings);
    }
    /**
     * Get company settings (cached)
     */
    static async getSettings() {
        const now = Date.now();
        // Return cached settings if valid
        if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
            return cachedSettings;
        }
        try {
            const repo = this.getRepository();
            let settings = await repo.findOne({ where: {} });
            if (!settings) {
                console.log('No company settings found, creating defaults');
                // If no settings exist, create default
                settings = repo.create({
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
                });
                settings = await repo.save(settings);
            }
            // Update cache
            cachedSettings = settings;
            cacheTimestamp = now;
            console.log('Company settings loaded:', {
                company_name: settings.company_name,
                logo_url: settings.logo_url
            });
            return settings;
        }
        catch (error) {
            console.error('Error loading company settings:', error);
            throw new Error(`Failed to load company settings: ${error.message}`);
        }
    }
    /**
     * Update company settings
     */
    static async updateSettings(data) {
        const repo = this.getRepository();
        let settings = await repo.findOne({ where: {} });
        if (!settings) {
            settings = repo.create(data);
        }
        else {
            // Update existing settings
            Object.assign(settings, data);
        }
        const savedSettings = await repo.save(settings);
        // Invalidate cache
        cachedSettings = savedSettings;
        cacheTimestamp = Date.now();
        return savedSettings;
    }
    /**
     * Upload company logo
     */
    static async uploadLogo(file) {
        const uploadsDir = path.join(__dirname, '../../uploads/logos');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // Generate unique filename
        const ext = path.extname(file.originalname);
        const filename = `company-logo-${Date.now()}${ext}`;
        const filepath = path.join(uploadsDir, filename);
        // Save file
        fs.writeFileSync(filepath, file.buffer);
        // Get current settings and delete old logo if exists
        const settings = await this.getSettings();
        if (settings.logo_url) {
            const oldLogoPath = path.join(__dirname, '../../', settings.logo_url);
            if (fs.existsSync(oldLogoPath)) {
                fs.unlinkSync(oldLogoPath);
            }
        }
        // Update settings with new logo URL
        const logoUrl = `/uploads/logos/${filename}`;
        await this.updateSettings({ logo_url: logoUrl });
        return { logoUrl };
    }
    /**
     * Delete company logo
     */
    static async deleteLogo() {
        const settings = await this.getSettings();
        if (settings.logo_url) {
            const logoPath = path.join(__dirname, '../../', settings.logo_url);
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
            await this.updateSettings({ logo_url: null });
        }
    }
    /**
     * Clear cache (useful for testing)
     */
    static clearCache() {
        cachedSettings = null;
        cacheTimestamp = 0;
    }
}
exports.CompanySettingsService = CompanySettingsService;
//# sourceMappingURL=companySettings.service.js.map