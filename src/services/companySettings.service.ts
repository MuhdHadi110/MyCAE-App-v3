import { httpClient } from './http-client';

export interface CompanySettings {
  id: string;
  company_name: string;
  registration_number: string | null;
  address: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  sst_id: string | null;
  logo_url: string | null;
  primary_color: string;
  invoice_footer: string | null;
  po_footer: string | null;
  bank_details: string | null;
  header_position: 'top-left' | 'top-center' | 'top-right';
  logo_size: 'small' | 'medium' | 'large';
  show_sst_id: boolean;
  show_bank_details: boolean;
  page_margin: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanySettingsData {
  company_name?: string;
  registration_number?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  sst_id?: string;
  primary_color?: string;
  invoice_footer?: string;
  po_footer?: string;
  bank_details?: string;
  header_position?: 'top-left' | 'top-center' | 'top-right';
  logo_size?: 'small' | 'medium' | 'large';
  show_sst_id?: boolean;
  show_bank_details?: boolean;
  page_margin?: number;
}

export const companySettingsService = {
  /**
   * Get company settings
   */
  async getSettings(): Promise<CompanySettings> {
    const response = await httpClient.get<CompanySettings>('/company-settings');
    return response.data;
  },

  /**
   * Update company settings
   */
  async updateSettings(data: UpdateCompanySettingsData): Promise<CompanySettings> {
    const response = await httpClient.put<CompanySettings>('/company-settings', data);
    return response.data;
  },

  /**
   * Upload company logo
   */
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await httpClient.post<{ logoUrl: string }>('/company-settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete company logo
   */
  async deleteLogo(): Promise<void> {
    await httpClient.delete('/company-settings/logo');
  },
};

export default companySettingsService;
