import type { InventoryAction } from './scheduledMaintenance.types';

export interface MaintenanceTicket {
  id: string;
  title: string;
  itemId?: string;
  itemName?: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdDate: string;
  completedDate?: string;
  category: string;
  // Inventory tracking fields
  scheduledMaintenanceId?: string;
  inventoryAction?: InventoryAction;
  quantityAffected?: number;
  quantityDeducted?: number;
  inventoryRestored?: boolean;
}

export interface MaintenanceFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}
