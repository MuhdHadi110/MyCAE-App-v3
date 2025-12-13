// @ts-nocheck
import { APIResponse } from '../types/api.types';
import { InventoryItem, InventoryFilters, Category } from '../types/inventory.types';
import { MaintenanceTicket } from '../types/maintenance.types';
import { ActivityLog } from '../types/activity.types';
import { generateId } from '../lib/utils';

// Mock data storage
let mockInventory: InventoryItem[] = [
  {
    id: '1',
    title: 'Laptop - Dell XPS 15',
    sku: 'LAP-001',
    category: 'Electronics',
    quantity: 12,
    minimumStock: 5,
    location: 'Warehouse A',
    unitOfMeasure: 'Unit',
    cost: 1200,
    price: 1500,
    supplier: 'Dell Inc.',
    status: 'Active',
    barcode: '123456789012',
    notes: 'High-performance laptops for office use',
    lastUpdated: new Date().toISOString(),
    createdBy: 'Admin',
  },
  {
    id: '2',
    title: 'Office Chair - Ergonomic',
    sku: 'FURN-002',
    category: 'Furniture',
    quantity: 3,
    minimumStock: 10,
    location: 'Warehouse B',
    unitOfMeasure: 'Unit',
    cost: 200,
    price: 350,
    supplier: 'Office Depot',
    status: 'Active',
    barcode: '234567890123',
    notes: 'Low stock - reorder needed',
    lastUpdated: new Date().toISOString(),
    createdBy: 'Admin',
  },
  {
    id: '3',
    title: 'Wireless Mouse',
    sku: 'ACC-003',
    category: 'Accessories',
    quantity: 45,
    minimumStock: 20,
    location: 'Warehouse A',
    unitOfMeasure: 'Unit',
    cost: 15,
    price: 25,
    supplier: 'Logitech',
    status: 'Active',
    barcode: '345678901234',
    lastUpdated: new Date().toISOString(),
    createdBy: 'Admin',
  },
  {
    id: '4',
    title: 'Monitor - 27" 4K',
    sku: 'MON-004',
    category: 'Electronics',
    quantity: 8,
    minimumStock: 5,
    location: 'Warehouse A',
    unitOfMeasure: 'Unit',
    cost: 300,
    price: 450,
    supplier: 'Samsung',
    status: 'Active',
    barcode: '456789012345',
    lastUpdated: new Date().toISOString(),
    createdBy: 'Admin',
  },
  {
    id: '5',
    title: 'Desk Lamp',
    sku: 'FURN-005',
    category: 'Furniture',
    quantity: 2,
    minimumStock: 15,
    location: 'Warehouse B',
    unitOfMeasure: 'Unit',
    cost: 25,
    price: 40,
    supplier: 'IKEA',
    status: 'Active',
    barcode: '567890123456',
    notes: 'Critical low stock',
    lastUpdated: new Date().toISOString(),
    createdBy: 'Admin',
  },
];

let mockMaintenance: MaintenanceTicket[] = [
  {
    id: '1',
    title: 'Laptop screen flickering',
    itemId: '1',
    itemName: 'Laptop - Dell XPS 15',
    description: 'Screen flickers intermittently, needs inspection',
    status: 'Pending',
    priority: 'High',
    assignedTo: 'Tech Team',
    createdDate: new Date().toISOString(),
    category: 'Repair',
  },
  {
    id: '2',
    title: 'Chair wheel replacement',
    itemId: '2',
    itemName: 'Office Chair - Ergonomic',
    description: 'Two wheels are broken and need replacement',
    status: 'In Progress',
    priority: 'Medium',
    assignedTo: 'Maintenance',
    createdDate: new Date(Date.now() - 86400000).toISOString(),
    category: 'Maintenance',
  },
  {
    id: '3',
    title: 'Monitor calibration',
    itemId: '4',
    itemName: 'Monitor - 27" 4K',
    description: 'Color calibration required for design work',
    status: 'Completed',
    priority: 'Low',
    assignedTo: 'IT Support',
    createdDate: new Date(Date.now() - 172800000).toISOString(),
    completedDate: new Date(Date.now() - 86400000).toISOString(),
    category: 'Calibration',
  },
];

let mockActivity: ActivityLog[] = [
  {
    id: '1',
    action: 'Created',
    itemId: '5',
    itemName: 'Desk Lamp',
    user: 'Admin',
    timestamp: new Date().toISOString(),
    details: 'New item added to inventory',
  },
  {
    id: '2',
    action: 'Updated',
    itemId: '2',
    itemName: 'Office Chair - Ergonomic',
    user: 'Admin',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: 'Quantity updated: 5 → 3',
  },
  {
    id: '3',
    action: 'Scanned',
    itemId: '3',
    itemName: 'Wireless Mouse',
    user: 'John Doe',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Item scanned for checkout',
  },
];

let mockCategories: Category[] = [
  { id: '1', name: 'Electronics', description: 'Electronic devices and components', icon: '💻', color: '#3B82F6' },
  { id: '2', name: 'Furniture', description: 'Office furniture and fixtures', icon: '🪑', color: '#10B981' },
  { id: '3', name: 'Accessories', description: 'Computer and office accessories', icon: '🖱️', color: '#F59E0B' },
  { id: '4', name: 'Supplies', description: 'Office supplies and consumables', icon: '📦', color: '#8B5CF6' },
];

