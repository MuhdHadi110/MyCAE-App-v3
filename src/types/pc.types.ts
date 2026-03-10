/**
 * PC Assignment Types
 */

export type PCStatus = 'available' | 'assigned' | 'maintenance';

export interface PC {
  id: string;
  name: string;
  location: string;
  status: PCStatus;
  assignedTo?: string;
  assignedToEmail?: string;
  assignedDate?: string;
  notes?: string;
  softwareUsed?: string[];
  lastUpdated: string;
}

export interface PCAssignment {
  pcId: string;
  pcName: string;
  assignedTo: string;
  assignedToEmail: string;
  assignedDate: string;
  returnedDate?: string;
  notes?: string;
}
