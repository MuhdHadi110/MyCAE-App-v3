/**
 * Finance Overview Types
 * Simplified finance view focusing on PO Received vs Invoiced
 */

import type { ProjectStatus } from './project.types';

/**
 * Summary of a project's financial data
 */
export interface ProjectFinanceSummary {
  projectId: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  status: ProjectStatus;

  // Revenue tracking (MYR values)
  poReceived: number;
  invoiced: number;
  outstanding: number;

  // Original currency data (for multi-currency toggle)
  poReceivedOriginal: OriginalCurrencyAmount[];
  invoicedOriginal: OriginalCurrencyAmount[];

  // Cost tracking
  manHourCost: number;
  actualHours: number;

  // Engineer breakdown for expandable rows
  engineerBreakdown: EngineerCost[];
}

/**
 * Original currency amount before MYR conversion
 */
export interface OriginalCurrencyAmount {
  amount: number;
  currency: string;
  amountMyr: number;
}

/**
 * Per-engineer cost breakdown
 */
export interface EngineerCost {
  engineerId: string;
  engineerName: string;
  role: string;
  hours: number;
  hourlyRate: number;
  totalCost: number;
}

/**
 * Aggregate totals for summary cards
 */
export interface FinanceTotals {
  totalPOReceived: number;
  totalInvoiced: number;
  totalOutstanding: number;
  totalManHourCost: number;

  // Original currency breakdown (for multi-currency toggle)
  poReceivedByCurrency: Record<string, number>;
  invoicedByCurrency: Record<string, number>;
}

/**
 * Purchase Order data structure (from API)
 */
export interface PurchaseOrderData {
  id: string;
  poNumber: string;
  projectCode: string;
  clientName: string;
  amount: number;
  currency: string;
  amountMyr: number;
  amountMyrAdjusted?: number;
  exchangeRate?: number;
  receivedDate: string;
  status: string;
  isActive: boolean;
}

/**
 * Invoice data structure (from API)
 */
export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  projectCode: string;
  projectName: string;
  amount: number;
  currency: string;
  amountMyr: number;
  exchangeRate?: number;
  invoiceDate: string;
  status: string;
  percentageOfTotal?: number;
}

/**
 * Filter state for finance overview
 */
export interface FinanceFilterState {
  statusFilter: 'all' | ProjectStatus;
  searchQuery: string;
  showOriginalCurrency: boolean;
}
