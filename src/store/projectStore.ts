import { create } from 'zustand';
import type { Project, Timesheet } from '../types/project.types';
import api from '../services/api.service';

interface ProjectStore {
  projects: Project[];
  timesheets: Timesheet[];
  loading: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdDate' | 'lastUpdated'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  fetchTimesheets: () => Promise<void>;
  addTimesheet: (timesheet: Omit<Timesheet, 'id' | 'createdDate'>) => Promise<void>;
  updateTimesheet: (id: string, updates: Partial<Timesheet>) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  timesheets: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await api.getProjects();
      set({ projects, loading: false });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ loading: false });
    }
  },

  addProject: async (projectData) => {
    try {
      const newProject = await api.createProject(projectData);
      set((state) => ({
        projects: [...state.projects, newProject],
      }));
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
          project.id === id ? updatedProject : project
        ),
      }));
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  },

  deleteProject: async (id) => {
    try {
      await api.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  fetchTimesheets: async () => {
    set({ loading: true });
    try {
      const timesheets = await api.getTimesheets();
      // Ensure timesheets is always an array and hours are numbers
      const transformedTimesheets = (Array.isArray(timesheets) ? timesheets : []).map(ts => ({
        ...ts,
        hours: parseFloat(ts.hours as any) || 0,
      }));
      set({ timesheets: transformedTimesheets, loading: false });
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
      // Keep timesheets as empty array on error
      set({ timesheets: [], loading: false });
    }
  },

  addTimesheet: async (timesheetData) => {
    try {
      const newTimesheet = await api.createTimesheet(timesheetData);
      set((state) => ({
        timesheets: [...state.timesheets, newTimesheet],
      }));
      // Also update the project's actual hours
      useProjectStore.getState().fetchProjects();
    } catch (error) {
      console.error('Failed to add timesheet:', error);
    }
  },

  updateTimesheet: async (id, updates) => {
    try {
      const updatedTimesheet = await api.updateTimesheet(id, updates);

      set((state) => ({
        timesheets: state.timesheets.map((timesheet) =>
          timesheet.id === id ? updatedTimesheet : timesheet
        ),
      }));

      // Refresh projects to update actual hours
      useProjectStore.getState().fetchProjects();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update timesheet';
      console.error('Error updating timesheet:', errorMessage);
      throw error; // Re-throw to let the screen handle it and show user-friendly error
    }
  },

  deleteTimesheet: async (id) => {
    try {
      await api.deleteTimesheet(id);
      set((state) => ({
        timesheets: state.timesheets.filter((timesheet) => timesheet.id !== id),
      }));
      // Refresh projects to update actual hours
      useProjectStore.getState().fetchProjects();
    } catch (error) {
      console.error('Failed to delete timesheet:', error);
    }
  },
}));