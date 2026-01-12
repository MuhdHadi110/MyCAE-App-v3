import { create } from 'zustand';
import timesheetService from '../services/api.service';
import type { Client } from '../types/client.types';

interface ClientStore {
  clients: Client[];
  loading: boolean;
  error: string | null;

  fetchClients: (filters?: any) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdDate' | 'lastUpdated'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateClientProjectCounts: (clientId: string) => Promise<void>;
}


export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async (filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await timesheetService.getAllClients(filters) as any;

      // Handle different response formats from backend
      let clients: any[] = [];

      if (Array.isArray(response)) {
        // Direct array response
        clients = response;
      } else if (response?.data) {
        // { data: [...], total, limit, offset } format
        clients = Array.isArray(response.data) ? response.data : [];
      } else {
        clients = [];
      }

      set({ clients, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch clients';
      console.error('Error fetching clients:', errorMessage);
      set({ error: errorMessage, clients: [], loading: false });
    }
  },

  addClient: async (clientData) => {
    try {
      set({ loading: true, error: null });
      const newClient = await timesheetService.createClient(clientData);
      set((state) => ({
        clients: [...state.clients, newClient],
        loading: false,
        error: null,
      }));
      // Refetch to ensure data is in sync with backend
      const response = await timesheetService.getAllClients() as any;
      let clients: any[] = [];
      if (Array.isArray(response)) {
        clients = response;
      } else if (response?.data) {
        clients = Array.isArray(response.data) ? response.data : [];
      }
      set({ clients, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add client';
      console.error('Error adding client:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  updateClient: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedClient = await timesheetService.updateClient(id, updates);
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? updatedClient : client
        ),
        loading: false,
        error: null,
      }));
      // Refetch to ensure data is in sync with backend
      const response = await timesheetService.getAllClients() as any;
      let clients: any[] = [];
      if (Array.isArray(response)) {
        clients = response;
      } else if (response?.data) {
        clients = Array.isArray(response.data) ? response.data : [];
      }
      set({ clients, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update client';
      console.error('Error updating client:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  deleteClient: async (id) => {
    try {
      set({ loading: true, error: null });
      await timesheetService.deleteClient(id);
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        loading: false,
        error: null,
      }));
      // Refetch to ensure data is in sync with backend
      const response = await timesheetService.getAllClients() as any;
      let clients: any[] = [];
      if (Array.isArray(response)) {
        clients = response;
      } else if (response?.data) {
        clients = Array.isArray(response.data) ? response.data : [];
      }
      set({ clients, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete client';
      console.error('Error deleting client:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  updateClientProjectCounts: async (clientId: string) => {
    try {
      // Get current state to access project store
      const currentClients = (window as any).__clientStoreState?.clients || [];

      // Find the client to update
      const client = currentClients.find((c: Client) => c.id === clientId);
      if (!client) return;

      // Update the client with current counts
      // Note: This will be synced when projects are fetched
      set({ loading: false });
    } catch (error: any) {
      console.error('Error updating client project counts:', error);
    }
  },
}));
