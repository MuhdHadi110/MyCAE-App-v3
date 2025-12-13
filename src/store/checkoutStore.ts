import { create } from 'zustand';
import type { ExtendedCheckout, CheckoutFilters, CheckoutStats } from '../types/checkout.types';
import { getCurrentUser } from '../lib/auth';
import apiService from '../services/api.service';

interface CheckoutStore {
  checkouts: ExtendedCheckout[];
  filteredCheckouts: ExtendedCheckout[];
  filters: CheckoutFilters;
  stats: CheckoutStats;
  loading: boolean;

  // Actions
  fetchCheckouts: () => Promise<void>;
  setFilters: (filters: CheckoutFilters) => void;
  getCheckoutByMasterBarcode: (masterBarcode: string) => ExtendedCheckout | undefined;
  getMyActiveCheckouts: () => ExtendedCheckout[];
  getCheckoutStats: () => CheckoutStats;
}


export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  checkouts: [],
  filteredCheckouts: [],
  filters: { showMyCheckoutsFirst: true },
  stats: {
    totalActive: 0,
    myActive: 0,
    overdue: 0,
    partialReturns: 0,
  },
  loading: false,

  fetchCheckouts: async () => {
    set({ loading: true });

    try {
      // Fetch from backend API
      const checkouts = await apiService.getAllCheckouts();
      const currentUser = getCurrentUser();

      // Sort: current user's checkouts first
      const sorted = [...checkouts].sort((a, b) => {
        const aIsCurrentUser = a.checkedOutByEmail === currentUser.email;
        const bIsCurrentUser = b.checkedOutByEmail === currentUser.email;

        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;

        // Then sort by date (newest first)
        return new Date(b.checkedOutDate).getTime() - new Date(a.checkedOutDate).getTime();
      });

      set({
        checkouts: sorted,
        filteredCheckouts: sorted,
      });

      // Update stats
      get().getCheckoutStats();
    } catch (error) {
      console.error('Failed to fetch checkouts:', error);
      set({
        checkouts: [],
        filteredCheckouts: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters: CheckoutFilters) => {
    set({ filters });

    const { checkouts } = get();
    const currentUser = getCurrentUser();

    let filtered = [...checkouts];

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Filter by user
    if (filters.userId) {
      filtered = filtered.filter(c => c.checkedOutByEmail === filters.userId);
    }

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.masterBarcode.toLowerCase().includes(search) ||
        c.purpose?.toLowerCase().includes(search) ||
        c.checkedOutBy.toLowerCase().includes(search) ||
        c.items.some(item => item.itemName.toLowerCase().includes(search))
      );
    }

    // Sort: current user first if enabled
    if (filters.showMyCheckoutsFirst) {
      filtered.sort((a, b) => {
        const aIsCurrentUser = a.checkedOutByEmail === currentUser.email;
        const bIsCurrentUser = b.checkedOutByEmail === currentUser.email;

        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;
        return 0;
      });
    }

    set({ filteredCheckouts: filtered });
  },

  getCheckoutByMasterBarcode: (masterBarcode: string) => {
    const { checkouts } = get();
    return checkouts.find(c => c.masterBarcode === masterBarcode);
  },

  getMyActiveCheckouts: () => {
    const { checkouts } = get();
    const currentUser = getCurrentUser();

    return checkouts.filter(c =>
      c.checkedOutByEmail === currentUser.email &&
      (c.status === 'active' || c.status === 'partial-return' || c.status === 'overdue')
    );
  },

  getCheckoutStats: () => {
    const { checkouts } = get();
    const currentUser = getCurrentUser();

    const activeCheckouts = checkouts.filter(c =>
      c.status === 'active' || c.status === 'partial-return' || c.status === 'overdue'
    );

    const stats: CheckoutStats = {
      totalActive: activeCheckouts.length,
      myActive: activeCheckouts.filter(c => c.checkedOutByEmail === currentUser.email).length,
      overdue: checkouts.filter(c => c.status === 'overdue').length,
      partialReturns: checkouts.filter(c => c.status === 'partial-return').length,
    };

    set({ stats });
    return stats;
  },
}));
