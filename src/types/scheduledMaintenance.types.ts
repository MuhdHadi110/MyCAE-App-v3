export type MaintenanceType = 'calibration' | 'inspection' | 'servicing' | 'replacement' | 'other';

export type InventoryAction = 'deduct' | 'status-only' | 'none';

export interface ScheduledMaintenance {
  id: string;
  item_id: string;
  item?: {
    id: string;
    title: string;
    sku: string;
    category: string;
    location: string;
  };
  maintenance_type: MaintenanceType;
  description?: string;
  scheduled_date: string;
  is_completed: boolean;
  completed_date?: string;
  completed_by?: string;
  completedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  ticket_id?: string;
  reminder_14_sent: boolean;
  reminder_7_sent: boolean;
  reminder_1_sent: boolean;
  inventory_action: InventoryAction;
  quantity_affected: number;
  created_by?: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ScheduledMaintenanceFilters {
  item_id?: string;
  is_completed?: boolean;
  maintenance_type?: MaintenanceType;
  from_date?: string;
  to_date?: string;
}

export interface CreateScheduledMaintenanceDTO {
  item_id: string;
  maintenance_type: MaintenanceType;
  description?: string;
  scheduled_date: string;
  inventory_action: InventoryAction;
  quantity_affected?: number;
}

export interface UpdateScheduledMaintenanceDTO {
  maintenance_type?: MaintenanceType;
  description?: string;
  scheduled_date?: string;
  inventory_action?: InventoryAction;
  quantity_affected?: number;
}

export interface ScheduledMaintenanceStats {
  total: number;
  upcoming: number;
  overdue: number;
  completedThisMonth: number;
}

// Helper labels for display
export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  calibration: 'Calibration',
  inspection: 'Inspection',
  servicing: 'Servicing',
  replacement: 'Replacement',
  other: 'Other',
};

export const inventoryActionLabels: Record<InventoryAction, string> = {
  deduct: 'Deduct from inventory',
  'status-only': 'Mark as "In Maintenance" only',
  none: 'No change to inventory',
};

export const inventoryActionDescriptions: Record<InventoryAction, string> = {
  deduct: 'The item quantity will be reduced when maintenance starts and restored when completed.',
  'status-only': 'The item will be marked as "In Maintenance" but quantity remains unchanged.',
  none: 'No changes will be made to inventory quantity or status.',
};
