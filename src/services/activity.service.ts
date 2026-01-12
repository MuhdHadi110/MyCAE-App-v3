import { api } from './http-client';

/**
 * Activity Service
 *
 * Handles all activity logging and retrieval operations:
 * - Activity log creation
 * - Activity filtering by user, module, date
 * - Recent activity retrieval
 */

class ActivityService {
  /**
   * Create activity log entry
   */
  async createActivityLog(activity: {
    action: string;
    description: string;
    user: string;
    timestamp: string;
  }): Promise<any> {
    const response = await api.post('/activity', activity);
    return response.data;
  }

  /**
   * Get recent activity with limit
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    const response = await api.get('/activity', { params: { limit } });
    return response.data;
  }

  /**
   * Get all activity with filters
   */
  async getAllActivity(filters?: any): Promise<any> {
    const response = await api.get('/activity', { params: filters });
    return response.data;
  }

  /**
   * Get activity by ID
   */
  async getActivityById(id: string): Promise<any> {
    const response = await api.get(`/activity/${id}`);
    return response.data;
  }

  /**
   * Get activity by user ID
   */
  async getActivityByUser(userId: string, filters?: any): Promise<any> {
    const response = await api.get(`/activity/user/${userId}`, { params: filters });
    return response.data;
  }

  /**
   * Get activity by module (e.g., 'inventory', 'projects', 'team')
   */
  async getActivityByModule(module: string, filters?: any): Promise<any> {
    const response = await api.get(`/activity/module/${module}`, { params: filters });
    return response.data;
  }
}

// Export singleton instance
export default new ActivityService();
