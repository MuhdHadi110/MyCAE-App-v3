import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import {
  ScheduledMaintenance,
  ScheduledMaintenanceFilters,
  CreateScheduledMaintenanceDTO,
  UpdateScheduledMaintenanceDTO,
  ScheduledMaintenanceStats,
} from '../types/scheduledMaintenance.types';
import { httpClient } from '../services/http-client';

interface ScheduledMaintenanceState {
  schedules: ScheduledMaintenance[];
  upcomingSchedules: ScheduledMaintenance[];
  overdueSchedules: ScheduledMaintenance[];
  stats: ScheduledMaintenanceStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSchedules: (filters?: ScheduledMaintenanceFilters) => Promise<void>;
  fetchUpcoming: () => Promise<void>;
  fetchOverdue: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSchedulesForItem: (itemId: string) => Promise<ScheduledMaintenance[]>;
  createSchedule: (data: CreateScheduledMaintenanceDTO) => Promise<ScheduledMaintenance>;
  updateSchedule: (id: string, data: UpdateScheduledMaintenanceDTO) => Promise<ScheduledMaintenance>;
  deleteSchedule: (id: string) => Promise<void>;
  markCompleted: (id: string) => Promise<ScheduledMaintenance>;
  createTicketFromSchedule: (id: string) => Promise<void>;
  resetError: () => void;
}

const API_BASE = '/scheduled-maintenance';

export const useScheduledMaintenanceStore = create<ScheduledMaintenanceState>((set, get) => ({
  schedules: [],
  upcomingSchedules: [],
  overdueSchedules: [],
  stats: null,
  loading: false,
  error: null,

  fetchSchedules: async (filters?: ScheduledMaintenanceFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.item_id) params.append('item_id', filters.item_id);
      if (filters?.is_completed !== undefined) params.append('is_completed', String(filters.is_completed));
      if (filters?.maintenance_type) params.append('maintenance_type', filters.maintenance_type);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);

      const queryString = params.toString();
      const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

      const response = await httpClient.api.get<ScheduledMaintenance[]>(url);
      set({ schedules: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch schedules';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchUpcoming: async () => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.get<ScheduledMaintenance[]>(`${API_BASE}/upcoming`);
      set({ upcomingSchedules: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch upcoming schedules';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchOverdue: async () => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.get<ScheduledMaintenance[]>(`${API_BASE}/overdue`);
      set({ overdueSchedules: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch overdue schedules';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStats: async () => {
    try {
      const response = await httpClient.api.get<ScheduledMaintenanceStats>(`${API_BASE}/stats`);
      set({ stats: response.data });
    } catch (error: any) {
      console.error('Failed to fetch maintenance stats:', error);
    }
  },

  fetchSchedulesForItem: async (itemId: string) => {
    try {
      const response = await httpClient.api.get<ScheduledMaintenance[]>(`${API_BASE}/item/${itemId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch item schedules:', error);
      return [];
    }
  },

  createSchedule: async (data: CreateScheduledMaintenanceDTO) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.post<ScheduledMaintenance>(API_BASE, data);
      const newSchedule = response.data;

      set((state) => ({
        schedules: [newSchedule, ...state.schedules],
        loading: false,
      }));

      toast.success('Scheduled maintenance created');

      // Refresh stats
      get().fetchStats();

      return newSchedule;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create schedule';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  updateSchedule: async (id: string, data: UpdateScheduledMaintenanceDTO) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.put<ScheduledMaintenance>(`${API_BASE}/${id}`, data);
      const updatedSchedule = response.data;

      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updatedSchedule : s)),
        upcomingSchedules: state.upcomingSchedules.map((s) => (s.id === id ? updatedSchedule : s)),
        loading: false,
      }));

      toast.success('Schedule updated');
      return updatedSchedule;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update schedule';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  deleteSchedule: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await httpClient.api.delete(`${API_BASE}/${id}`);

      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
        upcomingSchedules: state.upcomingSchedules.filter((s) => s.id !== id),
        overdueSchedules: state.overdueSchedules.filter((s) => s.id !== id),
        loading: false,
      }));

      toast.success('Schedule deleted');

      // Refresh stats
      get().fetchStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete schedule';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  markCompleted: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.post<ScheduledMaintenance>(`${API_BASE}/${id}/complete`);
      const completedSchedule = response.data;

      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? completedSchedule : s)),
        upcomingSchedules: state.upcomingSchedules.filter((s) => s.id !== id),
        overdueSchedules: state.overdueSchedules.filter((s) => s.id !== id),
        loading: false,
      }));

      toast.success('Maintenance marked as completed');

      // Refresh stats
      get().fetchStats();

      return completedSchedule;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to mark as completed';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  createTicketFromSchedule: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await httpClient.api.post(`${API_BASE}/${id}/create-ticket`);

      // Refresh schedules to update ticket_id
      await get().fetchSchedules();
      await get().fetchUpcoming();

      toast.success('Maintenance ticket created');
      set({ loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create ticket';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  resetError: () => set({ error: null }),
}));
