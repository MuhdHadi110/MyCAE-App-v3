export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PowerAutomateConfig {
  baseUrl?: string;
  endpoints: {
    // Inventory
    getAllInventory: string;
    getInventoryById: string;
    createInventory: string;
    updateInventory: string;
    deleteInventory: string;
    searchInventory: string;
    filterInventory: string;
    getLowStock: string;
    scanBarcode: string;

    // Maintenance
    getAllMaintenance: string;
    getMaintenanceById: string;
    getMaintenanceByStatus: string;
    createMaintenance: string;
    updateMaintenance: string;
    deleteMaintenance: string;

    // Activity
    logActivity: string;
    getRecentActivity: string;

    // Categories
    getAllCategories: string;
    createCategory: string;
  };
}
