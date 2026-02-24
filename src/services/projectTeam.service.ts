import { api } from './http-client';

export interface ProjectTeamMember {
  id: string;
  teamMemberId: string;
  role: 'lead_engineer' | 'engineer';
  name: string;
  email: string;
  department: string;
  avatar: string;
}

class ProjectTeamService {
  /**
   * Get all team members for a project
   */
  async getProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
    const response = await api.get(`/projects/${projectId}/team`);
    return response.data;
  }

  /**
   * Add a team member to a project
   */
  async addTeamMember(
    projectId: string,
    teamMemberId: string,
    role: 'lead_engineer' | 'engineer' = 'engineer'
  ): Promise<ProjectTeamMember> {
    const response = await api.post(`/projects/${projectId}/team`, {
      teamMemberId,
      role,
    });
    return response.data;
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    projectId: string,
    teamMemberId: string,
    role: 'lead_engineer' | 'engineer'
  ): Promise<void> {
    await api.put(`/projects/${projectId}/team/${teamMemberId}`, { role });
  }

  /**
   * Remove a team member from a project
   */
  async removeTeamMember(projectId: string, teamMemberId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/team/${teamMemberId}`);
  }

  /**
   * Get all team assignments across all projects
   * Returns assignments grouped by team member ID
   */
  async getAllTeamAssignments(): Promise<Record<string, Array<{
    projectId: string;
    projectCode: string;
    projectTitle: string;
    role: 'lead_engineer' | 'engineer';
    status: string;
  }>>> {
    const response = await api.get('/projects/team-assignments');
    return response.data;
  }
}

export default new ProjectTeamService();
