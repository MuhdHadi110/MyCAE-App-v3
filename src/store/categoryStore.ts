import { create } from 'zustand';
import apiService from '../services/api.service';
import { Category } from '../types/inventory.types';

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
}

// Default categories (fallback)
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Equipment', description: 'General equipment' },
  { id: '2', name: 'Office Supplies', description: 'Office supplies and furniture' },
  { id: '3', name: 'Electronics', description: 'Electronic devices' },
  { id: '4', name: 'Tools', description: 'Tools and hardware' },
  { id: '5', name: 'Safety', description: 'Safety equipment' },
];

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: DEFAULT_CATEGORIES,
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const response: any = await apiService.getAllCategories();
      const categories = Array.isArray(response) ? response : (response?.data || DEFAULT_CATEGORIES);
      set({ categories, loading: false });
    } catch (error: any) {
      // Fall back to default categories on error
      const errorMessage = error?.message || 'Failed to fetch categories';
      console.error('Error fetching categories:', errorMessage);
      set({ categories: DEFAULT_CATEGORIES, loading: false, error: errorMessage });
    }
  },

  createCategory: async (categoryData) => {
    try {
      set({ loading: true, error: null });
      const newCategory = await apiService.createCategory(categoryData);
      set(state => ({
        categories: [...state.categories, newCategory],
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create category';
      console.error('Error creating category:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiService.deleteCategory(id);
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete category';
      console.error('Error deleting category:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedCategory = await apiService.updateCategory(id, updates);
      set(state => ({
        categories: state.categories.map(cat => cat.id === id ? updatedCategory : cat),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update category';
      console.error('Error updating category:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));
