export interface ActivityLog {
  id: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Scanned' | 'CheckedOut' | 'CheckedIn';
  description: string;
  itemId?: string;
  itemName?: string;
  user: string;
  timestamp: string;
  details?: string;
  changeType?: string;
}

export interface ActivityFilters {
  action?: string;
  user?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
