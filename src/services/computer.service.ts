import { api } from './http-client';

/**
 * Computer Service
 *
 * Handles all computer/PC management operations:
 * - Computer CRUD
 * - Assignment to users
 * - Unassignment/release
 * - Assignment history
 */

class ComputerService {
  /**
   * Get all computers with optional filters
   */
  async getAllComputers(filters?: any): Promise<any[]> {
    const response = await api.get('/computers', { params: filters });
    // Backend returns { data, total, limit, offset }, extract the data array
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  }

  /**
   * Get computer by ID
   */
  async getComputerById(id: string): Promise<any> {
    const response = await api.get(`/computers/${id}`);
    return response.data;
  }

  /**
   * Create new computer
   */
  async createComputer(computer: any): Promise<any> {
    const response = await api.post('/computers', computer);
    return response.data;
  }

  /**
   * Update computer
   */
  async updateComputer(id: string, updates: any): Promise<any> {
    const response = await api.put(`/computers/${id}`, updates);
    return response.data;
  }

  /**
   * Delete computer
   */
  async deleteComputer(id: string): Promise<void> {
    await api.delete(`/computers/${id}`);
  }

  /**
   * Get computers assigned to a specific user
   */
  async getComputersAssignedTo(userId: string, filters?: any): Promise<any[]> {
    const response = await api.get(`/computers/assigned/${userId}`, { params: filters });
    // Backend returns { data, total, limit, offset }, extract the data array
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  }

  /**
   * Assign computer to user
   */
  async assignComputerToUser(
    computerId: string,
    userId: string,
    installedSoftware?: string[],
    notes?: string
  ): Promise<any> {
    const response = await api.post(`/computers/${computerId}/assign`, {
      userId,
      installedSoftware,
      notes,
    });
    return response.data;
  }

  /**
   * Unassign computer (release from user)
   */
  async unassignComputer(computerId: string): Promise<any> {
    const response = await api.post(`/computers/${computerId}/unassign`, {});
    return response.data;
  }

  /**
   * Set computer maintenance status
   */
  async setMaintenanceStatus(computerId: string, inMaintenance: boolean): Promise<any> {
    const response = await api.post(`/computers/${computerId}/maintenance`, { inMaintenance });
    return response.data;
  }
}

// Export singleton instance
export default new ComputerService();
