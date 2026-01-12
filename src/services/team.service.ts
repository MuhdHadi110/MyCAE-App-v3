import { api, transformKeysToCAmelCase } from './http-client';

/**
 * Team Service
 *
 * Handles all team member management operations:
 * - Team member CRUD
 * - Avatar updates
 * - Department filtering
 * - Team member activation/deactivation
 */

class TeamService {
  /**
   * Get all team members with optional filters
   */
  async getAllTeamMembers(filters?: any): Promise<any[]> {
    const response = await api.get('/team', { params: filters });
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  /**
   * Get team member by ID
   */
  async getTeamMemberById(id: string): Promise<any> {
    const response = await api.get(`/team/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  /**
   * Create new team member
   */
  async createTeamMember(member: any): Promise<any> {
    const response = await api.post('/team', member);
    return transformKeysToCAmelCase(response.data);
  }

  /**
   * Update team member
   */
  async updateTeamMember(id: string, updates: any): Promise<any> {
    const response = await api.put(`/team/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  /**
   * Delete team member (soft delete)
   */
  async deleteTeamMember(id: string): Promise<void> {
    await api.delete(`/team/${id}`);
  }

  /**
   * Reactivate team member
   */
  async reactivateTeamMember(id: string): Promise<any> {
    const response = await api.post(`/team/${id}/reactivate`);
    return response.data;
  }

  /**
   * Update team member avatar
   */
  async updateTeamMemberAvatar(teamMemberId: string, avatarId: string): Promise<any> {
    const response = await api.patch(`/team/${teamMemberId}/avatar`, { avatarId });
    return transformKeysToCAmelCase(response.data);
  }

  /**
   * Get team members by department
   */
  async getTeamByDepartment(department: string, filters?: any): Promise<any[]> {
    const response = await api.get(`/team/department/${department}`, { params: filters });
    return response.data;
  }
}

// Export singleton instance
export default new TeamService();
