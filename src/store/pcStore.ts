import { create } from 'zustand';
import apiService from '../services/api.service';
import type { PC } from '../types/pc.types';

interface PCStore {
  pcs: PC[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPCs: (filters?: any) => Promise<void>;
  addPC: (pc: Omit<PC, 'id' | 'lastUpdated'>) => Promise<void>;
  assignPC: (pcId: string, assignedTo: string, assignedToEmail: string, notes: string | undefined, softwareUsed: string[]) => Promise<void>;
  releasePC: (pcId: string) => Promise<void>;
  updatePC: (id: string, updates: Partial<PC>) => Promise<void>;
  deletePC: (id: string) => Promise<void>;
  getPCsAssignedTo: (userId: string) => Promise<void>;
}

export const usePCStore = create<PCStore>((set) => ({
  pcs: [],
  loading: false,
  error: null,

  fetchPCs: async (filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getAllComputers(filters) as any;
      const computersData = Array.isArray(response) ? response : (response?.data as any) || [];

      // Map backend Computer format to frontend PC format
      const pcs = computersData.map((computer: any) => ({
        id: computer.id,
        name: computer.device_name || computer.name,
        location: computer.location || '',
        status: computer.status === 'active' ? 'available' : (computer.assigned_to ? 'assigned' : 'maintenance'),
        assignedTo: computer.assignee?.displayName || computer.assignedTo,
        assignedToEmail: computer.assignee?.email || computer.assignedToEmail,
        assignedDate: computer.updated_at,
        notes: computer.notes,
        softwareUsed: computer.installed_software ? computer.installed_software.split(',').filter((s: string) => s.trim()) : [],
        lastUpdated: computer.updated_at || new Date().toISOString(),
      }));
      set({ pcs: Array.isArray(pcs) ? pcs : [], loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch PCs';
      console.error('Error fetching PCs:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  addPC: async (pcData) => {
    try {
      set({ loading: true, error: null });
      const newComputer = await apiService.createComputer(pcData);

      // Map backend Computer format to frontend PC format
      const newPC: PC = {
        id: newComputer.id,
        name: newComputer.device_name || newComputer.name,
        location: newComputer.location || '',
        status: newComputer.status === 'active' ? 'available' : (newComputer.assigned_to ? 'assigned' : 'maintenance'),
        assignedTo: newComputer.assignee?.displayName || newComputer.assignedTo,
        assignedToEmail: newComputer.assignee?.email || newComputer.assignedToEmail,
        assignedDate: newComputer.updated_at,
        notes: newComputer.notes,
        softwareUsed: newComputer.installed_software ? newComputer.installed_software.split(',').filter((s: string) => s.trim()) : [],
        lastUpdated: newComputer.updated_at || new Date().toISOString(),
      };

      set((state) => ({
        pcs: [...state.pcs, newPC],
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add PC';
      console.error('Error adding PC:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  assignPC: async (pcId, assignedTo, assignedToEmail, notes, softwareUsed) => {
    try {
      set({ loading: true, error: null });
      const updatedComputer = await apiService.assignComputerToUser(pcId, assignedTo);

      // Map backend Computer format to frontend PC format
      const mappedPC: PC = {
        id: updatedComputer.id,
        name: updatedComputer.device_name || updatedComputer.name,
        location: updatedComputer.location || '',
        status: 'assigned',
        assignedTo: updatedComputer.assignee?.displayName || assignedTo,
        assignedToEmail: updatedComputer.assignee?.email || assignedToEmail,
        assignedDate: new Date().toISOString(),
        notes: updatedComputer.notes,
        softwareUsed,
        lastUpdated: updatedComputer.updated_at || new Date().toISOString(),
      };

      set((state) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === pcId ? mappedPC : pc
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to assign PC';
      console.error('Error assigning PC:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  releasePC: async (pcId) => {
    try {
      set({ loading: true, error: null });
      const updatedComputer = await apiService.unassignComputer(pcId);

      // Map backend Computer format to frontend PC format
      const mappedPC: PC = {
        id: updatedComputer.id,
        name: updatedComputer.device_name || updatedComputer.name,
        location: updatedComputer.location || '',
        status: 'available',
        assignedDate: updatedComputer.updated_at,
        notes: updatedComputer.notes,
        softwareUsed: [],
        lastUpdated: updatedComputer.updated_at || new Date().toISOString(),
      };

      set((state) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === pcId ? mappedPC : pc
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to release PC';
      console.error('Error releasing PC:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  updatePC: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedComputer = await apiService.updateComputer(id, updates);

      // Map backend Computer format to frontend PC format
      const mappedPC: PC = {
        id: updatedComputer.id,
        name: updatedComputer.device_name || updatedComputer.name,
        location: updatedComputer.location || '',
        status: updatedComputer.status === 'active' ? 'available' : (updatedComputer.assigned_to ? 'assigned' : 'maintenance'),
        assignedTo: updatedComputer.assignee?.displayName || updatedComputer.assignedTo,
        assignedToEmail: updatedComputer.assignee?.email || updatedComputer.assignedToEmail,
        assignedDate: updatedComputer.updated_at,
        notes: updatedComputer.notes,
        softwareUsed: updatedComputer.installed_software ? updatedComputer.installed_software.split(',').filter((s: string) => s.trim()) : [],
        lastUpdated: updatedComputer.updated_at || new Date().toISOString(),
      };

      set((state) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === id ? mappedPC : pc
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update PC';
      console.error('Error updating PC:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  deletePC: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiService.deleteComputer(id);
      set((state) => ({
        pcs: state.pcs.filter((pc) => pc.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete PC';
      console.error('Error deleting PC:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  getPCsAssignedTo: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.getComputersAssignedTo(userId) as any;
      const computersData = Array.isArray(response) ? response : (response?.data as any) || [];

      // Map backend Computer format to frontend PC format
      const pcs = computersData.map((computer: any) => ({
        id: computer.id,
        name: computer.device_name || computer.name,
        location: computer.location || '',
        status: 'assigned',
        assignedTo: computer.assignee?.displayName || computer.assignedTo,
        assignedToEmail: computer.assignee?.email || computer.assignedToEmail,
        assignedDate: computer.updated_at,
        notes: computer.notes,
        softwareUsed: computer.installed_software ? computer.installed_software.split(',').filter((s: string) => s.trim()) : [],
        lastUpdated: computer.updated_at || new Date().toISOString(),
      }));

      set({ pcs: Array.isArray(pcs) ? pcs : [], loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch assigned PCs';
      console.error('Error fetching assigned PCs:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },
}));
