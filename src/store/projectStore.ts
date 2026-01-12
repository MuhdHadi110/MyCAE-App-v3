import { create } from 'zustand';
import type { Project, Timesheet } from '../types/project.types';
import api from '../services/api.service';

interface ProjectStore {
  projects: Project[];
  timesheets: Timesheet[];
  loading: boolean;
  lastFetched: number | null;

  // Actions
  fetchProjects: (force?: boolean) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdDate' | 'lastUpdated'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  fetchTimesheets: (filters?: { engineerId?: string; startDate?: string; endDate?: string }) => Promise<void>;
  addTimesheet: (timesheet: Omit<Timesheet, 'id' | 'createdDate'>) => Promise<void>;
  updateTimesheet: (id: string, updates: Partial<Timesheet>) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  timesheets: [],
  loading: false,
  lastFetched: null,

  fetchProjects: async (force = false) => {
    const { lastFetched, loading } = get();
    const now = Date.now();

    // Skip if already loading or if data is fresh (unless forced)
    if (loading) return;
    if (!force && lastFetched && (now - lastFetched) < CACHE_DURATION) {
      return;
    }

    set({ loading: true });
    try {
      const projects = await api.getProjects();
      set({
        projects: Array.isArray(projects) ? projects : [],
        loading: false,
        lastFetched: Date.now()
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ loading: false });
    }
  },

  addProject: async (projectData) => {
    try {
      const newProject = await api.createProject(projectData);
      set((state) => ({
        projects: [newProject, ...state.projects],
        lastFetched: Date.now()
      }));
      return newProject;
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const updatedProject = await api.updateProject(id, updates);
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? { ...project, ...updatedProject } : project
        ),
        lastFetched: Date.now()
      }));
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await api.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        lastFetched: Date.now()
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  fetchTimesheets: async (filters?: { engineerId?: string; startDate?: string; endDate?: string }) => {
    set({ loading: true });
    try {
      const timesheets = await api.getTimesheets(filters);
      // Ensure timesheets is always an array and hours are numbers
      const transformedTimesheets = (Array.isArray(timesheets) ? timesheets : []).map(ts => ({
        ...ts,
        hours: parseFloat(ts.hours as any) || 0,
      }));
      set({ timesheets: transformedTimesheets, loading: false });
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
      set({ timesheets: [], loading: false });
    }
  },

  addTimesheet: async (timesheetData) => {
    try {
      const newTimesheet = await api.createTimesheet(timesheetData);
      // Add to timesheets directly
      set((state) => ({
        timesheets: [newTimesheet, ...state.timesheets],
      }));
      // Background refresh projects for updated hours (don't await)
      get().fetchProjects(true);
    } catch (error) {
      console.error('Failed to add timesheet:', error);
      throw error;
    }
  },

  updateTimesheet: async (id, updates) => {
    try {
      const updatedTimesheet = await api.updateTimesheet(id, updates);
      // Update in store directly
      set((state) => ({
        timesheets: state.timesheets.map((timesheet) =>
          timesheet.id === id ? { ...timesheet, ...updatedTimesheet } : timesheet
        ),
      }));
      // Background refresh projects for updated hours (don't await)
      get().fetchProjects(true);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update timesheet';
      console.error('Error updating timesheet:', errorMessage);
      throw error;
    }
  },

  deleteTimesheet: async (id) => {
    try {
      await api.deleteTimesheet(id);
      // Remove from store directly
      set((state) => ({
        timesheets: state.timesheets.filter((timesheet) => timesheet.id !== id),
      }));
      // Background refresh projects for updated hours (don't await)
      get().fetchProjects(true);
    } catch (error) {
      console.error('Failed to delete timesheet:', error);
      throw error;
    }
  },
}));
