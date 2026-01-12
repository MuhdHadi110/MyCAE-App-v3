import { api, transformKeysToCAmelCase } from './http-client';

/**
 * Research Service
 *
 * Handles all research project operations:
 * - Research project CRUD
 * - Research timesheet logging and approval
 * - Project status filtering
 */

class ResearchService {
  // ==================== Research Projects ====================

  async getAllResearchProjects(filters?: any): Promise<any[]> {
    const response = await api.get('/research/projects', { params: filters });
    // Backend returns { data: [...], total: X }, extract the data array
    const result = response.data;
    const projects = Array.isArray(result) ? result : (result?.data || []);
    return transformKeysToCAmelCase(projects);
  }

  async getResearchProjectById(id: string): Promise<any> {
    const response = await api.get(`/research/projects/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createResearchProject(project: any): Promise<any> {
    const response = await api.post('/research/projects', project);
    return transformKeysToCAmelCase(response.data);
  }

  async updateResearchProject(id: string, updates: any): Promise<any> {
    const response = await api.put(`/research/projects/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteResearchProject(id: string): Promise<void> {
    await api.delete(`/research/projects/${id}`);
  }

  async getResearchProjectsByStatus(status: string, filters?: any): Promise<any[]> {
    const response = await api.get(`/research/projects/status/${status}`, { params: filters });
    return transformKeysToCAmelCase(response.data);
  }

  // ==================== Research Timesheets ====================

  async logResearchTimesheet(entry: any): Promise<any> {
    const response = await api.post('/research/timesheets', entry);
    return transformKeysToCAmelCase(response.data);
  }

  async approveResearchTimesheet(entryId: string, approvedBy: string): Promise<any> {
    const response = await api.put(`/research/timesheets/${entryId}/approve`, { approvedBy });
    return transformKeysToCAmelCase(response.data);
  }

  async deleteResearchTimesheet(entryId: string): Promise<void> {
    await api.delete(`/research/timesheets/${entryId}`);
  }

  async getResearchTimesheets(filters?: {
    projectId?: string;
    teamMemberId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const response = await api.get('/research/timesheets', { params: filters });
    return response.data;
  }
}

// Export singleton instance
export default new ResearchService();
