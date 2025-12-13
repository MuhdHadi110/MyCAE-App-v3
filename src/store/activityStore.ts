import { create } from 'zustand';
import { ActivityLog } from '../types/activity.types';
import apiService from '../services/api.service';

interface ActivityStore {
  activities: ActivityLog[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchRecentActivity: (limit?: number) => Promise<void>;
  fetchAllActivity: (filters?: any) => Promise<void>;
  fetchActivityByUser: (userId: string, filters?: any) => Promise<void>;
  fetchActivityByModule: (module: string, filters?: any) => Promise<void>;
  logActivity: (activity: Omit<ActivityLog, 'id'>) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  activities: [],
  loading: false,
  error: null,

  fetchRecentActivity: async (limit = 50) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getRecentActivity(limit) as any;
      const activities = Array.isArray(response) ? response : (response?.data as any) || [];
      set({ activities: Array.isArray(activities) ? activities : [], loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch activity';
      console.error('Error fetching recent activity:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchAllActivity: async (filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getAllActivity(filters);
      const activities = Array.isArray(response) ? response : response.data || [];
      set({ activities, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch activity';
      console.error('Error fetching all activity:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchActivityByUser: async (userId: string, filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getActivityByUser(userId, filters);
      const activities = Array.isArray(response) ? response : response.data || [];
      set({ activities, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch user activity';
      console.error('Error fetching user activity:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchActivityByModule: async (module: string, filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getActivityByModule(module, filters);
      const activities = Array.isArray(response) ? response : response.data || [];
      set({ activities, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch module activity';
      console.error('Error fetching module activity:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  logActivity: async (activity: Omit<ActivityLog, 'id'>) => {
    try {
      set({ error: null });
      const newActivity = await apiService.createActivityLog(activity);
      set(state => ({
        activities: [newActivity, ...state.activities].slice(0, 50), // Keep last 50
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to log activity';
      console.error('Error logging activity:', errorMessage);
      set({ error: errorMessage });
    }
  },
}));
