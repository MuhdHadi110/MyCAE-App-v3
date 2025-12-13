/**
 * Received Purchase Order Types (Client POs)
 * POs received FROM clients
 */

import type { FileAttachment } from './fileAttachment.types';

export type ReceivedPOStatus = 'received' | 'in-progress' | 'invoiced' | 'paid' | 'cancelled';

export interface ReceivedPO {
  id: string;
  poNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectCode?: string;
  projectTitle?: string;
  description: string;
  amount: number;
  currency: string; // 'RM', 'USD', etc.
  receivedDate: string;
  dueDate?: string;
  expectedDeliveryDate?: string;
  status: ReceivedPOStatus;

  // Payment tracking
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paidDate?: string;
  paidAmount?: number;

  // Metadata
  attachments: FileAttachment[];
  createdBy: string;
  createdByName: string;
  createdDate: string;
  lastUpdated: string;
  notes?: string;
}

export interface IssuedPO {
  id: string;
  poNumber: string;
  vendor: string;
  vendorContact?: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  projectCode?: string;
  category?: 'equipment' | 'software' | 'service' | 'supplies' | 'other';

  // Approval workflow
  createdBy: string;
  createdByName: string;
  createdDate: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectedReason?: string;

  // Payment
  paidDate?: string;
  receiptDate?: string;

  // Documents
  attachments: FileAttachment[];
  lastUpdated: string;
  notes?: string;
}
