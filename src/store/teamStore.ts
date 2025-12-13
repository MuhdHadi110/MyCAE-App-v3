import { create } from 'zustand';
import apiService from '../services/api.service';
import type { TeamMember } from '../types/team.types';

interface TeamStore {
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;

  fetchTeamMembers: (filters?: any) => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdDate' | 'lastUpdated'>) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  getTeamByDepartment: (department: string) => Promise<void>;
}

/**
 * Transform backend team member response to frontend TeamMember type
 * Handles nested user data and provides default values for missing fields
 */
const transformTeamMember = (backendMember: any): TeamMember => {
  // If the member already has the correct structure, return as-is
  if (backendMember.name && !backendMember.user) {
    return backendMember;
  }

  // Transform from backend structure with nested user object
  const user = backendMember.user || {};

  const transformed = {
    id: backendMember.id,
    userId: backendMember.user_id || backendMember.userId || user.id,
    name: user.name || backendMember.name || 'Unknown',
    email: user.email || backendMember.email || '',
    role: user.role || backendMember.role || 'engineer',
    department: backendMember.department || 'engineering',
    phone: backendMember.phone,
    avatar: backendMember.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'user'}`,
    activeProjects: parseInt(backendMember.activeProjects) || 0,
    totalHoursThisMonth: parseFloat(backendMember.totalHoursThisMonth) || 0,
    joinDate: backendMember.joinDate || new Date().toISOString(),
    status: backendMember.status || 'active',
    hourlyRate: backendMember.hourlyRate,
    position: backendMember.position,
    certifications: backendMember.certifications || [],
  };

  return transformed;
};

export const useTeamStore = create<TeamStore>((set) => ({
  teamMembers: [],
  loading: false,
  error: null,

  fetchTeamMembers: async (filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getAllTeamMembers(filters) as any;

      // Handle both array and paginated responses
      let rawMembers: any[] = [];
      if (Array.isArray(response)) {
        rawMembers = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rawMembers = response.data;
      } else if (response?.data && Array.isArray(response.data.data)) {
        rawMembers = response.data.data;
      }

      // Transform all members
      const teamMembers = rawMembers.map(transformTeamMember);
      set({ teamMembers, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch team members';
      console.error('Error fetching team members:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  addTeamMember: async (memberData) => {
    try {
      set({ loading: true, error: null });
      const newMember = await apiService.createTeamMember(memberData);
      const transformedMember = transformTeamMember(newMember);
      set((state) => ({
        teamMembers: [...state.teamMembers, transformedMember],
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add team member';
      console.error('Error adding team member:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateTeamMember: async (id, updates) => {
    try {
      set({ loading: true, error: null });

      // Update on backend
      const updatedMember = await apiService.updateTeamMember(id, updates);

      // Update only the modified member in local state (avoid N+1 query)
      const transformedMember = transformTeamMember(updatedMember);
      set(state => ({
        teamMembers: state.teamMembers.map(member =>
          member.id === id ? transformedMember : member
        ),
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update team member';
      console.error('Error updating team member:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error; // Re-throw to let the modal handle it
    }
  },

  deleteTeamMember: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiService.deleteTeamMember(id);
      set((state) => ({
        teamMembers: state.teamMembers.filter((member) => member.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete team member';
      console.error('Error deleting team member:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  getTeamByDepartment: async (department: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getTeamByDepartment(department) as any;

      // Handle both array and paginated responses
      let rawMembers: any[] = [];
      if (Array.isArray(response)) {
        rawMembers = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rawMembers = response.data;
      } else if (response?.data && Array.isArray(response.data.data)) {
        rawMembers = response.data.data;
      }

      // Transform all members
      const teamMembers = rawMembers.map(transformTeamMember);
      set({ teamMembers, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch team by department';
      console.error('Error fetching team by department:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },
}));
