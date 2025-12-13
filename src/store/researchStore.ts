import { create } from 'zustand';
import apiService from '../services/api.service';
import type { ResearchProject, TimesheetEntry } from '../types/research.types';

interface ResearchState {
  researchProjects: ResearchProject[];
  loading: boolean;
  fetchResearchProjects: () => Promise<void>;
  addResearchProject: (project: Omit<ResearchProject, 'id' | 'createdDate' | 'lastUpdated'>) => Promise<void>;
  updateResearchProject: (id: string, project: Partial<ResearchProject>) => Promise<void>;
  deleteResearchProject: (id: string) => Promise<void>;
  logTimesheetHours: (projectId: string, entry: Omit<TimesheetEntry, 'id' | 'createdDate'>) => Promise<void>;
  approveTimesheetEntry: (entryId: string, approvedBy: string) => Promise<void>;
  deleteTimesheetEntry: (entryId: string) => Promise<void>;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  researchProjects: [],
  loading: false,

  fetchResearchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await apiService.getAllResearchProjects();
      set({ researchProjects: projects });
    } catch (error) {
      console.error('Error fetching research projects:', error);
      set({ researchProjects: [] });
    } finally {
      set({ loading: false });
    }
  },

  addResearchProject: async (project) => {
    try {
      await apiService.createResearchProject(project);
      await get().fetchResearchProjects();
    } catch (error) {
      console.error('Error creating research project:', error);
      throw error;
    }
  },

  updateResearchProject: async (id, project) => {
    try {
      await apiService.updateResearchProject(id, project);
      await get().fetchResearchProjects();
    } catch (error) {
      console.error('Error updating research project:', error);
      throw error;
    }
  },

  deleteResearchProject: async (id) => {
    try {
      await apiService.deleteResearchProject(id);
      await get().fetchResearchProjects();
    } catch (error) {
      console.error('Error deleting research project:', error);
      throw error;
    }
  },

  logTimesheetHours: async (projectId, entry) => {
    try {
      await apiService.logResearchTimesheet({ ...entry, projectId });
      await get().fetchResearchProjects();
    } catch (error) {
      console.error('Error logging timesheet hours:', error);
      throw error;
    }
  },

  approveTimesheetEntry: async (entryId, approvedBy) => {
    try {
      await apiService.approveResearchTimesheet(entryId, approvedBy);
      await get().fetchResearchProjects();
    } catch (error) {
      console.error('Error approving timesheet entry:', error);
      throw error;
    }
  },

  deleteTimesheetEntry: async (entryId) => {
    try {
      await apiService.deleteResearchTimesheet(entryId);
      await get().fetchResearchProjects();
    } catch (error) {
      console.error('Error deleting timesheet entry:', error);
      throw error;
    }
  },
}));
