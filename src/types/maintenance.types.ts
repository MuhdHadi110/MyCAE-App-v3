export interface MaintenanceTicket {
  id: string;
  title: string;
  itemId?: string;
  itemName?: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: string;
  createdDate: string;
  completedDate?: string;
  category: string;
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
