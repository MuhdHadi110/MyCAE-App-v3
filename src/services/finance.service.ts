import { api, transformKeysToCAmelCase } from './http-client';

/**
 * Finance Service
 *
 * Handles all finance-related operations:
 * - Invoices (received from clients)
 * - Issued POs (sent to vendors)
 * - Purchase Orders (received from clients)
 * - Exchange rates and currency conversion
 */

class FinanceService {
  // ==================== Invoices ====================

  async getAllInvoices(filters?: any): Promise<any[]> {
    const response = await api.get('/invoices', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    // Transform keys to camelCase for consistency with component expectations
    return data.map((invoice: any) => transformKeysToCAmelCase(invoice));
  }

  async getInvoiceById(id: string): Promise<any> {
    const response = await api.get(`/invoices/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async getNextInvoiceNumber(): Promise<string> {
    const response = await api.get('/invoices/next-number');
    return response.data.nextNumber;
  }

  async getInvoiceProjectContext(projectCode: string): Promise<any> {
    const response = await api.get(`/invoices/project/${projectCode}/context`);
    return transformKeysToCAmelCase(response.data);
  }

  async createInvoice(invoice: any): Promise<any> {
    const response = await api.post('/invoices', invoice);
    return transformKeysToCAmelCase(response.data);
  }

  async updateInvoice(id: string, updates: any): Promise<any> {
    const response = await api.put(`/invoices/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  }

  async downloadInvoicePDF(id: string): Promise<Blob> {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async submitInvoiceForApproval(id: string): Promise<any> {
    const response = await api.post(`/invoices/${id}/submit-for-approval`);
    return transformKeysToCAmelCase(response.data);
  }

  async approveInvoice(id: string): Promise<any> {
    const response = await api.post(`/invoices/${id}/approve`);
    return transformKeysToCAmelCase(response.data);
  }

  async withdrawInvoice(id: string): Promise<any> {
    const response = await api.post(`/invoices/${id}/withdraw`);
    return transformKeysToCAmelCase(response.data);
  }

  async markInvoiceAsSent(id: string): Promise<any> {
    const response = await api.post(`/invoices/${id}/mark-as-sent`);
    return transformKeysToCAmelCase(response.data);
  }

  async markInvoiceAsPaid(id: string): Promise<any> {
    const response = await api.post(`/invoices/${id}/mark-as-paid`);
    return transformKeysToCAmelCase(response.data);
  }

  // ==================== Issued POs (Outgoing) ====================

  async getAllIssuedPOs(filters?: any): Promise<any[]> {
    const response = await api.get('/issued-pos', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async getIssuedPOById(id: string): Promise<any> {
    const response = await api.get(`/issued-pos/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async getNextIssuedPONumber(): Promise<string> {
    const response = await api.get('/issued-pos/next-number');
    return response.data.nextNumber;
  }

  async createIssuedPO(issuedPO: any): Promise<any> {
    const response = await api.post('/issued-pos', issuedPO);
    return transformKeysToCAmelCase(response.data);
  }

  async updateIssuedPO(id: string, updates: any): Promise<any> {
    const response = await api.put(`/issued-pos/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteIssuedPO(id: string): Promise<void> {
    await api.delete(`/issued-pos/${id}`);
  }

  async downloadIssuedPOPDF(id: string): Promise<Blob> {
    const response = await api.get(`/issued-pos/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Received Invoices (From Vendors) ====================

  async getAllReceivedInvoices(filters?: any): Promise<any[]> {
    const response = await api.get('/received-invoices', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async getReceivedInvoiceById(id: string): Promise<any> {
    const response = await api.get(`/received-invoices/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createReceivedInvoice(invoice: any): Promise<any> {
    const response = await api.post('/received-invoices', invoice);
    return transformKeysToCAmelCase(response.data);
  }

  async updateReceivedInvoice(id: string, updates: any): Promise<any> {
    const response = await api.put(`/received-invoices/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteReceivedInvoice(id: string): Promise<void> {
    await api.delete(`/received-invoices/${id}`);
  }

  async verifyReceivedInvoice(id: string): Promise<any> {
    const response = await api.post(`/received-invoices/${id}/verify`);
    return transformKeysToCAmelCase(response.data);
  }

  async markReceivedInvoiceAsPaid(id: string): Promise<any> {
    const response = await api.post(`/received-invoices/${id}/mark-as-paid`);
    return transformKeysToCAmelCase(response.data);
  }

  // ==================== Purchase Orders (Received from Clients) ====================

  async getAllPurchaseOrders(filters?: any): Promise<any> {
    const response = await api.get('/purchase-orders', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return data.map((po: any) => transformKeysToCAmelCase(po));
  }

  async getPurchaseOrderById(id: string): Promise<any> {
    const response = await api.get(`/purchase-orders/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createPurchaseOrder(data: {
    poNumber: string;
    projectCode: string;
    clientName: string;
    amount: number | string;
    currency?: string;
    receivedDate: Date | string;
    dueDate?: Date | string;
    description?: string;
    status?: string;
    fileUrl?: string;
    customExchangeRate?: number;
  }): Promise<any> {
    const response = await api.post('/purchase-orders', data);
    return transformKeysToCAmelCase(response.data);
  }

  async updatePurchaseOrder(id: string, updates: any): Promise<any> {
    const response = await api.put(`/purchase-orders/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deletePurchaseOrder(id: string): Promise<any> {
    const response = await api.delete(`/purchase-orders/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async uploadPurchaseOrderFile(formData: FormData): Promise<any> {
    const response = await api.post('/purchase-orders/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async downloadPurchaseOrderFile(filename: string): Promise<Blob> {
    const response = await api.get(`/purchase-orders/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Alias for getAllPurchaseOrders
  async getPurchaseOrders(filters?: any): Promise<any> {
    return this.getAllPurchaseOrders(filters);
  }

  // ==================== PO Revisions ====================

  async getPORevisions(poNumberBase: string): Promise<any> {
    const response = await api.get(`/purchase-orders/${poNumberBase}/revisions`);
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return data.map((revision: any) => transformKeysToCAmelCase(revision));
  }

  async createPORevision(
    poId: string,
    data: {
      amount: number;
      currency: string;
      receivedDate: Date | string;
      description?: string;
      fileUrl?: string;
      revisionReason: string;
    }
  ): Promise<any> {
    const response = await api.post(`/purchase-orders/${poId}/revisions`, data);
    return transformKeysToCAmelCase(response.data);
  }

  async adjustPOMYRAmount(
    poId: string,
    adjustedAmount: number,
    reason: string
  ): Promise<any> {
    const response = await api.patch(`/purchase-orders/${poId}/adjust-myr`, {
      adjustedAmount,
      reason,
    });
    return transformKeysToCAmelCase(response.data);
  }

  // ==================== Exchange Rates ====================

  async getExchangeRates(): Promise<any[]> {
    const response = await api.get('/exchange-rates');
    return response.data || [];
  }

  async createExchangeRate(data: { fromCurrency: string; rate: number; effectiveDate: string }): Promise<any> {
    const response = await api.post('/exchange-rates', data);
    return response.data;
  }

  async importExchangeRates(): Promise<any> {
    const response = await api.post('/exchange-rates/import');
    return response.data;
  }

  async convertCurrency(amount: number, fromCurrency: string): Promise<{ amountMYR: number; rate: number }> {
    const response = await api.get('/exchange-rates/convert', {
      params: { amount, fromCurrency },
    });
    return response.data;
  }

  async getExchangeRate(fromCurrency: string, date?: Date): Promise<{ rate: number; source: 'api' | 'manual' }> {
    const response = await api.get('/exchange-rates/single', {
      params: { fromCurrency, date: date?.toISOString().split('T')[0] },
    });
    return response.data;
  }

  // ==================== Categories ====================

  async getAllCategories(): Promise<any[]> {
    const response = await api.get('/categories');
    return response.data || [];
  }

  async getCategoryById(id: string): Promise<any> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: { name: string; description?: string }): Promise<any> {
    const response = await api.post('/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string }>): Promise<any> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

// Export singleton instance
export default new FinanceService();
