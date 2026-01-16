import { create } from 'zustand';
import financeService from '../services/api.service';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  projectCode: string;
  clientName: string;
  amount: number;
  status: 'received' | 'in-progress' | 'invoiced' | 'paid';
  receivedDate: string;
  dueDate?: string;
  description?: string;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  currency?: string;
  amountMyr?: number;
  amountMyrAdjusted?: number;
  exchangeRate?: number;
  revisionNumber?: number;
  supersedes?: string;
  supersededBy?: string;
  project?: {
    projectCode: string;
    title: string;
    client?: {
      name: string;
    };
  };
}

interface PurchaseOrderStore {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPurchaseOrders: (filters?: any) => Promise<void>;
  createPurchaseOrder: (data: any) => Promise<void>;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
}

export const usePurchaseOrderStore = create<PurchaseOrderStore>((set) => ({
  purchaseOrders: [],
  loading: false,
  error: null,

  fetchPurchaseOrders: async (filters?: any) => {
    try {
      set({ loading: true, error: null });
      const response = await financeService.getAllPurchaseOrders(filters);
      const data = response.data || response;
      const purchaseOrders = Array.isArray(data) ? data : [];
      set({ purchaseOrders, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch purchase orders';
      console.error('Error fetching purchase orders:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  createPurchaseOrder: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await financeService.createPurchaseOrder(data);
      const newPO = response.data || response;
      set((state) => ({
        purchaseOrders: [...state.purchaseOrders, newPO],
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create purchase order';
      console.error('Error creating purchase order:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updatePurchaseOrder: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const response = await financeService.updatePurchaseOrder(id, updates);
      const updatedPO = response.data || response;
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) =>
          po.id === id ? updatedPO : po
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update purchase order';
      console.error('Error updating purchase order:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deletePurchaseOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await financeService.deletePurchaseOrder(id);
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete purchase order';
      console.error('Error deleting purchase order:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));
