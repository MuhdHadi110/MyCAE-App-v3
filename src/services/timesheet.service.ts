import { api, transformKeysToCAmelCase } from './http-client';

/**
 * Timesheet Service
 *
 * Handles all timesheet-related operations:
 * - Timesheet CRUD for regular projects
 * - Client management
 */

class TimesheetService {
  // ==================== Timesheets ====================

  async getTimesheets(filters?: any): Promise<any[]> {
    const response = await api.get('/timesheets', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async createTimesheet(timesheet: any): Promise<any> {
    const response = await api.post('/timesheets', timesheet);
    return transformKeysToCAmelCase(response.data);
  }

  async updateTimesheet(id: string, updates: any): Promise<any> {
    const response = await api.put(`/timesheets/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteTimesheet(id: string): Promise<void> {
    await api.delete(`/timesheets/${id}`);
  }

  // ==================== Clients ====================

  async getAllClients(filters?: any): Promise<any[]> {
    const response = await api.get('/clients', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async getClientById(id: string): Promise<any> {
    const response = await api.get(`/clients/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createClient(client: any): Promise<any> {
    const response = await api.post('/clients', client);
    return transformKeysToCAmelCase(response.data);
  }

  async updateClient(id: string, updates: any): Promise<any> {
    const response = await api.put(`/clients/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  }
}

// Export singleton instance
export default new TimesheetService();
