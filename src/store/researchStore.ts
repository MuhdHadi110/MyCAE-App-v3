import { create } from 'zustand';
import projectService from '../services/api.service';
import type { ResearchProject, TimesheetEntry } from '../types/research.types';

interface ResearchState {
  researchProjects: ResearchProject[];
  researchTimesheets: TimesheetEntry[];
  loading: boolean;
  lastFetched: number | null; // Track when data was last fetched
  fetchResearchProjects: (force?: boolean) => Promise<void>;
  fetchResearchTimesheets: (filters?: any) => Promise<void>;
  addResearchProject: (project: Omit<ResearchProject, 'id' | 'createdDate' | 'lastUpdated'>) => Promise<void>;
  updateResearchProject: (id: string, project: Partial<ResearchProject>) => Promise<void>;
  deleteResearchProject: (id: string) => Promise<void>;
  logTimesheetHours: (projectId: string, entry: Omit<TimesheetEntry, 'id' | 'createdDate'>) => Promise<void>;
  approveTimesheetEntry: (entryId: string, approvedBy: string) => Promise<void>;
  deleteTimesheetEntry: (entryId: string) => Promise<void>;
}

// Cache duration: 30 seconds - prevents redundant fetches on tab switches
const CACHE_DURATION = 30 * 1000;

export const useResearchStore = create<ResearchState>((set, get) => ({
  researchProjects: [],
  researchTimesheets: [],
  loading: false,
  lastFetched: null,

  fetchResearchProjects: async (force = false) => {
    const { lastFetched, loading } = get();
    const now = Date.now();

    // Skip if already loading or if data is fresh (unless forced)
    if (loading) return;
    if (!force && lastFetched && (now - lastFetched) < CACHE_DURATION) {
      return;
    }

    set({ loading: true });
    try {
      const projects = await projectService.getAllResearchProjects();
      set({
        researchProjects: Array.isArray(projects) ? projects : [],
        lastFetched: Date.now()
      });
    } catch (error) {
      console.error('Error fetching research projects:', error);
      // Don't wipe data on error - keep stale data
    } finally {
      set({ loading: false });
    }
  },

  fetchResearchTimesheets: async (filters?: any) => {
    set({ loading: true });
    try {
      const timesheets = await projectService.getResearchTimesheets(filters);
      set({ researchTimesheets: Array.isArray(timesheets) ? timesheets : [] });
    } catch (error) {
      console.error('Error fetching research timesheets:', error);
    } finally {
      set({ loading: false });
    }
  },

  addResearchProject: async (project) => {
    try {
      const newProject = await projectService.createResearchProject(project);
      // Optimistic update: add to store directly instead of refetching
      set((state) => ({
        researchProjects: [newProject, ...state.researchProjects],
        lastFetched: Date.now()
      }));
    } catch (error) {
      console.error('Error creating research project:', error);
      throw error;
    }
  },

  updateResearchProject: async (id, project) => {
    try {
      const updatedProject = await projectService.updateResearchProject(id, project);
      // Optimistic update: update in store directly
      set((state) => ({
        researchProjects: state.researchProjects.map((p) =>
          p.id === id ? { ...p, ...updatedProject } : p
        ),
        lastFetched: Date.now()
      }));
    } catch (error) {
      console.error('Error updating research project:', error);
      throw error;
    }
  },

  deleteResearchProject: async (id) => {
    try {
      await projectService.deleteResearchProject(id);
      // Optimistic update: remove from store directly
      set((state) => ({
        researchProjects: state.researchProjects.filter((p) => p.id !== id),
        lastFetched: Date.now()
      }));
    } catch (error) {
      console.error('Error deleting research project:', error);
      throw error;
    }
  },

  logTimesheetHours: async (projectId, entry) => {
    try {
      const newEntry = await projectService.logResearchTimesheet({ ...entry, projectId });
      // Add timesheet to store directly
      set((state) => ({
        researchTimesheets: [newEntry, ...state.researchTimesheets]
      }));
      // Only refresh projects if we need updated totals (optional background refresh)
      get().fetchResearchProjects(true);
    } catch (error) {
      console.error('Error logging timesheet hours:', error);
      throw error;
    }
  },

  approveTimesheetEntry: async (entryId, approvedBy) => {
    try {
      await projectService.approveResearchTimesheet(entryId, approvedBy);
      // Update timesheet status in store directly
      set((state) => ({
        researchTimesheets: state.researchTimesheets.map((t) =>
          t.id === entryId ? { ...t, status: 'approved' as const, approvedBy } : t
        )
      }));
    } catch (error) {
      console.error('Error approving timesheet entry:', error);
      throw error;
    }
  },

  deleteTimesheetEntry: async (entryId) => {
    try {
      await projectService.deleteResearchTimesheet(entryId);
      // Remove from store directly
      set((state) => ({
        researchTimesheets: state.researchTimesheets.filter((t) => t.id !== entryId)
      }));
      // Background refresh for updated totals
      get().fetchResearchProjects(true);
    } catch (error) {
      console.error('Error deleting timesheet entry:', error);
      throw error;
    }
  },
}));
