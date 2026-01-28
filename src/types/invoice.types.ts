/**
 * Invoice Types (Outgoing Invoices to Clients)
 */

import type { FileAttachment } from './fileAttachment.types';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;

  // Company information
  companyId: string;
  clientName: string;
  clientAddress?: string;
  clientContact?: string;

  // Project linkage
  projectId?: string;
  projectCode?: string;
  projectTitle?: string;

  // PO linkage
  receivedPOId?: string;
  receivedPONumber?: string;

  // Invoice details
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;

  // Line items
  lineItems: InvoiceLineItem[];

  // Amounts
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string; // 'RM', 'USD', etc.

  // Payment tracking
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  balanceDue: number;

  // Documents
  attachments: FileAttachment[]; // Generated invoice PDFs, receipts

  // Metadata
  createdBy: string;
  createdByName: string;
  createdDate: string;
  sentDate?: string;
  viewedDate?: string;
  lastUpdated: string;

  // Notes
  notes?: string;
  termsAndConditions?: string;
}

// Helper to calculate invoice from timesheets
export interface InvoiceCalculation {
  projectId: string;
  totalHours: number;
  hourlyRate: number;
  laborCost: number;
  equipmentCost?: number;
  materialCost?: number;
  subtotal: number;
  tax: number;
  total: number;
}
