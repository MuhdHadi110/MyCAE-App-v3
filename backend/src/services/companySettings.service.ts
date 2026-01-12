import { AppDataSource } from '../config/database';
import { CompanySettings } from '../entities/CompanySettings';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Cache for company settings (singleton pattern)
let cachedSettings: CompanySettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export class CompanySettingsService {
  private static getRepository(): Repository<CompanySettings> {
    return AppDataSource.getRepository(CompanySettings);
  }

  /**
   * Get company settings (cached)
   */
  static async getSettings(): Promise<CompanySettings> {
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
          address:
            'UDINI Square, Block 2-03-13A,\nLebuh Tunku Kudin 3,\n11700 Gelugor, Penang, Malaysia',
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
          invoice_footer:
            'Payment Terms: Please make payment within 30 days from invoice date.',
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
    } catch (error: any) {
      console.error('Error loading company settings:', error);
      throw new Error(`Failed to load company settings: ${error.message}`);
    }
  }

  /**
   * Update company settings
   */
  static async updateSettings(
    data: Partial<CompanySettings>
  ): Promise<CompanySettings> {
    const repo = this.getRepository();
    let settings = await repo.findOne({ where: {} });

    if (!settings) {
      settings = repo.create(data);
    } else {
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
  static async uploadLogo(
    file: Express.Multer.File
  ): Promise<{ logoUrl: string }> {
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
  static async deleteLogo(): Promise<void> {
    const settings = await this.getSettings();

    if (settings.logo_url) {
      const logoPath = path.join(__dirname, '../../', settings.logo_url);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      await this.updateSettings({ logo_url: null as any });
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  static clearCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
  }
}