class MockDataService {
  // Simulate network delay
  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }

  // Inventory
  async getAllInventory(): Promise<APIResponse<InventoryItem[]>> {
    await this.delay();
    return { success: true, data: [...mockInventory] };
  }

  async getInventoryById(id: string): Promise<APIResponse<InventoryItem>> {
    await this.delay();
    const item = mockInventory.find(i => i.id === id);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: item };
  }

  async createInventory(item: Omit<InventoryItem, 'id'>): Promise<APIResponse<InventoryItem>> {
    await this.delay();
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      lastUpdated: new Date().toISOString(),
    };
    mockInventory.push(newItem);
    return { success: true, data: newItem };
  }

  async updateInventory(id: string, updates: Partial<InventoryItem>): Promise<APIResponse<InventoryItem>> {
    await this.delay();
    const index = mockInventory.findIndex(i => i.id === id);
    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }
    mockInventory[index] = {
      ...mockInventory[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    return { success: true, data: mockInventory[index] };
  }

  async deleteInventory(id: string): Promise<APIResponse<void>> {
    await this.delay();
    const index = mockInventory.findIndex(i => i.id === id);
    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }
    mockInventory.splice(index, 1);
    return { success: true };
  }

  async searchInventory(filters: InventoryFilters): Promise<APIResponse<InventoryItem[]>> {
    await this.delay();
    let results = [...mockInventory];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(
        item =>
          item.title.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search) ||
          item.barcode?.includes(search)
      );
    }

    if (filters.category) {
      results = results.filter(item => item.category === filters.category);
    }

    if (filters.location) {
      results = results.filter(item => item.location === filters.location);
    }

    if (filters.status) {
      results = results.filter(item => item.status === filters.status);
    }

    if (filters.lowStockOnly) {
      results = results.filter(item => item.quantity <= item.minimumStock);
    }

    return { success: true, data: results };
  }

  async getLowStockItems(): Promise<APIResponse<InventoryItem[]>> {
    await this.delay();
    const lowStock = mockInventory.filter(item => item.quantity <= item.minimumStock);
    return { success: true, data: lowStock };
  }

  async scanBarcode(barcode: string): Promise<APIResponse<InventoryItem>> {
    await this.delay();
    const item = mockInventory.find(i => i.barcode === barcode);
    if (!item) {
      return { success: false, error: 'Item not found with this barcode' };
    }
    return { success: true, data: item };
  }

  // Maintenance
  async getAllMaintenance(): Promise<APIResponse<MaintenanceTicket[]>> {
    await this.delay();
    return { success: true, data: [...mockMaintenance] };
  }

  async getMaintenanceById(id: string): Promise<APIResponse<MaintenanceTicket>> {
    await this.delay();
    const ticket = mockMaintenance.find(t => t.id === id);
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }
    return { success: true, data: ticket };
  }

  async createMaintenance(ticket: Omit<MaintenanceTicket, 'id'>): Promise<APIResponse<MaintenanceTicket>> {
    await this.delay();
    const newTicket: MaintenanceTicket = {
      ...ticket,
      id: generateId(),
      createdDate: new Date().toISOString(),
    };
    mockMaintenance.push(newTicket);
    return { success: true, data: newTicket };
  }

  async updateMaintenance(id: string, updates: Partial<MaintenanceTicket>): Promise<APIResponse<MaintenanceTicket>> {
    await this.delay();
    const index = mockMaintenance.findIndex(t => t.id === id);
    if (index === -1) {
      return { success: false, error: 'Ticket not found' };
    }
    mockMaintenance[index] = { ...mockMaintenance[index], ...updates };
    return { success: true, data: mockMaintenance[index] };
  }

  async deleteMaintenance(id: string): Promise<APIResponse<void>> {
    await this.delay();
    const index = mockMaintenance.findIndex(t => t.id === id);
    if (index === -1) {
      return { success: false, error: 'Ticket not found' };
    }
    mockMaintenance.splice(index, 1);
    return { success: true };
  }

  // Activity
  async logActivity(activity: Omit<ActivityLog, 'id'>): Promise<APIResponse<ActivityLog>> {
    await this.delay();
    const newActivity: ActivityLog = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    mockActivity.unshift(newActivity);
    return { success: true, data: newActivity };
  }

  async getRecentActivity(limit: number = 10): Promise<APIResponse<ActivityLog[]>> {
    await this.delay();
    return { success: true, data: mockActivity.slice(0, limit) };
  }

  // Categories
  async getAllCategories(): Promise<APIResponse<Category[]>> {
    await this.delay();
    return { success: true, data: [...mockCategories] };
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<APIResponse<Category>> {
    await this.delay();
    const newCategory: Category = {
      ...category,
      id: generateId(),
    };
    mockCategories.push(newCategory);
    return { success: true, data: newCategory };
  }
}

export const mockDataService = new MockDataService();
