import { api, transformKeysToCAmelCase } from './http-client';

/**
 * Project Service
 *
 * Handles all project-related operations:
 * - Project CRUD
 * - Project status updates
 * - PO file uploads/downloads
 * - Project hourly rates
 * - Migration operations
 */

class ProjectService {
  // ==================== Projects ====================

  async getProjects(filters?: any): Promise<any[]> {
    const response = await api.get('/projects', { params: filters });
    try {
      const transformed = transformKeysToCAmelCase(response.data);
      const projects = Array.isArray(transformed) ? transformed : [transformed];

      const enriched = projects.map((project: any) => ({
        ...project,
        // Add engineerId alias for compatibility with dashboards
        engineerId: project.leadEngineerId || project.engineerId,
        engineerName: project.leadEngineer?.name || project.engineerName,
        managerName: project.manager?.name || project.managerName,
      }));

      return enriched;
    } catch (error) {
      console.error('Error transforming projects data:', error);
      return response.data;
    }
  }

  async getProjectById(id: string): Promise<any> {
    const response = await api.get(`/projects/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async getNextProjectCode(): Promise<{
    latestCode: string | null;
    nextSuggestion: string;
    yearPrefix: string;
    year: number;
  }> {
    const response = await api.get('/projects/next-code');
    return transformKeysToCAmelCase(response.data);
  }

  async createProject(project: any): Promise<any> {
    const response = await api.post('/projects', project);
    return transformKeysToCAmelCase(response.data);
  }

  async updateProject(id: string, updates: any): Promise<any> {
    const response = await api.put(`/projects/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  }

  async updateProjectStatus(id: string, status: string, dateField?: { field: string; value: string }): Promise<any> {
    const response = await api.patch(`/projects/${id}/status`, { status, dateField });
    return transformKeysToCAmelCase(response.data);
  }

  // ==================== PO File Management ====================

  async uploadProjectPO(id: string, file: File): Promise<{ success: boolean; fileUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('poFile', file);

    const response = await api.post(`/projects/${id}/upload-po`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteProjectPO(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/projects/${id}/po-file`);
    return response.data;
  }

  async downloadProjectPO(fileUrl: string): Promise<Blob> {
    const response = await api.get(fileUrl, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Project Hourly Rates ====================

  async getProjectHourlyRates(projectId: string): Promise<any[]> {
    const response = await api.get(`/project-hourly-rates/${projectId}`);
    return response.data?.data || [];
  }

  async saveProjectHourlyRates(projectId: string, rates: Record<string, number>): Promise<any> {
    const response = await api.put(`/project-hourly-rates/${projectId}`, { rates });
    return response.data;
  }

  async deleteProjectHourlyRate(projectId: string, teamMemberId: string): Promise<void> {
    await api.delete(`/project-hourly-rates/${projectId}/${teamMemberId}`);
  }

  // ==================== Migration ====================

  async uploadMigrationFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/migration/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async executeMigration(projects: any[]): Promise<any> {
    const response = await api.post('/migration/execute', { projects });
    return response.data;
  }

  async getMigrationTemplate(): Promise<any> {
    const response = await api.get('/migration/template');
    return response.data;
  }

  // ==================== Variation Orders ====================

  async getVariationOrders(projectId: string): Promise<any[]> {
    const response = await api.get(`/projects/${projectId}/variation-orders`);
    return response.data || [];
  }

  async getProjectWithVOs(projectId: string): Promise<any> {
    const response = await api.get(`/projects/${projectId}/with-vos`);
    return response.data;
  }

  async createVariationOrder(parentProjectId: string, voData: any): Promise<any> {
    const response = await api.post(`/projects/${parentProjectId}/create-vo`, voData);
    return response.data;
  }
}

// Export singleton instance
export default new ProjectService();
