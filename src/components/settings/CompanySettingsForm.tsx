import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Trash2, Building2, Image, Palette, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { companySettingsService, type CompanySettings, type UpdateCompanySettingsData } from '../../services/companySettings.service';
import { logger } from '../../lib/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const CompanySettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateCompanySettingsData>({
    company_name: '',
    registration_number: '',
    address: '',
    phone: '',
    mobile: '',
    email: '',
    sst_id: '',
    primary_color: '#2563eb',
    invoice_footer: '',
    po_footer: '',
    bank_details: '',
    header_position: 'top-center',
    logo_size: 'medium',
    show_sst_id: true,
    show_bank_details: true,
    page_margin: 50,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await companySettingsService.getSettings();
      setSettings(data);
      setFormData({
        company_name: data.company_name || '',
        registration_number: data.registration_number || '',
        address: data.address || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        email: data.email || '',
        sst_id: data.sst_id || '',
        primary_color: data.primary_color || '#2563eb',
        invoice_footer: data.invoice_footer || '',
        po_footer: data.po_footer || '',
        bank_details: data.bank_details || '',
        header_position: data.header_position || 'top-center',
        logo_size: data.logo_size || 'medium',
        show_sst_id: data.show_sst_id ?? true,
        show_bank_details: data.show_bank_details ?? true,
        page_margin: data.page_margin || 50,
      });
    } catch (error: any) {
      logger.error('Error loading company settings:', error);
      toast.error('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await companySettingsService.updateSettings(formData);
      setSettings(updated);
      toast.success('Company settings saved successfully');
    } catch (error: any) {
      logger.error('Error saving company settings:', error);
      toast.error('Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await companySettingsService.uploadLogo(file);
      setSettings(prev => prev ? { ...prev, logo_url: result.logoUrl } : prev);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      logger.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings?.logo_url) return;

    if (!confirm('Are you sure you want to delete the company logo?')) return;

    try {
      await companySettingsService.deleteLogo();
      setSettings(prev => prev ? { ...prev, logo_url: null } : prev);
      toast.success('Logo deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting logo:', error);
      toast.error('Failed to delete logo');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Company Settings</h2>
            <p className="text-sm text-gray-500">Configure your company details for PDF documents</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Logo Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Company Logo</h3>
        </div>

        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
            {settings?.logo_url ? (
              <img
                src={`${API_URL}${settings.logo_url}`}
                alt="Company Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Image className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No logo</p>
              </div>
            )}
          </div>

          {/* Logo Actions */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Upload your company logo. Recommended size: 300x100px.
              Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
            </p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
              {settings?.logo_url && (
                <button
                  onClick={handleDeleteLogo}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>

            {/* Logo Layout Options */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Position</label>
                <select
                  name="header_position"
                  value={formData.header_position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Size</label>
                <select
                  name="logo_size"
                  value={formData.logo_size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="small">Small (60px)</option>
                  <option value="medium">Medium (100px)</option>
                  <option value="large">Large (150px)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Company Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 863273W"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter company address (one line per address line)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., +604 376 2355"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., +60 17 2008173"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., contact@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SST ID</label>
            <input
              type="text"
              name="sst_id"
              value={formData.sst_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., P11-1808-31028245"
            />
          </div>
        </div>
      </div>

      {/* PDF Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">PDF Document Options</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Margin (px)</label>
              <input
                type="number"
                name="page_margin"
                value={formData.page_margin}
                onChange={handleInputChange}
                min={20}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="show_sst_id"
                  checked={formData.show_sst_id}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show SST ID on PDFs</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="show_bank_details"
                  checked={formData.show_bank_details}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show Bank Details on PDFs</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer Text</label>
            <textarea
              name="invoice_footer"
              value={formData.invoice_footer}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Payment terms, notes, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Footer Text</label>
            <textarea
              name="po_footer"
              value={formData.po_footer}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="PO terms, signature requirements, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
            <textarea
              name="bank_details"
              value={formData.bank_details}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Bank name, account number, etc."
            />
          </div>
        </div>
      </div>

      {/* Color Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Branding Colors</h3>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleInputChange}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="#2563eb"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            This color will be used for accents in generated PDF documents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsForm;
