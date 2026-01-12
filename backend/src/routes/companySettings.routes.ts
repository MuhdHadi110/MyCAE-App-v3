import { Router, Request, Response } from 'express';
import { CompanySettingsService } from '../services/companySettings.service';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Configure multer for logo upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

/**
 * GET /api/company-settings
 * Get company settings (public - needed for PDF generation)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await CompanySettingsService.getSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Failed to fetch company settings' });
  }
});

/**
 * PUT /api/company-settings
 * Update company settings (admin only)
 */
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user.roles?.includes('admin') && user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      company_name,
      registration_number,
      address,
      phone,
      mobile,
      email,
      sst_id,
      primary_color,
      invoice_footer,
      po_footer,
      bank_details,
      header_position,
      logo_size,
      show_sst_id,
      show_bank_details,
      page_margin,
    } = req.body;

    const updatedSettings = await CompanySettingsService.updateSettings({
      company_name,
      registration_number,
      address,
      phone,
      mobile,
      email,
      sst_id,
      primary_color,
      invoice_footer,
      po_footer,
      bank_details,
      header_position,
      logo_size,
      show_sst_id,
      show_bank_details,
      page_margin,
    });

    res.json(updatedSettings);
  } catch (error: any) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Failed to update company settings' });
  }
});

/**
 * POST /api/company-settings/logo
 * Upload company logo (admin only)
 */
router.post(
  '/logo',
  authenticate,
  upload.single('logo'),
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      const user = (req as any).user;
      if (!user.roles?.includes('admin') && user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const result = await CompanySettingsService.uploadLogo(req.file);
      res.json(result);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ message: error.message || 'Failed to upload logo' });
    }
  }
);

/**
 * DELETE /api/company-settings/logo
 * Delete company logo (admin only)
 */
router.delete('/logo', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user.roles?.includes('admin') && user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await CompanySettingsService.deleteLogo();
    res.json({ message: 'Logo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Failed to delete logo' });
  }
});

export default router;
