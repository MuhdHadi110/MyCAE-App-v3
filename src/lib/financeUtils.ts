import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

/**
 * Finance Utilities
 * Shared utilities for finance-related screens and components
 */

export type StatusBadgeConfig = {
  label: string;
  color: string;
  icon: typeof FileText;
};

export const STATUS_BADGES: Record<string, StatusBadgeConfig> = {
  received: { label: 'Received', color: 'bg-blue-100 text-blue-800', icon: FileText },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  invoiced: { label: 'Invoiced', color: 'bg-purple-100 text-purple-800', icon: FileText },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  viewed: { label: 'Viewed', color: 'bg-primary-100 text-indigo-800', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: XCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  verified: { label: 'Verified', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800', icon: XCircle },
};

export function getStatusBadge(status: string): StatusBadgeConfig {
  return STATUS_BADGES[status] || STATUS_BADGES.pending;
}

export function formatCurrency(amount: number, currency: string = 'RM'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
}
