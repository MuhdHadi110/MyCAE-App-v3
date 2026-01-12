export type InventoryLastAction = 'added' | 'returned' | 'checked-out' | 'updated';

export interface InventoryItem {
  id: string;
  title: string;
  sku: string;
  category: string;
  quantity: number;
  minimumStock: number;
  location: string;
  unitOfMeasure: string;
  cost: number;
  price: number;
  supplier: string;
  status: 'Active' | 'Inactive' | 'Discontinued';
  imageURL?: string;
  barcode?: string;
  notes?: string;
  lastUpdated: string;
  createdBy: string;
  lastAction?: InventoryLastAction;
  lastActionDate?: string;
  lastActionBy?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  location?: string;
  status?: string;
  lowStockOnly?: boolean;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  categories: number;
  recentActivity: number;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ row: number; error: string }>;
}

export interface BulkCheckout {
  masterBarcode: string;
  items: Array<{
    barcode: string;
    quantity: number;
  }>;
  checkedOutBy: string;
  checkedOutDate: string;
  expectedReturnDate?: string;
  purpose?: string;
  notes?: string;
}

export interface CheckoutItem {
  id: string;
  itemId: string;
  itemName: string;
  barcode: string;
  quantity: number;
  checkedOutBy: string;
  checkedOutDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'checked-out' | 'returned' | 'overdue';
  masterBarcode?: string;
}
