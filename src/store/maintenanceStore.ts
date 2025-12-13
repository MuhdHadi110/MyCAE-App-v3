import { create } from 'zustand';
import { MaintenanceTicket, MaintenanceFilters, MaintenanceStats } from '../types/maintenance.types';
import apiService from '../services/api.service';
import toast from 'react-hot-toast';

interface MaintenanceStore {
  tickets: MaintenanceTicket[];
  filteredTickets: MaintenanceTicket[];
  filters: MaintenanceFilters;
  loading: boolean;
  stats: MaintenanceStats | null;

  // Actions
  fetchMaintenance: () => Promise<void>;
  fetchMaintenanceById: (id: string) => Promise<MaintenanceTicket | null>;
  createTicket: (ticket: Omit<MaintenanceTicket, 'id'>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<MaintenanceTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  setFilters: (filters: MaintenanceFilters) => void;
  applyFilters: () => void;
  calculateStats: () => void;
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  tickets: [],
  filteredTickets: [],
  filters: {},
  loading: false,
  stats: null,

  fetchMaintenance: async () => {
    set({ loading: true });
    try {
      const tickets = await apiService.getAllMaintenanceTickets();
      set({ tickets, filteredTickets: tickets });
      get().calculateStats();
    } catch (error) {
      toast.error('Failed to fetch maintenance tickets');
    } finally {
      set({ loading: false });
    }
  },

  fetchMaintenanceById: async (id: string) => {
    try {
      const { tickets } = get();
      return tickets.find(t => t.id === id) || null;
    } catch (error) {
      toast.error('Failed to fetch ticket');
      return null;
    }
  },

  createTicket: async (ticket: Omit<MaintenanceTicket, 'id'>) => {
    set({ loading: true });
    try {
      const newTicket = await apiService.createMaintenanceTicket(ticket);
      set(state => ({
        tickets: [...state.tickets, newTicket],
        filteredTickets: [...state.filteredTickets, newTicket],
      }));
      get().calculateStats();
      toast.success('Ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      set({ loading: false });
    }
  },

  updateTicket: async (id: string, updates: Partial<MaintenanceTicket>) => {
    set({ loading: true });
    try {
      await apiService.updateMaintenanceTicket(id, updates);
      set(state => ({
        tickets: state.tickets.map(ticket => (ticket.id === id ? { ...ticket, ...updates } : ticket)),
        filteredTickets: state.filteredTickets.map(ticket => (ticket.id === id ? { ...ticket, ...updates } : ticket)),
      }));
      get().calculateStats();
      toast.success('Ticket updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket');
    } finally {
      set({ loading: false });
    }
  },

  deleteTicket: async (id: string) => {
    set({ loading: true });
    try {
      await apiService.deleteMaintenanceTicket(id);
      set(state => ({
        tickets: state.tickets.filter(ticket => ticket.id !== id),
        filteredTickets: state.filteredTickets.filter(ticket => ticket.id !== id),
      }));
      get().calculateStats();
      toast.success('Ticket deleted successfully');
    } catch (error) {
      toast.error('Failed to delete ticket');
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters: MaintenanceFilters) => {
    set({ filters });
    get().applyFilters();
  },

  applyFilters: () => {
    const { tickets, filters } = get();
    let filtered = [...tickets];

    if (filters.status) {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(ticket => ticket.assignedTo === filters.assignedTo);
    }

    set({ filteredTickets: filtered });
  },

  calculateStats: () => {
    const { tickets } = get();
    const stats: MaintenanceStats = {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'Pending').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      completed: tickets.filter(t => t.status === 'Completed').length,
      overdue: 0, // Would need date logic
    };
    set({ stats });
  },
}));
