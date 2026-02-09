import { create } from 'zustand';
import { InventoryItem, InventoryFilters, InventoryStats } from '../types/inventory.types';
import inventoryService from '../services/inventory.service';
import toast from 'react-hot-toast';

interface InventoryStore {
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  filters: InventoryFilters;
  loading: boolean;
  stats: InventoryStats | null;
  viewMode: 'grouped' | 'flat';

  // Actions
  fetchInventory: () => Promise<void>;
  fetchInventoryById: (id: string) => Promise<InventoryItem | null>;
  createItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setFilters: (filters: InventoryFilters) => void;
  applyFilters: () => void;
  calculateStats: () => void;
  scanBarcode: (barcode: string) => Promise<InventoryItem | null>;
  setViewMode: (mode: 'grouped' | 'flat') => void;
}

const getInitialViewMode = (): 'grouped' | 'flat' => {
  const saved = localStorage.getItem('inventoryViewMode');
  return saved === 'flat' ? 'flat' : 'grouped';
};

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  filteredItems: [],
  filters: {},
  loading: false,
  stats: null,
  viewMode: getInitialViewMode(),

  fetchInventory: async () => {
    set({ loading: true });
    try {
      const items = await inventoryService.getInventoryItems();
      set({ items, filteredItems: items });
      get().calculateStats();
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      set({ loading: false });
    }
  },

  fetchInventoryById: async (id: string) => {
    const { items } = get();
    return items.find(item => item.id === id) || null;
  },

  createItem: async (item: Omit<InventoryItem, 'id'>) => {
    set({ loading: true });
    try {
      const created = await inventoryService.createInventoryItem(item);
      set(state => ({
        items: [...state.items, created],
        filteredItems: [...state.filteredItems, created],
      }));
      get().calculateStats();
      toast.success('Item created');
    } catch (error) {
      toast.error('Failed to create item');
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    set({ loading: true });
    try {
      await inventoryService.updateInventoryItem(id, updates);
      set(state => ({
        items: state.items.map(item => (item.id === id ? { ...item, ...updates } : item)),
        filteredItems: state.filteredItems.map(item => (item.id === id ? { ...item, ...updates } : item)),
      }));
      get().calculateStats();
      toast.success('Item updated');
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (id: string) => {
    set({ loading: true });
    try {
      await inventoryService.deleteInventoryItem(id);
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        filteredItems: state.filteredItems.filter(item => item.id !== id),
      }));
      get().calculateStats();
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters: InventoryFilters) => {
    set({ filters });
    get().applyFilters();
  },

  applyFilters: () => {
    const { items, filters } = get();
    let filtered = [...items];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search) ||
          item.barcode?.toLowerCase().includes(search)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.lowStockOnly) {
      filtered = filtered.filter(item => item.quantity <= item.minimumStock);
    }

    set({ filteredItems: filtered });
  },

  calculateStats: () => {
    const { items } = get();
    const stats: InventoryStats = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      lowStockItems: items.filter(item => item.quantity <= item.minimumStock).length,
      categories: new Set(items.map(item => item.category)).size,
      recentActivity: 0, // This would come from activity store
    };
    set({ stats });
  },

  scanBarcode: async (barcode: string) => {
    try {
      const items = await inventoryService.getInventoryItems({ search: barcode });
      if (items.length > 0) {
        toast.success(`Found: ${items[0].title}`);
        return items[0];
      } else {
        toast.error('Item not found');
        return null;
      }
    } catch (error) {
      toast.error('An error occurred while scanning');
      return null;
    }
  },

  setViewMode: (mode: 'grouped' | 'flat') => {
    localStorage.setItem('inventoryViewMode', mode);
    set({ viewMode: mode });
  },
}));
