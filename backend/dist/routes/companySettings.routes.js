"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companySettings_service_1 = require("../services/companySettings.service");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Configure multer for logo upload
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    },
});
/**
 * GET /api/company-settings
 * Get company settings (public - needed for PDF generation)
 */
router.get('/', async (_req, res) => {
    try {
        const settings = await companySettings_service_1.CompanySettingsService.getSettings();
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching company settings:', error);
        res.status(500).json({ message: 'Failed to fetch company settings' });
    }
});
/**
 * PUT /api/company-settings
 * Update company settings (admin only)
 */
router.put('/', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user is admin
        const user = req.user;
        if (!user.roles?.includes('admin') && user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const { company_name, registration_number, address, phone, mobile, email, sst_id, primary_color, invoice_footer, po_footer, bank_details, header_position, logo_size, show_sst_id, show_bank_details, page_margin, } = req.body;
        const updatedSettings = await companySettings_service_1.CompanySettingsService.updateSettings({
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
    }
    catch (error) {
        console.error('Error updating company settings:', error);
        res.status(500).json({ message: 'Failed to update company settings' });
    }
});
/**
 * POST /api/company-settings/logo
 * Upload company logo (admin only)
 */
router.post('/logo', auth_1.authenticate, upload.single('logo'), async (req, res) => {
    try {
        // Check if user is admin
        const user = req.user;
        if (!user.roles?.includes('admin') && user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const result = await companySettings_service_1.CompanySettingsService.uploadLogo(req.file);
        res.json(result);
    }
    catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({ message: error.message || 'Failed to upload logo' });
    }
});
/**
 * DELETE /api/company-settings/logo
 * Delete company logo (admin only)
 */
router.delete('/logo', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user is admin
        const user = req.user;
        if (!user.roles?.includes('admin') && user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        await companySettings_service_1.CompanySettingsService.deleteLogo();
        res.json({ message: 'Logo deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting logo:', error);
        res.status(500).json({ message: 'Failed to delete logo' });
    }
});
exports.default = router;
//# sourceMappingURL=companySettings.routes.js.map