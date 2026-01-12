import { api } from './http-client';
import type { InventoryItem, BulkCheckout } from '../types/inventory.types';
import type { ExtendedCheckout } from '../types/checkout.types';
import type { MaintenanceTicket } from '../types/maintenance.types';

/**
 * Inventory Service
 *
 * Handles all inventory-related operations:
 * - Inventory items CRUD
 * - Checkouts (single and bulk)
 * - Check-ins
 * - Maintenance tickets
 * - Bulk imports
 */

class InventoryService {
  // ==================== Inventory Items ====================

  async getInventoryItems(filters?: {
    category?: string;
    status?: string;
    lowStock?: boolean;
    search?: string;
  }): Promise<InventoryItem[]> {
    const response = await api.get('/inventory', { params: filters });
    // Backend returns { data, total, limit, offset }, extract the data array
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  }

  async getInventoryById(id: string): Promise<InventoryItem> {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const response = await api.post('/inventory', item);
    return response.data;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.put(`/inventory/${id}`, updates);
    return response.data;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await api.delete(`/inventory/${id}`);
  }

  async bulkCreateInventoryItems(items: Array<Omit<InventoryItem, 'id'>>): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    errors?: Array<{ row: number; error: string }>;
  }> {
    const response = await api.post('/inventory/bulk/create', { items });
    return response.data;
  }

  // ==================== Checkouts ====================

  async createSingleCheckout(checkout: any): Promise<{ success: boolean; checkoutId: string; masterBarcode: string; message: string }> {
    const response = await api.post('/checkouts/single', checkout);
    return response.data;
  }

  async createBulkCheckout(checkout: BulkCheckout): Promise<{ success: boolean; masterBarcode: string; checkoutsCreated: number; message: string }> {
    const response = await api.post('/checkouts/bulk', checkout);
    return response.data;
  }

  async checkInSingle(checkIn: any): Promise<{ success: boolean; message: string; checkoutStatus: string; remainingQuantity: number }> {
    const response = await api.post('/checkouts/checkin/single', checkIn);
    return response.data;
  }

  async checkInBulk(checkIn: any): Promise<{ success: boolean; message: string; returnType: string; masterBarcode: string }> {
    const response = await api.post('/checkouts/checkin/bulk', checkIn);
    return response.data;
  }

  async getAllCheckouts(): Promise<ExtendedCheckout[]> {
    const response = await api.get('/checkouts');
    return response.data;
  }

  async getCheckoutByMasterBarcode(masterBarcode: string): Promise<any> {
    const response = await api.get(`/checkouts/${masterBarcode}`);
    return response.data;
  }

  // ==================== Maintenance Tickets ====================

  async getAllMaintenanceTickets(): Promise<MaintenanceTicket[]> {
    const response = await api.get('/maintenance');
    return response.data;
  }

  async createMaintenanceTicket(ticket: Omit<MaintenanceTicket, 'id'>): Promise<MaintenanceTicket> {
    const response = await api.post('/maintenance', ticket);
    return response.data;
  }

  async updateMaintenanceTicket(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    const response = await api.put(`/maintenance/${id}`, updates);
    return response.data;
  }

  async deleteMaintenanceTicket(id: string): Promise<void> {
    await api.delete(`/maintenance/${id}`);
  }

  async getMaintenanceTicketById(id: string): Promise<MaintenanceTicket> {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  }
}

// Export singleton instance
export default new InventoryService();
